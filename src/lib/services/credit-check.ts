// Integração com bureau de crédito (Serasa/BigDataCorp)
// Configurar API_KEY após contratar o serviço

const CREDIT_API_URL = process.env.CREDIT_API_URL || ''
const CREDIT_API_KEY = process.env.CREDIT_API_KEY || ''

interface CreditResult {
  provider: string
  score: number | null        // 0-1000 (score de crédito)
  status: string              // clean | pending | negative
  pendencias: Pendencia[]
  consultado: boolean
  raw: unknown
}

interface Pendencia {
  tipo: string                // protesto | cheque | financeira | judicial
  valor: number
  data: string
  credor: string
}

// BigDataCorp API integration
async function consultBigDataCorp(cpf: string): Promise<CreditResult> {
  if (!CREDIT_API_URL || !CREDIT_API_KEY) {
    return mockCreditCheck(cpf)
  }

  const res = await fetch(`${CREDIT_API_URL}/pessoas/${cpf}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${CREDIT_API_KEY}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    throw new Error(`Credit check failed: ${res.status}`)
  }

  const data = await res.json()

  return {
    provider: 'bigdatacorp',
    score: data.score ?? null,
    status: data.pendencias?.length > 0 ? 'negative' : 'clean',
    pendencias: (data.pendencias || []).map((p: Record<string, unknown>) => ({
      tipo: p.tipo as string || 'financeira',
      valor: p.valor as number || 0,
      data: p.data as string || '',
      credor: p.credor as string || '',
    })),
    consultado: true,
    raw: data,
  }
}

// Mock para desenvolvimento (remove quando tiver API real)
function mockCreditCheck(cpf: string): CreditResult {
  const lastDigit = parseInt(cpf.slice(-2, -1))
  // Simula diferentes cenários baseado no CPF
  if (lastDigit >= 8) {
    return {
      provider: 'mock',
      score: 200 + lastDigit * 10,
      status: 'negative',
      pendencias: [
        { tipo: 'financeira', valor: 1500, data: '2025-06-15', credor: 'Banco XYZ' },
      ],
      consultado: true,
      raw: { mock: true },
    }
  }

  return {
    provider: 'mock',
    score: 600 + lastDigit * 40,
    status: 'clean',
    pendencias: [],
    consultado: true,
    raw: { mock: true },
  }
}

export async function consultarCredito(cpf: string): Promise<CreditResult> {
  const cleanCpf = cpf.replace(/\D/g, '')
  return consultBigDataCorp(cleanCpf)
}
