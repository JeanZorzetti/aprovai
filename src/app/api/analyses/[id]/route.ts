import { prisma } from '@/lib/prisma'
import { getAuthFromRequest } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  const analysis = await prisma.analysis.findFirst({
    where: { id, organizationId: auth.organizationId },
    include: { documents: true },
  })

  if (!analysis) return Response.json({ error: 'Análise não encontrada' }, { status: 404 })

  return Response.json(analysis)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const analysis = await prisma.analysis.findFirst({
    where: { id, organizationId: auth.organizationId },
  })

  if (!analysis) return Response.json({ error: 'Análise não encontrada' }, { status: 404 })

  const updated = await prisma.analysis.update({
    where: { id },
    data: {
      decision: body.decision,
      decisionReason: body.reason || `Override manual por ${auth.name}`,
      status: body.decision,
    },
  })

  return Response.json(updated)
}
