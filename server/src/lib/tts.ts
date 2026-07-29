import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SCRIPT_PATH = resolve(__dirname, '../../scripts/tts.py')

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
    const proc = spawn('python3', args)
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
