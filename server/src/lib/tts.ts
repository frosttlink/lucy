import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { env } from '@/env'

const __dirname = dirname(fileURLToPath(import.meta.url))

// O tsup empacota tudo em dist/server.js, o que muda o __dirname em
// relação ao fonte (src/lib/tts.ts). Procura o script tts.py em todos
// os caminhos plausíveis (dev, build local e Docker) e usa o primeiro
// que existir.
function findTtsScript(): string {
  const candidates = [
    resolve(process.cwd(), 'scripts/tts.py'),
    resolve(process.cwd(), 'server/scripts/tts.py'),
    resolve(__dirname, '../../scripts/tts.py'),
    resolve(__dirname, '../../../../server/scripts/tts.py'),
    resolve(__dirname, '../../../server/scripts/tts.py'),
    resolve(__dirname, '../scripts/tts.py'),
  ]
  for (const path of candidates) {
    if (existsSync(path)) return path
  }
  return candidates[0]
}

const SCRIPT_PATH = findTtsScript()
const PYTHON = env.TTS_PYTHON || 'python3'

const VOICES: Record<string, string> = {
  'pt-BR': 'pt-BR-FranciscaNeural',
  'en-US': 'en-US-JennyNeural',
}

export async function textToSpeech(
  text: string,
  lang = 'pt-BR',
  format: 'mp3' | 'wav' = 'mp3',
): Promise<Buffer> {
  const voice = VOICES[lang] || VOICES['pt-BR']
  const args = [SCRIPT_PATH, '--voice', voice]
  if (format === 'wav') args.push('--wav')

  return new Promise((resolve, reject) => {
    const proc = spawn(PYTHON, args)
    const chunks: Buffer[] = []
    const errors: string[] = []

    proc.stdout.on('data', (chunk: Buffer) => chunks.push(chunk))
    proc.stderr.on('data', (data: Buffer) => errors.push(data.toString()))

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks))
      } else {
        reject(
          new Error(`TTS process exited with code ${code}: ${errors.join('')}`),
        )
      }
    })

    proc.on('error', (err) => {
      reject(new Error(`Failed to start TTS process: ${err.message}`))
    })

    proc.stdin.end(text, 'utf-8')
  })
}
