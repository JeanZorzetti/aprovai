import { prisma } from '@/lib/prisma'
import { getAuthFromRequest } from '@/lib/auth'

export async function GET(request: Request) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const organization = await prisma.organization.findUnique({
    where: { id: auth.organizationId },
    include: {
      _count: { select: { analyses: true, users: true } },
      instance: true,
    },
  })

  return Response.json(organization)
}
