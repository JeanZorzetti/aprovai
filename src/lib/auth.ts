import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'change-me'

export interface JWTPayload {
  id: string
  email: string
  name: string
  role: string
  organizationId: string
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload
}

export async function getAuthFromRequest(request: Request): Promise<JWTPayload | null> {
  // Check Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    try {
      return verifyToken(authHeader.slice(7))
    } catch {
      return null
    }
  }

  // Check cookie
  const cookieStore = await cookies()
  const token = cookieStore.get('aprovai_token')?.value
  if (token) {
    try {
      return verifyToken(token)
    } catch {
      return null
    }
  }

  return null
}
