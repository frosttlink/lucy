# Lucy ESP32 — Assistente de Voz

Firmware para conectar o assistente Lucy a um hardware físico com microfone e alto-falante.

## Componentes

| Componente | Quantidade |
|---|---|
| ESP32 Devkit V1 | 1 |
| Protoboard 400 pontos | 1 |
| Microfone MEMS digital I2S INMP441 | 1 |
| Amplificador PAM8403 (2x3W) | 1 |
| Alto-falante (reaproveitado) | 1 |
| Botão táctil | 1 |
| LED 5mm + resistor 220Ω | 1 |
| Capacitor eletrolítico 1µF (ou cerâmico) | 1 |
| Jumpers macho-macho | 10 |
| Jumpers macho-fêmea | 10 |
| Fonte 5V (USB ou bateria) | 1 |

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

### Controles

| Componente | ESP32 |
|---|---|
| LED (ânodo) | GPIO2 → resistor 220Ω |
| LED (catodo) | GND |
| Botão (1) | GPIO4 |
| Botão (2) | GND |

### Diagrama da Protoboard

```
          ┌──────────────────────────────────────┐
          │           ESP32 Devkit V1             │
          │  ┌──────────────────────────────┐    │
          │  │ 3V3 GND GPIO32 GPIO33 GPIO27 │    │
          │  └──┬──┬────┬──────┬──────┬────┘    │
          │     │  │    │      │      │         │
          │     │  │    │      │      └── INMP441│
          │     │  │    │      └── INMP441 SCK   │
          │     │  │    └── INMP441 SD           │
          │     │  └── GND (INMP441 + PAM8403)   │
          │     └── INMP441 VDD                  │
          │                                      │
          │  ┌──────────────────────────────┐    │
          │  │ GPIO25 GPIO2 GPIO4 GND 5V    │    │
          │  └──┬─────┬────┬─────┬────┬────┘    │
          │     │     │    │     │    │         │
          │     │     │    │     │    └── 5V     │
          │     │     │    │     └── GND         │
          │     │     │    └── Botão→GND        │
          │     │     └── LED 220Ω → GND        │
          │     └── 1µF → PAM8403 LIN           │
          └──────────────────────────────────────┘
```

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
const char* WIFI_SSID     = "SEU_WIFI_SSID";
const char* WIFI_PASS     = "SEU_WIFI_SENHA";
const char* LUCY_SERVER   = "http://192.168.1.100:3333";
const char* AUTH_TOKEN    = "seu-jwt-token-aqui";
```

**Para obter o token JWT:**
```bash
curl -X POST http://localhost:3333/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seu@email.com","senha":"sua-senha"}'
```

### 4. Upload

1. Conecte o ESP32 via USB
2. **Ferramentas → Porta:** Selecione a porta correta
3. Clique em **Upload** (→)

### 5. Monitor Serial

**Ferramentas → Monitor Serial** (115200 baud) para ver logs.

## Wake Word "Lucy" (Opcional)

Para ativação por comando de voz em vez de botão:

1. Crie uma conta grátis em https://console.picovoice.ai/
2. Crie um wake word personalizado "Lucy"
3. Baixe o arquivo `.ppn` para ESP32
4. Instale a biblioteca Arduino "Picovoice" no Gerenciador de Bibliotecas
5. Converta o `.ppn` para array C usando o script `pv_arduino_convert_wake_word.py`
6. Adicione o array ao firmware e descomente as seções Porcupine no código

## Uso

1. Conecte tudo conforme a pinagem
2. Alimente o ESP32 (USB ou 5V)
3. O LED pisca 2x indicando WiFi conectado
4. **Pressione o botão** e fale (o LED acende)
5. Solte o botão para parar de gravar
6. Espere a resposta (LED aceso)
7. A resposta será reproduzida no alto-falante
8. Pronto para o próximo comando!

## Teste sem ESP32

Você pode testar o servidor sem o hardware:

```bash
# 1. Grave um arquivo WAV (16kHz, 16-bit, mono):
ffmpeg -f alsa -i default -ar 16000 -ac 1 -c:a pcm_s16le pergunta.wav -t 5

# 2. Envie para Lucy:
curl -X POST "http://localhost:3333/api/voice" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: audio/wav" \
  --data-binary @pergunta.wav \
  -o resposta.wav
```

## Solução de Problemas

| Problema | Causa | Solução |
|---|---|---|
| LED não acende | GPIO2 desconectado | Verifique LED + resistor |
| Áudio distorcido | DAC 8-bit + PAM8403 | Use capacitor 1µF entre GPIO25 e LIN |
| Microfone não grava | Fios I2S trocados | Verifique SD/SCK/WS |
| Não conecta WiFi | Credenciais erradas | Verifique SSID/senha |
| Resposta HTTP 401 | Token inválido | Gere novo JWT via `/auth/login` |
| Áudio muito baixo | PAM8403 sem 5V | Use fonte externa 5V |
| Ruído no áudio | GND flutuante | Conecte todos os GNDs juntos |
