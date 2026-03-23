const DATAJUD_BASE = 'https://api-publica.datajud.cnj.jus.br'
const DATAJUD_KEY = process.env.DATAJUD_API_KEY || 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw=='

// Tribunais estaduais (TJs) - consulta nos mais relevantes para locação
const TRIBUNAIS = [
  'api_publica_tjsp',
  'api_publica_tjrj',
  'api_publica_tjmg',
  'api_publica_tjrs',
  'api_publica_tjpr',
  'api_publica_tjsc',
  'api_publica_tjba',
  'api_publica_tjpe',
  'api_publica_tjce',
  'api_publica_tjgo',
  'api_publica_tjdf',
]

interface CourtRecord {
  tribunal: string
  numeroProcesso: string
  classe: string
  assuntos: string[]
  dataAjuizamento: string
  grau: string
  orgaoJulgador: string
}

interface DataJudResult {
  totalProcessos: number
  processos: CourtRecord[]
  errors: string[]
}

async function searchTribunal(tribunal: string, cpf: string): Promise<CourtRecord[]> {
  const res = await fetch(`${DATAJUD_BASE}/${tribunal}/_search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `APIKey ${DATAJUD_KEY}`,
    },
    body: JSON.stringify({
      size: 20,
      query: {
        bool: {
          should: [
            { match: { 'partes.documento': cpf } },
            { match: { 'partes.pessoa.cpf': cpf } },
          ],
          minimum_should_match: 1,
        },
      },
    }),
  })

  if (!res.ok) return []

  const data = await res.json()
  const hits = data?.hits?.hits || []

  return hits.map((hit: { _source: Record<string, unknown> }) => {
    const src = hit._source
    return {
      tribunal,
      numeroProcesso: src.numeroProcesso as string || '',
      classe: ((src.classe as Record<string, unknown>)?.nome as string) || '',
      assuntos: ((src.assuntos as Array<{ nome: string }>) || []).map((a) => a.nome),
      dataAjuizamento: src.dataAjuizamento as string || '',
      grau: src.grau as string || '',
      orgaoJulgador: ((src.orgaoJulgador as Record<string, unknown>)?.nome as string) || '',
    }
  })
}

export async function consultarProcessos(cpf: string): Promise<DataJudResult> {
  const cleanCpf = cpf.replace(/\D/g, '')
  const errors: string[] = []
  const allProcessos: CourtRecord[] = []

  // Consultar tribunais em paralelo (respeitando rate limit de 120/min)
  const results = await Promise.allSettled(
    TRIBUNAIS.map((tribunal) => searchTribunal(tribunal, cleanCpf))
  )

  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    if (result.status === 'fulfilled') {
      allProcessos.push(...result.value)
    } else {
      errors.push(`${TRIBUNAIS[i]}: ${result.reason?.message || 'erro'}`)
    }
  }

  return {
    totalProcessos: allProcessos.length,
    processos: allProcessos,
    errors,
  }
}
