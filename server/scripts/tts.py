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
import io
import asyncio
import array
import wave
import subprocess
import tempfile
import os
import shutil
import edge_tts


def _trim_silence(data: bytes, threshold: int = 400) -> bytes:
    """Remove o silêncio inicial/final que o edge-tts adiciona e regrava
    o WAV com cabeçalho correto (o ffmpeg em pipe grava tamanhos
    placeholder inválidos no RIFF/data). Sem isso as respostas excedem
    o limite de RAM do ESP32 (~96KB) e o áudio é cortado."""
    try:
        src = wave.open(io.BytesIO(data), "rb")
        if src.getsampwidth() != 2 or src.getnchannels() != 1:
            src.close()
            return data
        rate = src.getframerate()
        frames = array.array("h", src.readframes(src.getnframes()))
        src.close()
        if len(frames) == 0:
            return data

        window = max(1, rate // 40)
        absv = [abs(x) for x in frames]

        start = 0
        while start + window < len(frames) and max(absv[start:start + window]) < threshold:
            start += window
        end = len(frames)
        while end - window > start and max(absv[end - window:end]) < threshold:
            end -= window

        margin = rate // 15
        start = max(0, start - margin)
        end = min(len(frames), end + margin)

        out = io.BytesIO()
        dst = wave.open(out, "wb")
        dst.setnchannels(1)
        dst.setsampwidth(2)
        dst.setframerate(rate)
        dst.writeframes(array.array("h", frames[start:end]).tobytes())
        dst.close()
        return out.getvalue()
    except Exception:
        return data


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
            proc = subprocess.run(
                [
                    ffmpeg_path, "-y",
                    "-i", mp3_path,
                    "-f", "wav",
                    "-acodec", "pcm_s16le",
                    "-ar", "22050",
                    "-ac", "1",
                    "pipe:1",
                ],
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
                check=True,
            )
            sys.stdout.buffer.write(_trim_silence(proc.stdout))
            sys.stdout.buffer.flush()
        finally:
            os.unlink(mp3_path)
    else:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                sys.stdout.buffer.write(chunk["data"])
        sys.stdout.buffer.flush()


if __name__ == "__main__":
    asyncio.run(main())
