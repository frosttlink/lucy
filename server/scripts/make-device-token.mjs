#!/usr/bin/env node
/**
 * make-device-token.mjs
 *
 * Gera um token JWT de longa duração para o dispositivo físico (ESP32).
 * Diferente do token de acesso do app (15 min), este é feito para ser
 * fixado no firmware e não expirar tão cedo.
 *
 * Uso:
 *   node scripts/make-device-token.mjs <user_id> [dias]
 *
 * Exemplos:
 *   node scripts/make-device-token.mjs 3c9f...   # 365 dias (padrão)
 *   node scripts/make-device-token.mjs 3c9f... 3650  # 10 anos
 *
 * O JWT_SECRET é lido de process.env.JWT_SECRET. Se você estiver com
 * o arquivo .env no diretório server, rode com:
 *   node --env-file=.env scripts/make-device-token.mjs <user_id>
 *
 * Para descobrir seu user_id, faça login e olhe o token:
 *   curl -X POST http://localhost:3333/auth/login \
 *     -H "Content-Type: application/json" \
 *     -d '{"email":"seu@email.com","senha":"sua-senha"}'
 * Depois decodifique o payload: https://jwt.io
 */

import jwt from 'jsonwebtoken'

const secret = process.env.JWT_SECRET
if (!secret) {
  console.error('ERRO: defina JWT_SECRET (ex.: node --env-file=.env scripts/make-device-token.mjs <user_id>)')
  process.exit(1)
}

const userId = process.argv[2]
if (!userId) {
  console.error('Uso: node scripts/make-device-token.mjs <user_id> [dias]')
  process.exit(1)
}

const days = Number(process.argv[3]) || 365

const token = jwt.sign({ user_id: userId, device: true }, secret, {
  expiresIn: `${days}d`,
})

const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
console.log(`Token gerado para user_id=${userId} (válido por ${days} dias, até ${expiresAt})`)
console.log('')
console.log(token)
