# Lucy ESP32 — Assistente de Voz

Firmware para conectar o assistente Lucy a um hardware físico com microfone e alto-falante.

**Como funciona:** o ESP32 **escuta continuamente**. Quando você fala (energia acima de um limiar), ele grava. Ao ficar silencioso por um instante, envia o áudio para o servidor Lucy, recebe a resposta e reproduz no alto-falante. **Não há botão.**

## Componentes

| Componente | Quantidade |
|---|---|
| ESP32 Devkit V1 | 1 |
| Microfone MEMS digital I2S INMP441 | 1 |
| Amplificador PAM8403 (2x3W) | 1 |
| Alto-falante (reaproveitado) | 1 |
| LED 5mm + resistor 220Ω *(opcional)* | 1 |
| Protoboard 400 pontos *(opcional — pode ligar com fios diretos)* | 1 |
| Capacitor eletrolítico 1µF (ou cerâmico) | 1 |
| Fonte 5V (USB ou bateria) | 1 |

> O protoboard é só um conector: o firmware não depende dele. O que importa é a **pinagem** abaixo. Botão e LED não são usados no fluxo atual.

## Pinagem

### INMP441 (Microfone I2S)

| INMP441 | ESP32 |
|---------|-------|
| VDD     | 3.3V  |
| GND     | GND   |
| L/R     | GND   |
| SD (DOUT) | GPIO32 |
| SCK (BCLK) | GPIO33 |
| WS (LRCK) | GPIO27 |

### PAM8403 (Amplificador)

| PAM8403 | Conexão |
|---------|---------|
| LIN     | GPIO25 → 1µF capacitor (polo positivo no GPIO25) |
| GND     | GND (compartilhado) |
| VDD     | 5V (fonte externa ou USB) |
| LOUT+   | Alto-falante (+) |
| LOUT-   | Alto-falante (-) |

### LED (opcional, status)

| Componente | ESP32 |
|---|---|
| LED (ânodo) | GPIO2 → resistor 220Ω |
| LED (catodo) | GND |

Se não houver LED, deixe `#define HAS_LED 0` no firmware (padrão).

**Observação:** Conecte todos os GNDs juntos (ESP32, INMP441, PAM8403).

## Instalação do Firmware

### 1. Instalar Arduino IDE

Baixe em https://www.arduino.cc/en/software

### 2. Configurar ESP32 na Arduino IDE

- **Arquivo → Preferências:** Em "URLs Adicionais para Gerenciadores de Placas", adicione:
  ```
  https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
  ```
- **Ferramentas → Placa → Gerenciador de Placas:** Instale "ESP32 by Espressif Systems"
- **Ferramentas → Placa:** Selecione "ESP32 Dev Module"

### 3. Configurar Credenciais

Edite o arquivo `lucy-esp32.ino` e preencha:

```cpp
const char* WIFI_SSID   = "SEU_WIFI_SSID";
const char* WIFI_PASS   = "SEU_WIFI_SENHA";
const char* LUCY_SERVER = "http://192.168.1.100:3333";
const char* AUTH_TOKEN  = "seu-jwt-token-aqui";
```

**`LUCY_SERVER` funciona nos dois modos:**
- `http://IP-DO-SEU-PC:3333` — servidor rodando localmente (mesma rede).
- `https://seu-app.railway.app` — servidor na nuvem (qualquer lugar).

O firmware detecta `https://` automaticamente e usa conexão segura.

**Para obter o token JWT de longa duração para o dispositivo:**

O token do app expira em 15 min. Para o ESP32, use um token de longa duração:

```bash
cd server
npm run device:token SEU_USER_ID
```

Substitua `SEU_USER_ID` pelo id do usuário (aparece dentro do payload do token de login, ex.: no [jwt.io](https://jwt.io)). O token gerado vale 365 dias por padrão.

### 4. Ajustar a Sensibilidade (VAD)

O firmware detecta fala por energia (RMS):

```cpp
#define VAD_THRESHOLD   900    // RMS acima disso = fala
#define SILENCE_MS      800    // silêncio p/ encerrar gravação (ms)
#define MAX_RECORD_SEC  5      // duração máxima da gravação
#define PRE_ROLL_MS     300    // áudio antes da fala
```

- **Engatilha fácil demais** (barulho de fundo grava sozinho): aumente `VAD_THRESHOLD`.
- **Corta o início das palavras:** diminua `VAD_THRESHOLD`.
- **Resposta curta demais/não fecha a frase:** aumente `SILENCE_MS` (ex.: `1200`).

Acompanhe o valor real pelo Monitor Serial: adicione um `Serial.println(rms)` temporário em `loop()` se quiser calibrar.

### 5. Upload

1. Conecte o ESP32 via USB
2. **Ferramentas → Porta:** Selecione a porta correta
3. Clique em **Upload** (→)

### 6. Monitor Serial

**Ferramentas → Monitor Serial** (115200 baud) para ver logs de fala detectada, envio e reprodução.

## Feedback sonoro (sem tela)

O aparelho avisa o que está fazendo por **áudio** (funciona mesmo sem LED):

| Som | Significado |
|---|---|
| "Pronta!" (voz) ou 2 beeps agudos | Boot concluído, esperando você falar |
| 1 beep curto (1200Hz) | Começou a gravar sua fala |
| 2 beeps graves (180Hz) | Algo deu errado (envio falhou / sem rede) |

- O "Pronta!" é baixado do servidor em `GET /api/voice/greeting`. Se o servidor
  estiver fora do ar no boot, o ESP32 cai para os 2 beeps locais.
- Não há necessidade de tela ou LED para saber se a Lucy está viva.

## Uso

1. Conecte tudo conforme a pinagem
2. Alimente o ESP32 (USB ou 5V)
3. O LED pisca 2x indicando WiFi conectado *(se houver LED)*
4. **Apenas fale** (o dispositivo está sempre escutando)
5. Ao ficar silencioso por ~0,8s, o áudio é enviado
6. A resposta é reproduzida no alto-falante
7. Pronto para o próximo comando!

## Teste sem ESP32

Você pode testar o servidor sem o hardware:

```bash
# 1. Grave um arquivo WAV (22050Hz, 16-bit, mono):
ffmpeg -f alsa -i default -ar 22050 -ac 1 -c:a pcm_s16le pergunta.wav -t 5

# 2. Envie para Lucy:
curl -X POST "http://localhost:3333/api/voice" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: audio/wav" \
  --data-binary @pergunta.wav \
  -o resposta.wav

# 3. Ouça:
ffplay resposta.wav
```

## Solução de Problemas

| Problema | Causa | Solução |
|---|---|---|
| Não reage à voz | Limiar de energia alto | Reduza `VAD_THRESHOLD` |
| Grava sozinho (ruído) | Limiar de energia baixo | Aumente `VAD_THRESHOLD` |
| Corta o início da frase | `PRE_ROLL_MS` pequeno | Aumente para `400–500` |
| Áudio distorcido | DAC 8-bit + PAM8403 | Use capacitor 1µF entre GPIO25 e LIN |
| Microfone não grava | Fios I2S trocados | Verifique SD/SCK/WS |
| Não conecta WiFi | Credenciais erradas | Verifique SSID/senha |
| Resposta HTTP 401 | Token inválido/expirado | Gere token novo via `npm run device:token` |
| Resposta HTTP 4xx/5xx | Servidor inacessível | Verifique `LUCY_SERVER` (http/https) e rede |
| Áudio muito baixo | PAM8403 sem 5V | Use fonte externa 5V |
| Ruído no áudio | GND flutuante | Conecte todos os GNDs juntos |
| Resposta longa não toca | RAM do ESP32 limitada | Resp. > ~256KB (~8s) não cabe; pergunte algo mais curto |

## Wake Word "Lucy" (Opcional)

Como o aparelho está sempre escutando, a ativação por wake word evita enviar conversas soltas:

1. Crie uma conta grátis em https://console.picovoice.ai/
2. Crie um wake word personalizado "Lucy"
3. Baixe o arquivo `.ppn` para ESP32
4. Instale a biblioteca Arduino "Picovoice" no Gerenciador de Bibliotecas
5. Converta o `.ppn` para array C usando o script `pv_arduino_convert_wake_word.py`
6. Adicione o array ao firmware e faça o VAD aguardar o wake word antes de gravar
