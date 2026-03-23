interface ScoringInput {
  incomeEstimate: number | null
  rentValue: number | null
  courtRecordsCount: number
  criminalRecordsCount: number
  creditScore: number | null
  creditPendenciasCount: number
  creditPendenciasTotal: number
  dataConsistent: boolean      // nome/CPF bate nos documentos
  hasFixedAddress: boolean
}

interface ScoringResult {
  score: number                // 0-100
  decision: 'approved' | 'rejected' | 'manual_review'
  reasons: string[]
}

export function calculateRiskScore(input: ScoringInput): ScoringResult {
  let score = 100
  const reasons: string[] = []

  // 1. Renda vs Aluguel (peso alto)
  if (input.incomeEstimate && input.rentValue) {
    const ratio = input.incomeEstimate / input.rentValue
    if (ratio < 2) {
      score -= 50
      reasons.push(`Renda (R$${input.incomeEstimate}) menor que 2x o aluguel (R$${input.rentValue})`)
    } else if (ratio < 3) {
      score -= 25
      reasons.push(`Renda (R$${input.incomeEstimate}) menor que 3x o aluguel (R$${input.rentValue})`)
    }
  } else if (!input.incomeEstimate) {
    score -= 20
    reasons.push('Não foi possível estimar a renda')
  }

  // 2. Processos judiciais cíveis
  if (input.courtRecordsCount > 0) {
    const penalty = Math.min(input.courtRecordsCount * 10, 30)
    score -= penalty
    reasons.push(`${input.courtRecordsCount} processo(s) cível(eis) encontrado(s)`)
  }

  // 3. Processos criminais
  if (input.criminalRecordsCount > 0) {
    const penalty = Math.min(input.criminalRecordsCount * 25, 50)
    score -= penalty
    reasons.push(`${input.criminalRecordsCount} processo(s) criminal(ais) encontrado(s)`)
  }

  // 4. Score de crédito bureau
  if (input.creditScore !== null) {
    if (input.creditScore < 300) {
      score -= 30
      reasons.push(`Score de crédito muito baixo (${input.creditScore}/1000)`)
    } else if (input.creditScore < 500) {
      score -= 15
      reasons.push(`Score de crédito baixo (${input.creditScore}/1000)`)
    }
  }

  // 5. Pendências financeiras
  if (input.creditPendenciasCount > 0) {
    score -= Math.min(input.creditPendenciasCount * 10, 25)
    reasons.push(`${input.creditPendenciasCount} pendência(s) financeira(s) (total R$${input.creditPendenciasTotal.toFixed(2)})`)
  }

  // 6. Consistência dos dados
  if (!input.dataConsistent) {
    score -= 40
    reasons.push('Dados inconsistentes entre documentos (nome ou CPF divergente)')
  }

  // 7. Sem endereço fixo
  if (!input.hasFixedAddress) {
    score -= 10
    reasons.push('Comprovante de residência não confirmado')
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score))

  // Decision
  let decision: ScoringResult['decision']
  if (score >= 70) {
    decision = 'approved'
  } else if (score >= 40) {
    decision = 'manual_review'
  } else {
    decision = 'rejected'
  }

  return { score, decision, reasons }
}
