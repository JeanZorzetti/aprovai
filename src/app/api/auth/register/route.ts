import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  const { name, email, password, organizationName } = await request.json()

  if (!name || !email || !password || !organizationName) {
    return Response.json({ error: 'Campos obrigatórios: name, email, password, organizationName' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return Response.json({ error: 'Email já cadastrado' }, { status: 409 })
  }

  const slug = organizationName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const passwordHash = await bcrypt.hash(password, 10)

  const organization = await prisma.organization.create({
    data: {
      name: organizationName,
      slug,
      users: {
        create: {
          name,
          email,
          passwordHash,
          role: 'admin',
        },
      },
    },
    include: { users: true },
  })

  const user = organization.users[0]
  const token = signToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: organization.id,
  })

  const response = Response.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    organization: { id: organization.id, name: organization.name, slug: organization.slug },
  })

  response.headers.set(
    'Set-Cookie',
    `aprovai_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
  )

  return response
}
