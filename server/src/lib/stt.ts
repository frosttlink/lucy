import { env } from '@/env'

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1'

export async function transcribeAudio(
  audioBuffer: Buffer,
  filename = 'recording.wav',
): Promise<string> {
  const blob = new Blob([audioBuffer], { type: 'audio/wav' })

  const formData = new FormData()
  formData.append('file', blob, filename)
  formData.append('model', 'whisper-large-v3')
  formData.append('language', 'pt')
  formData.append('response_format', 'text')

  const response = await fetch(`${GROQ_BASE_URL}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Groq Whisper error (${response.status}): ${err}`)
  }

  const text = await response.text()
  return text.trim()
}
