import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return Response.json({ error: 'Email e senha obrigatórios' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { organization: true },
  })

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return Response.json({ error: 'Credenciais inválidas' }, { status: 401 })
  }

  const token = signToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId,
  })

  const response = Response.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    organization: { id: user.organization.id, name: user.organization.name },
  })

  response.headers.set(
    'Set-Cookie',
    `aprovai_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
  )

  return response
}
