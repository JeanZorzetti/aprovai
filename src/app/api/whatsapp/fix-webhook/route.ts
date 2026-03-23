import { prisma } from '@/lib/prisma'
import { getAuthFromRequest } from '@/lib/auth'
import { updateWebhook, getWebhook } from '@/lib/evolution'

export async function GET(request: Request) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return Response.json({ error: 'Nao autorizado' }, { status: 401 })

  const instance = await prisma.whatsAppInstance.findUnique({
    where: { organizationId: auth.organizationId },
  })
  if (!instance) return Response.json({ error: 'Sem instancia' }, { status: 404 })

  const current = await getWebhook(instance.instanceName)
  return Response.json({ instanceName: instance.instanceName, webhook: current })
}

export async function POST(request: Request) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return Response.json({ error: 'Nao autorizado' }, { status: 401 })

  const instance = await prisma.whatsAppInstance.findUnique({
    where: { organizationId: auth.organizationId },
  })
  if (!instance) return Response.json({ error: 'Sem instancia' }, { status: 404 })

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/evolution`
  console.log('[fix-webhook] Updating to:', webhookUrl)

  const result = await updateWebhook(instance.instanceName, webhookUrl)
  return Response.json({ webhookUrl, result })
}
