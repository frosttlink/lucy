import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { appContext } from '@/lib/app-context'
import { getUserId } from '@/lib/auth-middleware'
import { transcribeAudio } from '@/lib/stt'
import { textToSpeech } from '@/lib/tts'

const GREETING_TEXT = 'Pronta!'
const GREETING_TTL_MS = 60 * 60 * 1000

let greetingCache: { at: number; buffer: Buffer } | null = null

// Gera e armazena o greeting no cache. Chamada no startup para que o
// primeiro boot do ESP32 não espere a geração do TTS (que leva ~11s
// com cache frio e estouraria o timeout do dispositivo).
export async function warmGreeting(): Promise<void> {
  if (greetingCache) return
  try {
    greetingCache = {
      at: Date.now(),
      buffer: await textToSpeech(GREETING_TEXT, 'pt-BR', 'wav'),
    }
  } catch {
    // Falha não fatal: o endpoint tenta de novo no primeiro acesso.
  }
}

export const voice: FastifyPluginAsyncZod = async (app) => {
  app.addContentTypeParser(
    'audio/wav',
    { parseAs: 'buffer' },
    (_req, body, done) => {
      done(null, body as Buffer)
    },
  )

  // Áudio curto de saudação ("Pronta!") para o ESP32 no boot.
  app.get('/api/voice/greeting', async (request, reply) => {
    const userId = getUserId(request, reply)
    if (!userId) return

    if (!greetingCache || Date.now() - greetingCache.at > GREETING_TTL_MS) {
      try {
        greetingCache = {
          at: Date.now(),
          buffer: await textToSpeech(GREETING_TEXT, 'pt-BR', 'wav'),
        }
      } catch (err) {
        return reply
          .status(500)
          .send({ message: `TTS failed: ${(err as Error).message}` })
      }
    }

    return reply
      .header('Content-Type', 'audio/wav')
      .header(
        'X-Lucy-Greeting',
        Buffer.from(GREETING_TEXT, 'utf-8').toString('base64'),
      )
      .send(greetingCache.buffer)
  })

  app.post('/api/voice', async (request, reply) => {
    const userId = getUserId(request, reply)
    if (!userId) return

    const query = request.query as Record<string, string>
    const subject = query.subject || 'general'
    let conversationId = query.conversation_id
    const format = query.format === 'wav' ? 'wav' : 'mp3'

    const audioBuffer = request.body as Buffer
    if (!audioBuffer || audioBuffer.length === 0) {
      return reply.status(400).send({ message: 'empty audio body' })
    }

    let text: string
    try {
      text = await transcribeAudio(audioBuffer)
    } catch (err) {
      return reply
        .status(500)
        .send({ message: `STT failed: ${(err as Error).message}` })
    }

    if (!text) {
      return reply
        .status(400)
        .send({ message: 'could not transcribe any speech' })
    }

    if (!conversationId) {
      const chatService = appContext.chatService
      if (!chatService) {
        throw new Error('chat service not initialized')
      }
      const conv = await chatService.getOrCreateConversation(userId)
      conversationId = conv.id
    }

    let responseText: string
    let llmError: string | null = null
    try {
      const chatService = appContext.chatService
      if (!chatService) {
        throw new Error('chat service not initialized')
      }
      responseText = await chatService.processText(
        userId,
        text,
        conversationId,
        subject,
        true,
      )
    } catch (err) {
      // Degradação graciosa: se o LLM falhar (ex.: cota do Groq
      // esgotada), responde por voz com um aviso amigável em vez de
      // um erro HTTP — o ESP32 fala em vez de beepar.
      llmError = (err as Error).message
      responseText =
        'Desculpa, esgotei meu limite de uso por hoje. Tenta de novo amanhã.'
    }

    // O ESP32 agora toca a resposta em streaming playback, então o
    // teto de ~22 chars não é mais necessário. 120 chars ≈ 8s de
    // áudio, resposta completa e natural em voz.
    const VOICE_MAX_CHARS = 120
    if (responseText.length > VOICE_MAX_CHARS) {
      const cut = responseText.slice(0, VOICE_MAX_CHARS)
      const lastSpace = cut.lastIndexOf(' ')
      responseText = cut.slice(0, lastSpace > 0 ? lastSpace : VOICE_MAX_CHARS)
    }
    // Remove markdown que não deve ser lido em voz.
    responseText = responseText
      .replace(/[#*_`>|[\]-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    let audioResponse: Buffer
    try {
      audioResponse = await textToSpeech(responseText, 'pt-BR', format)
    } catch (err) {
      return reply
        .status(500)
        .send({ message: `TTS failed: ${(err as Error).message}` })
    }

    const resp = reply
      .header('Content-Type', format === 'wav' ? 'audio/wav' : 'audio/mpeg')
      .header('X-Lucy-Text', Buffer.from(text, 'utf-8').toString('base64'))
      .header('X-Lucy-Conversation-Id', conversationId)
    if (llmError) {
      resp.header('X-Lucy-Error', 'llm_failed')
    }
    return resp.send(audioResponse)
  })
}
