import { prisma } from '@/lib/prisma'
import { sendMessage } from '@/lib/evolution'
import { downloadAndSaveMedia } from '@/lib/services/media'
import { analyzeDocument } from '@/lib/services/document-analysis'
import { consultarProcessos } from '@/lib/services/datajud'
import { consultarCredito } from '@/lib/services/credit-check'
import { calculateRiskScore } from '@/lib/services/scoring'

export async function processAnalysis(analysisId: string) {
  const analysis = await prisma.analysis.findUnique({
    where: { id: analysisId },
    include: {
      documents: true,
      organization: { include: { instance: true, users: true } },
    },
  })

  if (!analysis || !analysis.organization.instance) {
    console.error(`Analysis ${analysisId} not found or no WhatsApp instance`)
    return
  }

  const instanceName = analysis.organization.instance.instanceName

  try {
    // 1. Download e analisa cada documento
    const extractions: Record<string, unknown> = {}
    let extractedCpf: string | null = null
    let extractedName: string | null = null
    let extractedIncome: number | null = null
    let hasAddress = false

    for (const doc of analysis.documents) {
      // Download media se ainda pendente
      let filepath = doc.fileUrl
      if (filepath.startsWith('pending:')) {
        const messageId = filepath.replace('pending:', '')
        filepath = await downloadAndSaveMedia(
          instanceName,
          messageId,
          analysisId,
          doc.type,
          doc.mimeType
        )
        await prisma.document.update({
          where: { id: doc.id },
          data: { fileUrl: filepath },
        })
      }

      // Analisa com Claude Vision
      const extraction = await analyzeDocument(filepath, doc.type)
      extractions[doc.type] = extraction as never

      await prisma.document.update({
        where: { id: doc.id },
        data: { extractedData: extraction as never },
      })

      // Coleta dados extraídos
      if (doc.type === 'rg' && extraction.cpf) {
        extractedCpf = extraction.cpf
        extractedName = extraction.name || null
      }
      if (doc.type === 'income' && extraction.income) {
        extractedIncome = extraction.income
        if (!extractedCpf && extraction.cpf) extractedCpf = extraction.cpf
        if (!extractedName && extraction.name) extractedName = extraction.name
      }
      if (doc.type === 'address' && extraction.address) {
        hasAddress = true
      }
    }

    if (!extractedCpf) {
      await prisma.analysis.update({
        where: { id: analysisId },
        data: {
          status: 'manual_review',
          decision: 'manual_review',
          decisionReason: 'Não foi possível extrair o CPF dos documentos',
          documentData: extractions as never,
          completedAt: new Date(),
        },
      })
      await sendMessage(instanceName, analysis.applicantPhone,
        '⚠️ Não conseguimos ler o CPF nos documentos enviados. Um corretor vai entrar em contato.')
      return
    }

    // 2. Consulta DataJud (processos judiciais)
    const courtData = await consultarProcessos(extractedCpf)

    // Classificar processos
    const criminalKeywords = ['criminal', 'penal', 'crime', 'tráfico', 'roubo', 'furto', 'homicídio']
    let criminalCount = 0
    let civilCount = 0
    for (const proc of courtData.processos) {
      const isCriminal = criminalKeywords.some((kw) =>
        proc.classe.toLowerCase().includes(kw) ||
        proc.assuntos.some((a) => a.toLowerCase().includes(kw))
      )
      if (isCriminal) criminalCount++
      else civilCount++
    }

    // 3. Consulta crédito
    const creditData = await consultarCredito(extractedCpf)

    // 4. Verifica consistência
    const namesFromDocs = Object.values(extractions)
      .map((e) => ((e as Record<string, unknown>)?.name as string || '').toLowerCase().trim())
      .filter(Boolean)
    const dataConsistent = namesFromDocs.length <= 1 ||
      namesFromDocs.every((n) => {
        const first = namesFromDocs[0]
        return n.includes(first.split(' ')[0]) || first.includes(n.split(' ')[0])
      })

    // 5. Calcula score
    const scoring = calculateRiskScore({
      incomeEstimate: extractedIncome,
      rentValue: analysis.rentValue ? Number(analysis.rentValue) : null,
      courtRecordsCount: civilCount,
      criminalRecordsCount: criminalCount,
      creditScore: creditData.score,
      creditPendenciasCount: creditData.pendencias.length,
      creditPendenciasTotal: creditData.pendencias.reduce((sum, p) => sum + p.valor, 0),
      dataConsistent,
      hasFixedAddress: hasAddress,
    })

    // 6. Salva resultado
    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        status: scoring.decision,
        applicantName: extractedName,
        applicantCpf: extractedCpf,
        incomeEstimate: extractedIncome,
        riskScore: scoring.score,
        decision: scoring.decision,
        decisionReason: scoring.reasons.join('; '),
        creditData: creditData as never,
        courtData: courtData as never,
        documentData: extractions as never,
        completedAt: new Date(),
      },
    })

    // 7. Desconta crédito da organização
    await prisma.organization.update({
      where: { id: analysis.organizationId },
      data: { credits: { decrement: 1 } },
    })

    // 8. Notifica inquilino
    await sendMessage(instanceName, analysis.applicantPhone,
      '✅ Análise concluída! Seu corretor já foi notificado com o resultado.')

    // 9. Notifica corretor (admin da organização)
    const admin = analysis.organization.users.find((u) => u.role === 'admin')
    if (admin) {
      const emoji = scoring.decision === 'approved' ? '✅'
        : scoring.decision === 'rejected' ? '❌'
        : '⚠️'
      const decisionText = scoring.decision === 'approved' ? 'APROVADO'
        : scoring.decision === 'rejected' ? 'REPROVADO'
        : 'REVISÃO MANUAL'

      const orgPhone = analysis.organization.phone
      if (orgPhone) {
        await sendMessage(instanceName, orgPhone,
          `${emoji} *Análise Cadastral - ${decisionText}*\n\n` +
          `👤 ${extractedName || 'N/I'}\n` +
          `📋 CPF: ${extractedCpf}\n` +
          `💰 Renda estimada: R$ ${extractedIncome?.toLocaleString('pt-BR') || 'N/I'}\n` +
          `📊 Score: ${scoring.score}/100\n\n` +
          `${scoring.reasons.length > 0 ? '📝 *Observações:*\n' + scoring.reasons.map((r) => `• ${r}`).join('\n') : ''}` +
          `\n\nAcesse o dashboard para mais detalhes.`
        )
      }
    }

  } catch (error) {
    console.error(`Error processing analysis ${analysisId}:`, error)
    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        status: 'manual_review',
        decision: 'manual_review',
        decisionReason: `Erro no processamento: ${(error as Error).message}`,
        completedAt: new Date(),
      },
    })
    await sendMessage(instanceName, analysis.applicantPhone,
      '⚠️ Houve um problema na análise. Um corretor vai entrar em contato em breve.')
  }
}
