const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || ''
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''

function headers() {
  return {
    'Content-Type': 'application/json',
    apikey: EVOLUTION_API_KEY,
  }
}

export async function createInstance(instanceName: string) {
  const res = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      instanceName,
      integration: 'WHATSAPP-BAILEYS',
      qrcode: true,
      webhook: {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/evolution`,
        byEvents: false,
        base64: true,
        events: [
          'QRCODE_UPDATED',
          'CONNECTION_UPDATE',
          'MESSAGES_UPSERT',
        ],
      },
    }),
  })
  return res.json()
}

export async function connectInstance(instanceName: string) {
  const res = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
    method: 'GET',
    headers: headers(),
  })
  return res.json()
}

export async function getConnectionState(instanceName: string) {
  const res = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
    method: 'GET',
    headers: headers(),
  })
  return res.json()
}

export async function sendMessage(instanceName: string, number: string, text: string) {
  const res = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ number, text }),
  })
  return res.json()
}

export async function getMediaBase64(instanceName: string, messageId: string) {
  const res = await fetch(`${EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/${instanceName}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ message: { key: { id: messageId } } }),
  })
  return res.json()
}

export async function fetchInstances() {
  const res = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
    method: 'GET',
    headers: headers(),
  })
  return res.json()
}
