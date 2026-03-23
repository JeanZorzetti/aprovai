import { getAuthFromRequest } from '@/lib/auth'
import { connectInstance } from '@/lib/evolution'

export async function POST(request: Request) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return Response.json({ error: 'Nao autorizado' }, { status: 401 })

  const { instanceName } = await request.json()

  if (!instanceName) {
    return Response.json({ error: 'instanceName obrigatorio' }, { status: 400 })
  }

  const result = await connectInstance(instanceName)
  console.log('[whatsapp/connect] Evolution response:', JSON.stringify(result))
  return Response.json(result)
}
