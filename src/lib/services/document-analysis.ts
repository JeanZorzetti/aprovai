import Anthropic from '@anthropic-ai/sdk'
import { fileToBase64 } from './media'
import { basename } from 'path'

let client: Anthropic | null = null

function getClient() {
  if (!client) client = new Anthropic()
  return client
}

interface DocumentExtraction {
  type: 'rg' | 'cnh' | 'income' | 'address'
  name?: string
  cpf?: string
  rg?: string
  birthDate?: string
  income?: number
  employer?: string
  address?: string
  confidence: number
  raw: string
}

const PROMPTS: Record<string, string> = {
  rg: `Analise este documento de identidade brasileiro (RG ou CNH).
Extraia em JSON:
{
  "name": "nome completo",
  "cpf": "apenas números, 11 dígitos",
  "rg": "número do RG",
  "birthDate": "YYYY-MM-DD",
  "confidence": 0.0 a 1.0 (confiança na leitura)
}
Se não conseguir ler algum campo, coloque null. Responda APENAS o JSON.`,

  income: `Analise este comprovante de renda brasileiro (holerite, contracheque ou extrato bancário).
Extraia em JSON:
{
  "name": "nome do titular",
  "cpf": "apenas números se visível",
  "income": valor numérico do salário líquido ou renda mensal em reais (sem R$, apenas número),
  "employer": "nome da empresa/empregador se visível",
  "confidence": 0.0 a 1.0
}
Se for extrato bancário, estime a renda mensal pelos créditos recorrentes. Responda APENAS o JSON.`,

  address: `Analise este comprovante de residência brasileiro (conta de luz, água, telefone, etc).
Extraia em JSON:
{
  "name": "nome do titular da conta",
  "address": "endereço completo",
  "confidence": 0.0 a 1.0
}
Responda APENAS o JSON.`,
}

export async function analyzeDocument(
  filepath: string,
  docType: string
): Promise<DocumentExtraction> {
  const base64 = await fileToBase64(filepath)
  const ext = basename(filepath).split('.').pop()
  const isPdf = ext === 'pdf'
  const imageMediaType = ext === 'png' ? 'image/png' as const : 'image/jpeg' as const

  const prompt = PROMPTS[docType] || PROMPTS.rg

  const contentBlock = isPdf
    ? { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: base64 } }
    : { type: 'image' as const, source: { type: 'base64' as const, media_type: imageMediaType, data: base64 } }

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user' as const,
        content: [
          contentBlock,
          { type: 'text' as const, text: prompt },
        ],
      },
    ],
  })

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

  return {
    type: docType as DocumentExtraction['type'],
    ...parsed,
    raw: text,
  }
}
