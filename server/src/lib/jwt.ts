import jwt from 'jsonwebtoken'
import { env } from '@/env'

export interface JwtPayload {
  user_id: string
}

const ACCESS_TTL = '15m'
const REFRESH_TTL = '7d'

export function signAccessToken(userId: string): string {
  return jwt.sign({ user_id: userId }, env.JWT_SECRET, {
    expiresIn: ACCESS_TTL,
  })
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ user_id: userId }, env.JWT_SECRET, {
    expiresIn: REFRESH_TTL,
  })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload
}
