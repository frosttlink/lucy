import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { db } from '@/db'
import { conversations } from '@/db/schema'
import { appContext } from '@/lib/app-context'
import { getUserId } from '@/lib/auth-middleware'
import { transcribeAudio } from '@/lib/stt'
import { textToSpeech } from '@/lib/tts'

export const voice: FastifyPluginAsyncZod = async (app) => {
  app.addContentTypeParser(
    'audio/wav',
    { parseAs: 'buffer' },
    (_req, body, done) => {
      done(null, body as Buffer)
    },
  )

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
      const title = text.length > 2 ? `Voice - ${text.slice(0, 40).replace(/[\n\r]/g, ' ')}` : 'Voice'
      const [conv] = await db
        .insert(conversations)
        .values({
          userId,
          title,
          subject,
        })
        .returning()
      conversationId = conv.id
    }

    let responseText: string
    try {
      responseText = await appContext.chatService?.processText(
        userId,
        text,
        conversationId,
        subject,
      )
    } catch (err) {
      return reply
        .status(500)
        .send({ message: `LLM failed: ${(err as Error).message}` })
    }

    let audioResponse: Buffer
    try {
      audioResponse = await textToSpeech(responseText, 'pt-BR', format)
    } catch (err) {
      return reply
        .status(500)
        .send({ message: `TTS failed: ${(err as Error).message}` })
    }

    return reply
      .header('Content-Type', format === 'wav' ? 'audio/wav' : 'audio/mpeg')
      .header('X-Lucy-Text', Buffer.from(text, 'utf-8').toString('base64'))
      .header('X-Lucy-Conversation-Id', conversationId)
      .send(audioResponse)
  })
}
