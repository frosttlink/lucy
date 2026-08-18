FROM node:22-slim

RUN apt-get update && apt-get install -y \
    python3 \
    python3-venv \
    ffmpeg \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# venv com edge-tts para o TTS (evita o "externally-managed-environment" do Debian)
RUN python3 -m venv /opt/lucy-venv \
    && /opt/lucy-venv/bin/pip install --no-cache-dir edge-tts

ENV TTS_PYTHON=/opt/lucy-venv/bin/python

WORKDIR /app

COPY server/package.json server/package-lock.json ./
RUN npm ci

COPY server/ ./
RUN npm run build

EXPOSE 3333

CMD ["npm", "run", "start:prod"]
