/*
 * Lucy ESP32 — Firmware para assistente de voz
 *
 * Hardware:
 *   ESP32 Devkit V1
 *   Microfone INMP441 (I2S)
 *   Amplificador PAM8403 + Alto-falante
 *   Botão (push-to-talk)
 *   LED (status)
 *
 * Fluxo:
 *   IDLE → [botão] → RECORDING → [solta/solta 5s] → SENDING
 *   → PLAYING → [fim] → IDLE
 *
 * Pinagem:
 *   INMP441: VDD→3.3V  GND→GND  L/R→GND  SD→GPIO32  SCK→GPIO33  WS→GPIO27
 *   PAM8403: LIN→GPIO25(1µF)  GND→GND  VDD→5V
 *   Botão:   GPIO4→GND (INPUT_PULLUP)
 *   LED:     GPIO2→resistor→GND
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <driver/i2s.h>

// ─── CONFIGURAÇÃO ───────────────────────────────────────────────
const char* WIFI_SSID     = "SEU_WIFI_SSID";
const char* WIFI_PASS     = "SEU_WIFI_SENHA";
const char* LUCY_SERVER   = "http://192.168.1.100:3333";
const char* AUTH_TOKEN    = "seu-jwt-token-aqui";

// ─── PINOS ──────────────────────────────────────────────────────
#define PIN_I2S_SD    32
#define PIN_I2S_SCK   33
#define PIN_I2S_WS    27
#define PIN_DAC       25
#define PIN_LED        2
#define PIN_BTN        4

// ─── CONFIGURAÇÕES DE ÁUDIO ─────────────────────────────────────
#define SAMPLE_RATE    16000
#define BITS_PER_SAMPLE I2S_BITS_PER_SAMPLE_16BIT
#define MAX_RECORD_SEC 5
#define RECORD_BUF_SIZE (SAMPLE_RATE * 2 * MAX_RECORD_SEC)

// ─── ESTADOS ────────────────────────────────────────────────────
enum State { IDLE, RECORDING, SENDING, PLAYING, ERROR };
State state = IDLE;

// ─── BUFFERS ────────────────────────────────────────────────────
int16_t* recordBuffer = NULL;
size_t  recordSize    = 0;
size_t  recordIndex   = 0;
bool    btnPressed    = false;

int16_t* playBuffer   = NULL;
size_t   playSize     = 0;
size_t   playIndex    = 0;

// ─── PROTÓTIPOS ─────────────────────────────────────────────────
void   setupWiFi();
void   initI2SMic();
void   deinitI2S();
void   startRecording();
void   stopRecording();
void   sendAudio();
void   playAudio();
void   setLED(bool on);
void   blinkLED(int count, int delayMs);
void   createWAVHeader(uint8_t* header, uint32_t dataSize);

// ═══════════════════════════════════════════════════════════════
//  SETUP
// ═══════════════════════════════════════════════════════════════
void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(PIN_LED, OUTPUT);
  pinMode(PIN_BTN, INPUT_PULLUP);
  digitalWrite(PIN_LED, LOW);

  Serial.println("[Lucy ESP32] Iniciando...");

  recordBuffer = (int16_t*)malloc(RECORD_BUF_SIZE);
  if (!recordBuffer) {
    Serial.println("[ERRO] Falha ao alocar buffer de gravação");
    while (1) blinkLED(3, 200);
  }

  setupWiFi();
  blinkLED(2, 150);

  state = IDLE;
  Serial.println("[Lucy ESP32] Pronto!");
}

// ═══════════════════════════════════════════════════════════════
//  LOOP
// ═══════════════════════════════════════════════════════════════
void loop() {
  switch (state) {

    case IDLE: {
      if (digitalRead(PIN_BTN) == LOW) {
        delay(50);
        if (digitalRead(PIN_BTN) == LOW) {
          state = RECORDING;
          startRecording();
        }
      }
      break;
    }

    case RECORDING: {
      if (recordIndex >= RECORD_BUF_SIZE / sizeof(int16_t)) {
        stopRecording();
        state = SENDING;
        sendAudio();
        break;
      }

      size_t bytesRead = 0;
      esp_err_t err = i2s_read(
        I2S_NUM_0,
        &recordBuffer[recordIndex],
        RECORD_BUF_SIZE - recordIndex * sizeof(int16_t),
        &bytesRead,
        portMAX_DELAY
      );

      if (err == ESP_OK) {
        recordIndex += bytesRead / sizeof(int16_t);
      }

      if (digitalRead(PIN_BTN) == HIGH) {
        delay(50);
        if (digitalRead(PIN_BTN) == HIGH) {
          stopRecording();
          state = SENDING;
          sendAudio();
        }
      }
      break;
    }

    case SENDING:
      break;

    case PLAYING: {
      playAudio();

      free(playBuffer);
      playBuffer = NULL;
      playSize   = 0;
      playIndex  = 0;

      blinkLED(1, 100);
      state = IDLE;
      break;
    }

    case ERROR:
      blinkLED(5, 300);
      delay(3000);
      state = IDLE;
      break;
  }
}

// ═══════════════════════════════════════════════════════════════
//  FUNÇÕES
// ═══════════════════════════════════════════════════════════════

void setupWiFi() {
  Serial.print("[WiFi] Conectando a ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    attempts++;
    if (attempts > 40) {
      Serial.println("\n[ERRO] Falha ao conectar WiFi");
      ESP.restart();
    }
  }

  Serial.println("\n[WiFi] Conectado!");
  Serial.print("[WiFi] IP: ");
  Serial.println(WiFi.localIP());
}

void initI2SMic() {
  i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = BITS_PER_SAMPLE,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 8,
    .dma_buf_len = 256,
    .use_apll = false,
    .tx_desc_auto_clear = false,
    .fixed_mclk = 0,
    .mclk_multiple = I2S_MCLK_MULTIPLE_256,
    .bits_per_chan = I2S_BITS_PER_CHAN_DEFAULT,
  };

  i2s_pin_config_t pin_config = {
    .bck_io_num = PIN_I2S_SCK,
    .ws_io_num = PIN_I2S_WS,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num = PIN_I2S_SD,
  };

  i2s_driver_install(I2S_NUM_0, &i2s_config, 0, NULL);
  i2s_set_pin(I2S_NUM_0, &pin_config);
  i2s_set_clk(I2S_NUM_0, SAMPLE_RATE, BITS_PER_SAMPLE, I2S_CHANNEL_MONO);
}

void deinitI2S() {
  i2s_driver_uninstall(I2S_NUM_0);
}

void startRecording() {
  Serial.println("[REC] Iniciando gravação...");
  setLED(true);
  recordIndex = 0;
  memset(recordBuffer, 0, RECORD_BUF_SIZE);
  initI2SMic();
}

void stopRecording() {
  deinitI2S();
  setLED(false);
  recordSize = recordIndex * sizeof(int16_t);
  Serial.printf("[REC] Gravado: %zu bytes (%zu amostras)\n", recordSize, recordIndex);
}

void sendAudio() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] WiFi desconectado");
    state = ERROR;
    return;
  }

  size_t wavSize = recordSize + 44;
  uint8_t* wavData = (uint8_t*)malloc(wavSize);
  if (!wavData) {
    Serial.println("[HTTP] Falha ao alocar WAV buffer");
    state = ERROR;
    return;
  }

  createWAVHeader(wavData, recordSize);
  memcpy(wavData + 44, recordBuffer, recordSize);

  digitalWrite(PIN_LED, HIGH);

  HTTPClient http;
  http.begin(String(LUCY_SERVER) + "/api/voice?format=wav");
  http.addHeader("Authorization", "Bearer " + String(AUTH_TOKEN));
  http.addHeader("Content-Type", "audio/wav");

  Serial.printf("[HTTP] Enviando %zu bytes...\n", wavSize);
  int httpCode = http.POST(wavData, wavSize);
  free(wavData);

  Serial.printf("[HTTP] Resposta: %d\n", httpCode);

  if (httpCode != 200) {
    String err = http.getString();
    Serial.printf("[HTTP] Erro: %s\n", err.c_str());
    http.end();
    digitalWrite(PIN_LED, LOW);
    state = ERROR;
    return;
  }

  int contentLength = http.getSize();
  Serial.printf("[HTTP] Recebendo %d bytes...\n", contentLength);

  WiFiClient* stream = http.getStreamPtr();
  const int CHUNK = 1024;
  playBuffer = (int16_t*)malloc(contentLength + 1);
  playSize = 0;

  while (http.connected() && playSize < (size_t)contentLength) {
    size_t available = stream->available();
    if (available) {
      int toRead = min((int)available, CHUNK);
      int read = stream->readBytes(((uint8_t*)playBuffer) + playSize, toRead);
      playSize += read;
    }
    delay(1);
  }

  http.end();
  digitalWrite(PIN_LED, LOW);

  Serial.printf("[HTTP] Recebidos %zu bytes\n", playSize);
  state = PLAYING;
}

void playAudio() {
  if (!playBuffer || playSize < 44) {
    Serial.println("[PLAY] Buffer inválido");
    return;
  }

  uint8_t* data = (uint8_t*)playBuffer;

  // Detecta formato: WAV (RIFF) ou MP3 (0xFF 0xFB)
  bool isWAV = (data[0] == 'R' && data[1] == 'I');
  bool isMP3 = (data[0] == 0xFF && (data[1] & 0xE0) == 0xE0);

  if (!isWAV && !isMP3) {
    Serial.println("[PLAY] Formato de áudio não reconhecido");
    digitalWrite(PIN_LED, HIGH);
    delay(200);
    digitalWrite(PIN_LED, LOW);
    return;
  }

  if (isMP3) {
    Serial.println("[PLAY] Formato MP3 recebido — WAV é recomendado para ESP32");
    digitalWrite(PIN_LED, HIGH);
    delay(1000);
    digitalWrite(PIN_LED, LOW);
    return;
  }

  // Pula header WAV (44 bytes) e encontra o chunk data
  uint32_t dataOffset = 44;
  for (uint32_t i = 12; i < playSize - 8; i++) {
    if (data[i] == 'd' && data[i+1] == 'a' && data[i+2] == 't' && data[i+3] == 'a') {
      dataOffset = i + 8;
      break;
    }
  }

  uint32_t pcmSize = playSize - dataOffset;
  int16_t* pcmData = (int16_t*)(data + dataOffset);
  uint32_t sampleCount = pcmSize / 2;

  Serial.printf("[PLAY] Tocando %u amostras (%u ms)...\n",
    sampleCount, (sampleCount * 1000) / SAMPLE_RATE);

  digitalWrite(PIN_LED, HIGH);

  // Configura I2S modo DAC
  i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX | I2S_MODE_DAC_BUILT_IN),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 8,
    .dma_buf_len = 256,
    .use_apll = false,
    .tx_desc_auto_clear = true,
    .fixed_mclk = 0,
    .mclk_multiple = I2S_MCLK_MULTIPLE_256,
    .bits_per_chan = I2S_BITS_PER_CHAN_DEFAULT,
  };

  i2s_driver_install(I2S_NUM_0, &i2s_config, 0, NULL);
  i2s_set_dac_mode(I2S_DAC_CHANNEL_LEFT_EN);
  i2s_set_clk(I2S_NUM_0, SAMPLE_RATE, I2S_BITS_PER_SAMPLE_16BIT, I2S_CHANNEL_MONO);

  size_t bytesWritten = 0;
  i2s_write(I2S_NUM_0, pcmData, pcmSize, &bytesWritten, portMAX_DELAY);
  i2s_zero_dma_buffer(I2S_NUM_0);

  i2s_set_dac_mode(I2S_DAC_CHANNEL_DISABLE);
  deinitI2S();

  digitalWrite(PIN_LED, LOW);
  Serial.println("[PLAY] Fim da reprodução");
}

void createWAVHeader(uint8_t* header, uint32_t dataSize) {
  uint32_t fileSize = dataSize + 36;
  uint32_t byteRate = SAMPLE_RATE * 1 * 2;

  memcpy(header, "RIFF", 4);
  memcpy(header + 4, &fileSize, 4);
  memcpy(header + 8, "WAVE", 4);
  memcpy(header + 12, "fmt ", 4);

  uint32_t fmtSize = 16;
  uint16_t audioFmt = 1;
  uint16_t numCh = 1;
  uint16_t bitsPer = 16;
  uint16_t blockAlign = 2;

  memcpy(header + 16, &fmtSize, 4);
  memcpy(header + 20, &audioFmt, 2);
  memcpy(header + 22, &numCh, 2);
  memcpy(header + 24, &SAMPLE_RATE, 4);
  memcpy(header + 28, &byteRate, 4);
  memcpy(header + 32, &blockAlign, 2);
  memcpy(header + 34, &bitsPer, 2);
  memcpy(header + 36, "data", 4);
  memcpy(header + 40, &dataSize, 4);
}

void setLED(bool on) {
  digitalWrite(PIN_LED, on ? HIGH : LOW);
}

void blinkLED(int count, int delayMs) {
  for (int i = 0; i < count; i++) {
    digitalWrite(PIN_LED, HIGH);
    delay(delayMs);
    digitalWrite(PIN_LED, LOW);
    delay(delayMs);
  }
}
