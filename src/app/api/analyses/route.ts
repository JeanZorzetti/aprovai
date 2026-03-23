import { prisma } from '@/lib/prisma'
import { getAuthFromRequest } from '@/lib/auth'

export async function GET(request: Request) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const url = new URL(request.url)
  const status = url.searchParams.get('status')
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '20')

  const where = {
    organizationId: auth.organizationId,
    ...(status ? { status } : {}),
  }

  const [analyses, total] = await Promise.all([
    prisma.analysis.findMany({
      where,
      include: { documents: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.analysis.count({ where }),
  ])

  return Response.json({ analyses, total, page, limit })
}
