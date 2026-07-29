#!/usr/bin/env python3
"""
tts.py — Text-to-Speech usando edge-tts.

Lê texto do stdin, escreve áudio no stdout.
Por padrão gera MP3. Com --wav converte para WAV (requer ffmpeg).

Uso:
    echo "Olá mundo" | python3 tts.py --voice pt-BR-FranciscaNeural > audio.mp3
    echo "Olá mundo" | python3 tts.py --voice pt-BR-FranciscaNeural --wav > audio.wav

Vozes disponíveis (pt-BR):
    pt-BR-FranciscaNeural  (feminino, natural)
    pt-BR-AntonioNeural    (masculino, natural)
"""

import sys
import asyncio
import subprocess
import tempfile
import os
import shutil
import edge_tts


async def main() -> None:
    text = sys.stdin.read()

    voice = "pt-BR-FranciscaNeural"
    output_wav = False

    args = sys.argv[1:]
    for i, arg in enumerate(args):
        if arg == "--voice" and i + 1 < len(args):
            voice = args[i + 1]
        if arg == "--wav":
            output_wav = True

    communicate = edge_tts.Communicate(text=text, voice=voice)

    if output_wav:
        ffmpeg_path = shutil.which("ffmpeg")
        if ffmpeg_path is None:
            print("TTS: ffmpeg not found, falling back to MP3", file=sys.stderr)
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    sys.stdout.buffer.write(chunk["data"])
            sys.stdout.buffer.flush()
            return

        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
            mp3_path = f.name
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    f.write(chunk["data"])

        try:
            subprocess.run(
                [
                    ffmpeg_path, "-y",
                    "-i", mp3_path,
                    "-f", "wav",
                    "-acodec", "pcm_s16le",
                    "-ar", "16000",
                    "-ac", "1",
                    "pipe:1",
                ],
                stdout=sys.stdout.buffer,
                stderr=subprocess.DEVNULL,
                check=True,
            )
        finally:
            os.unlink(mp3_path)
    else:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                sys.stdout.buffer.write(chunk["data"])
        sys.stdout.buffer.flush()


if __name__ == "__main__":
    asyncio.run(main())
