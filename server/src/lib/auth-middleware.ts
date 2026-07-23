import type { FastifyRequest, FastifyReply } from 'fastify'
import { verifyToken } from './jwt'

export function getUserId(
  request: FastifyRequest,
  reply: FastifyReply,
): string | null {
  let token = ''

  const authHeader = request.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7)
  }

  if (!token) {
    const queryToken = (request.query as Record<string, string>)?.token
    if (queryToken) token = queryToken
  }

  if (!token) {
    reply.status(401).send({ message: 'missing authorization token' })
    return null
  }

  try {
    const payload = verifyToken(token)
    return payload.user_id
  } catch (err) {
    const message = (err as Error).message.includes('expired')
      ? 'token expired'
      : 'invalid token'
    reply.status(401).send({ message })
    return null
  }
}
