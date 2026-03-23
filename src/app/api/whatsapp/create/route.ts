import { prisma } from '@/lib/prisma'
import { getAuthFromRequest } from '@/lib/auth'
import { createInstance } from '@/lib/evolution'

export async function POST(request: Request) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return Response.json({ error: 'Nao autorizado' }, { status: 401 })

  const existing = await prisma.whatsAppInstance.findUnique({
    where: { organizationId: auth.organizationId },
  })

  if (existing) {
    return Response.json({ error: 'Instancia ja existe', instanceName: existing.instanceName }, { status: 409 })
  }

  const org = await prisma.organization.findUnique({ where: { id: auth.organizationId } })
  const instanceName = `aprovai-${org?.slug || auth.organizationId}`

  const result = await createInstance(instanceName)

  await prisma.whatsAppInstance.create({
    data: {
      instanceName,
      status: 'disconnected',
      organizationId: auth.organizationId,
    },
  })

  return Response.json({ instanceName, result })
}
