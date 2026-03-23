import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { sendMessage } from '@/lib/evolution'
import { enqueueAnalysis } from '@/lib/queue'

interface WebhookBody {
  event: string
  instance: string
  data: Record<string, unknown>
}

const WELCOME_MESSAGE = `Olá! Sou o assistente de análise cadastral.

Para iniciar sua análise de locação, preciso de 3 documentos:
1️⃣ RG ou CNH (foto frente e verso)
2️⃣ Último holerite ou extrato bancário
3️⃣ Comprovante de residência

Pode enviar o primeiro?`

const DOC_PROMPTS: Record<string, string> = {
  rg: '✅ Documento de identidade recebido! Agora envie o comprovante de renda (holerite ou extrato bancário).',
  income: '✅ Comprovante de renda recebido! Por último, envie o comprovante de residência (conta de luz, água, etc).',
  address: '✅ Todos os documentos recebidos! Analisando... ⏳\nVocê receberá o resultado em alguns minutos.',
}

export async function POST(request: Request) {
  const body = (await request.json()) as WebhookBody
  const { event, instance, data } = body

  // Connection updates
  if (event === 'CONNECTION_UPDATE' || event === 'connection.update') {
    const state = (data as { state?: string }).state
    const status = state === 'open' ? 'connected' : 'disconnected'
    await prisma.whatsAppInstance.updateMany({
      where: { instanceName: instance },
      data: { status },
    })
    return Response.json({ ok: true })
  }

  // Messages
  if (event === 'MESSAGES_UPSERT' || event === 'messages.upsert') {
    const message = data as {
      key?: { remoteJid?: string; fromMe?: boolean; id?: string }
      message?: { conversation?: string; imageMessage?: unknown; documentMessage?: unknown; documentWithCaptionMessage?: unknown }
      pushName?: string
    }

    if (message.key?.fromMe) return Response.json({ ok: true })

    const remoteJid = message.key?.remoteJid
    if (!remoteJid || remoteJid.endsWith('@g.us')) return Response.json({ ok: true })

    const phone = remoteJid.replace('@s.whatsapp.net', '')

    // Find which organization owns this instance
    const whatsappInstance = await prisma.whatsAppInstance.findUnique({
      where: { instanceName: instance },
      include: { organization: true },
    })
    if (!whatsappInstance) return Response.json({ ok: true })

    const orgId = whatsappInstance.organizationId
    const stateKey = `analysis:state:${orgId}:${phone}`

    // Check if there's media (image or document)
    const hasImage = !!message.message?.imageMessage
    const hasDocument = !!message.message?.documentMessage || !!message.message?.documentWithCaptionMessage
    const hasMedia = hasImage || hasDocument
    const textContent = message.message?.conversation || ''

    // Get or create analysis state
    const stateRaw = await redis.get(stateKey)
    let state = stateRaw ? JSON.parse(stateRaw) : null

    if (!state) {
      // New conversation - create analysis and send welcome
      const analysis = await prisma.analysis.create({
        data: {
          applicantPhone: phone,
          applicantName: (message.pushName as string) || null,
          status: 'collecting',
          organizationId: orgId,
        },
      })

      state = {
        analysisId: analysis.id,
        step: 'awaiting_rg',
        docsReceived: [],
      }
      await redis.set(stateKey, JSON.stringify(state), 'EX', 86400)
      await sendMessage(instance, phone, WELCOME_MESSAGE)
      return Response.json({ ok: true })
    }

    // If user sends media, process based on current step
    if (hasMedia && state.step !== 'complete') {
      const docType = state.step === 'awaiting_rg' ? 'rg'
        : state.step === 'awaiting_income' ? 'income'
        : state.step === 'awaiting_address' ? 'address'
        : null

      if (docType) {
        // Save document record (file will be downloaded async in phase 2)
        await prisma.document.create({
          data: {
            type: docType,
            fileUrl: `pending:${message.key?.id}`,
            mimeType: hasImage ? 'image/jpeg' : 'application/pdf',
            analysisId: state.analysisId,
          },
        })

        state.docsReceived.push(docType)

        // Advance step
        const nextStep = docType === 'rg' ? 'awaiting_income'
          : docType === 'income' ? 'awaiting_address'
          : 'complete'

        state.step = nextStep
        await redis.set(stateKey, JSON.stringify(state), 'EX', 86400)

        const prompt = DOC_PROMPTS[docType]
        await sendMessage(instance, phone, prompt)

        // All docs collected - trigger analysis
        if (nextStep === 'complete') {
          await prisma.analysis.update({
            where: { id: state.analysisId },
            data: { status: 'processing' },
          })
          await enqueueAnalysis(state.analysisId)
        }
      }

      return Response.json({ ok: true })
    }

    // Text message without media - help text
    if (textContent && !hasMedia && state.step !== 'complete') {
      const helpText = state.step === 'awaiting_rg'
        ? 'Por favor, envie uma *foto* do seu RG ou CNH.'
        : state.step === 'awaiting_income'
        ? 'Por favor, envie o *comprovante de renda* (foto ou PDF).'
        : state.step === 'awaiting_address'
        ? 'Por favor, envie o *comprovante de residência* (foto ou PDF).'
        : 'Sua análise está em andamento. Aguarde!'
      await sendMessage(instance, phone, helpText)
    }

    return Response.json({ ok: true })
  }

  return Response.json({ ok: true })
}
