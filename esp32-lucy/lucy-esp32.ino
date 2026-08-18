/*
 * Lucy ESP32 — Firmware para assistente de voz
 *
 * Hardware:
 *   ESP32 Devkit V1
 *   Microfone INMP441 (I2S)
 *   Amplificador PAM8403 + Alto-falante
 *   LED (status, opcional — HAS_LED)
 *
 * Fluxo (escuta contínua, sem botão):
 *   LISTENING (espera fala) → [fala detectada] → RECORDING
 *   → [silêncio ≥ SILENCE_MS ou duração máxima] → SENDING
 *   → [download com streaming playback] → LISTENING
 *
 * A resposta do servidor é tocada em streaming: o PCM é reproduzido
 * enquanto o HTTP chega (i2s_write bloqueante dita o ritmo), então
 * não há limite prático de tamanho da resposta.
 *
 * A fala é detectada por energia (RMS): quando o áudio passa de
 * VAD_THRESHOLD começa a gravar (com um "pré-roll" para não cortar
 * o início da frase). Ao ficar silencioso por SILENCE_MS, encerra,
 * envia para o servidor e reproduz a resposta.
 *
 * Pinagem:
 *   INMP441: VDD→3.3V  GND→GND  L/R→GND  SD→GPIO32  SCK→GPIO14  WS→GPIO15
 *   PAM8403: LIN→GPIO25(1µF)  GND→GND  VDD→5V
 *   LED:     GPIO2→resistor→GND (opcional)
 *
 * Rede:
 *   LUCY_SERVER aceita http:// (rede local) ou https:// (nuvem).
 *   Para HTTPS usa WiFiClientSecure com setInsecure (aceita qualquer
 *   certificado — prático para APIs; não é o ideal em produção).
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <driver/i2s.h>
#include <esp_heap_caps.h>
#include <math.h>

// ─── CONFIGURAÇÃO ───────────────────────────────────────────────
const char* WIFI_SSID   = "FAMILIA LOPES";
const char* WIFI_PASS   = "el.906725@";

// URL do servidor Lucy. Pode ser HTTP (LAN) ou HTTPS (nuvem).
// Ex.: http://192.168.1.100:3333  ou  https://lucy.producao.com
const char* LUCY_SERVER = "http://192.168.15.3:3333";
const char* AUTH_TOKEN  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMDE5ZmNlNDItZjFlZS03ZGM1LTllNTUtMTc4Y2MyY2M0NGQxIiwiZGV2aWNlIjp0cnVlLCJpYXQiOjE3ODU4NzE5MjksImV4cCI6MTgxNzQwNzkyOX0.dl-_IIrXEXsf9dDJuGhzW2WKtppe3T4g0NfHHw5ryYU";

// LED de status (opcional). 1 se houver LED no GPIO2.
#define HAS_LED 0

// ─── VAD (detecção de fala/silêncio) ───────────────────────────
#define VAD_THRESHOLD   900    // RMS acima disso = fala (ajuste se preciso)
// Exige N chunks consecutivos acima do limiar antes de começar a
// gravar — ignora picos isolados de ruído (clic, estática).
#define VAD_DEBOUNCE    3      // chunks consecutivos (~60ms)
#define SILENCE_MS      800    // silêncio contínuo para encerrar gravação
#define MAX_RECORD_SEC  3      // teto de duração de uma gravação (RAM limita)
#define PRE_ROLL_MS     300    // áudio antes da fala (naturalidade)

// Tempo (ms) após terminar de tocar uma resposta em que o microfone é
// ignorado. Evita que o próprio alto-falante re-dispare a gravação
// (feedback acústico: o mic capta o fim da resposta e grava em loop).
#define PLAYBACK_COOLDOWN_MS 1000

// ─── PINOS ──────────────────────────────────────────────────────
#define PIN_I2S_SD    32
#define PIN_I2S_SCK   14
#define PIN_I2S_WS    15
#define PIN_DAC       25
#define PIN_LED        2

// ─── CONFIGURAÇÕES DE ÁUDIO ─────────────────────────────────────
// 22050 Hz: o driver legacy do IDF 5.x exige mclk = rate*2*slot_bits
// com 160MHz/mclk < 256 no modo DAC built-in → rate > ~19531 Hz.
#define SAMPLE_RATE    22050
#define CHUNK_MS       20
#define CHUNK_SAMPLES  (SAMPLE_RATE * CHUNK_MS / 1000)
#define CHUNK_BYTES    (CHUNK_SAMPLES * 2)

#define RECORD_SAMPLES (SAMPLE_RATE * MAX_RECORD_SEC)
#define RECORD_BUF_SIZE (RECORD_SAMPLES * 2)

#define PRE_ROLL_CHUNKS ((PRE_ROLL_MS + CHUNK_MS - 1) / CHUNK_MS)

// Teto do tamanho da resposta de áudio (cabe na RAM do ESP32).
// ~100KB ≈ 2.3s de áudio 22050Hz mono 16-bit. (Com o streaming
// playback o limite deixa de existir; fica só como segurança.)
#define MAX_PLAY_SIZE   (100 * 1024)

// Limiar VAD dinâmico: calibrado no boot pelo micSelfTest (múltiplo
// do ruído de fundo medido). Evita disparar em ambiente barulhento.
uint32_t vadThreshold = VAD_THRESHOLD;

// ─── ESTADOS ────────────────────────────────────────────────────
enum State { LISTENING, RECORDING, SENDING };
State state = LISTENING;

const bool USE_HTTPS = String(LUCY_SERVER).startsWith("https://");

// ─── BUFFERS ────────────────────────────────────────────────────
int16_t* recordBuffer = NULL;
size_t   recordCapacity = 0;   // amostras alocadas de fato (após fallback)
size_t   recordSamples = 0;

int16_t  preRoll[PRE_ROLL_CHUNKS][CHUNK_SAMPLES];
uint8_t  preRollIndex = 0;

uint32_t silenceMs = 0;

int16_t* playBuffer = NULL;
size_t   playSize   = 0;

// ─── PROTÓTIPOS ─────────────────────────────────────────────────
void   setupWiFi();
void   initI2SMic();
void   deinitI2S();
void   startListening();
bool   allocRecordBuffer();
bool   readChunk(int16_t* buf);
uint32_t computeRMS(const int16_t* buf);
void   pushPreRoll(const int16_t* chunk);
void   beginRecording(const int16_t* chunk);
void   appendSamples(const int16_t* buf, size_t n);
void   finishRecordingAndSend();
bool   sendAudio();
void   initDAC(uint32_t sampleRate);
void   deinitDAC();
void   playAudio();
void   createWAVHeader(uint8_t* header, uint32_t dataSize);
void   setupLED();
void   setLED(bool on);
void   blinkLED(int count, int delayMs);
void   playTone(float freq, int durationMs, float volume = 0.25f);
void   playPowerOn();
void   playReady();
void   playRecording();
void   playError();
bool   fetchGreeting();

// ═══════════════════════════════════════════════════════════════
//  SETUP
// ═══════════════════════════════════════════════════════════════
void setup() {
  Serial.begin(115200);
  delay(500);

  setupLED();

  Serial.println("[Lucy ESP32] Iniciando...");

  // Self-test do mic ANTES de qualquer ciclo de DAC (isola o efeito
  // da transição DAC→RX que o greeting faz no boot).
  micSelfTest();

  // Beep imediato de power-on: anuncia que ligou mesmo sem Wi-Fi.
  playPowerOn();

  setupWiFi();
  blinkLED(2, 150);

  // Saudação por voz ("Pronta!") via servidor; sem servidor, beeps locais.
  // O buffer de gravação é alocado DEPOIS: reservá-lo antes reduziria o
  // maior bloco contíguo de heap e faria o malloc do greeting falhar.
  if (!fetchGreeting()) {
    playReady();
  }

  // Aloca o buffer de gravação com o heap já liberado pelo greeting.
  // A alocação é adaptativa: cai para 2s/1s/0.5s se o maior bloco
  // contíguo de heap não comportar o tamanho máximo.
  allocRecordBuffer();

  startListening();
  Serial.println("[Lucy ESP32] Pronto — escutando...");
}

// ═══════════════════════════════════════════════════════════════
//  LOOP
// ═══════════════════════════════════════════════════════════════
void loop() {
  switch (state) {

    case LISTENING: {
      int16_t chunk[CHUNK_SAMPLES];
      if (!readChunk(chunk)) break;

      uint32_t rms = computeRMS(chunk);

      // Diagnóstico: mostra o pico e a média de RMS a cada ~1s para
      // calibrar o VAD_THRESHOLD (fala deve ficar bem acima do ruído
      // ambiente). min/max/nz distinguem "fiação morta" (tudo zero) de
      // "sinal fraco" (valores pequenos, mas não nulos).
      {
        static uint32_t micPeak = 0;
        static int16_t micMin = 0, micMax = 0;
        static uint32_t micNz = 0;
        static uint64_t rmsSum = 0;
        static uint32_t rmsCount = 0;
        static uint32_t micPrintMs = 0;

        int16_t mn = INT16_MAX, mx = INT16_MIN;
        uint32_t nz = 0;
        for (int i = 0; i < CHUNK_SAMPLES; i++) {
          int16_t v = chunk[i];
          if (v < mn) mn = v;
          if (v > mx) mx = v;
          if (v != 0) nz++;
        }
        if (rms > micPeak) micPeak = rms;
        if (mn < micMin) micMin = mn;
        if (mx > micMax) micMax = mx;
        if (nz > micNz) micNz = nz;
        rmsSum += rms;
        rmsCount++;

        if (millis() - micPrintMs >= 1000) {
          uint32_t rmsAvg = rmsCount ? (uint32_t)(rmsSum / rmsCount) : 0;
          Serial.printf("[MIC] RMS pico: %u | médio: %u | min=%d max=%d | nz=%u/%u\n",
            micPeak, rmsAvg, micMin, micMax, micNz, (unsigned)CHUNK_SAMPLES);
          micPeak = 0; micMin = 0; micMax = 0; micNz = 0;
          rmsSum = 0; rmsCount = 0;
          micPrintMs = millis();
        }
      }

      // Debounce: só começa a gravar depois de VAD_DEBOUNCE chunks
      // consecutivos acima do limiar (evita picos isolados de ruído).
      static uint8_t overCount = 0;
      if (rms >= vadThreshold) {
        if (++overCount >= VAD_DEBOUNCE) {
          overCount = 0;
          beginRecording(chunk);
        }
      } else {
        overCount = 0;
        pushPreRoll(chunk);
      }
      break;
    }

    case RECORDING: {
      int16_t chunk[CHUNK_SAMPLES];
      if (!readChunk(chunk)) break;

      uint32_t rms = computeRMS(chunk);
      appendSamples(chunk, CHUNK_SAMPLES);

      if (rms >= vadThreshold) {
        silenceMs = 0;
      } else {
        silenceMs += CHUNK_MS;
      }

      if (silenceMs >= SILENCE_MS || recordSamples >= recordCapacity) {
        finishRecordingAndSend();
      }
      break;
    }

    case SENDING:
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
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
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
  i2s_set_clk(I2S_NUM_0, SAMPLE_RATE, I2S_BITS_PER_SAMPLE_16BIT, I2S_CHANNEL_MONO);
  // Descarta dados antigos do DMA (por ex. restos de um ciclo de DAC)
  // para não lermos lixo/zeros logo após instalar o RX.
  i2s_zero_dma_buffer(I2S_NUM_0);
}

// Self-test do microfone ANTES de qualquer uso do DAC: lê ~0.5s e
// imprime estatísticas. Distingue fiação morta (tudo zero) de sinal
// fraco, e isola o efeito da transição DAC→RX que o greeting faz.
void micSelfTest() {
  initI2SMic();

  int16_t buf[CHUNK_SAMPLES];
  int16_t mn = INT16_MAX, mx = INT16_MIN;
  uint32_t nz = 0, total = 0;
  uint64_t sumSq = 0;

  uint32_t chunks = (uint32_t)(0.5f * SAMPLE_RATE / CHUNK_SAMPLES);
  for (uint32_t c = 0; c < chunks; c++) {
    if (!readChunk(buf)) break;

    // Mesma medição sem DC do computeRMS, para a calibração do limiar
    // refletir o ruído real (sem o viés de DC da alimentação).
    int64_t s = 0;
    for (int i = 0; i < CHUNK_SAMPLES; i++) s += buf[i];
    int32_t mean = (int32_t)(s / CHUNK_SAMPLES);

    for (int i = 0; i < CHUNK_SAMPLES; i++) {
      int32_t v = buf[i] - mean;
      if (buf[i] < mn) mn = buf[i];
      if (buf[i] > mx) mx = buf[i];
      if (buf[i] != 0) nz++;
      sumSq += (uint64_t)(v * v);
      total++;
    }
  }

  uint32_t rms = total ? (uint32_t)sqrtf((float)(sumSq / total)) : 0;
  Serial.printf("[MIC-TEST] %u chunks | RMS=%u min=%d max=%d nz=%u/%u\n",
    (unsigned)chunks, rms, mn, mx, (unsigned)nz, (unsigned)total);

  // Auto-calibração do VAD: limiar = ruído de fundo × 1.5 (mínimo
  // VAD_THRESHOLD). Assim o dispositivo funciona em ambientes com
  // ruído (fontes, ventiladores) sem disparar em silêncio. Se o mic
  // estiver com problema de hardware (RMS absurdamente alto), o log
  // acima mostra e o limiar sobe junto — a fala real fica bem acima.
  if (rms > 0) {
    uint32_t autoThr = (uint32_t)((float)rms * 1.5f);
    vadThreshold = autoThr > (uint32_t)VAD_THRESHOLD
      ? autoThr
      : (uint32_t)VAD_THRESHOLD;
    Serial.printf("[MIC-TEST] Ruído base RMS=%u → VAD limiar=%u\n",
      rms, vadThreshold);
  }

  deinitI2S();
}

void deinitI2S() {
  i2s_driver_uninstall(I2S_NUM_0);
}

void startListening() {
  if (!recordBuffer) {
    if (!allocRecordBuffer()) {
      while (1) blinkLED(3, 200);
    }
  }

  memset(preRoll, 0, sizeof(preRoll));
  preRollIndex  = 0;
  silenceMs     = 0;
  recordSamples = 0;

  initI2SMic();
  setLED(false);
  state = LISTENING;
}

// Aloca o buffer de gravação de forma adaptativa. Tenta o tamanho
// máximo (RECORD_SAMPLES) e, se o heap não tiver bloco contíguo
// suficiente, cai para 2s, 1s e 0.5s. Registra o heap disponível
// para diagnóstico. Retorna false apenas se nem 0.5s couber.
bool allocRecordBuffer() {
  recordBuffer = NULL;
  recordCapacity = 0;

  Serial.printf("[MEM] Heap livre: %u bytes, maior bloco: %u bytes\n",
    (unsigned)ESP.getFreeHeap(),
    (unsigned)heap_caps_get_largest_free_block(MALLOC_CAP_8BIT));

  static const size_t caps[] = {
    RECORD_SAMPLES,          // 3s
    SAMPLE_RATE * 2,         // 2s
    SAMPLE_RATE,             // 1s
    SAMPLE_RATE / 2,         // 0.5s
  };

  for (size_t cap : caps) {
    // Reserva 44 bytes extras no início para montar o header WAV
    // in-place, sem precisar de um segundo buffer na hora do envio
    // (a RAM do ESP32 não tem bloco contíguo grande o bastante).
    recordBuffer = (int16_t*)malloc(cap * 2 + 44);
    if (recordBuffer) {
      recordCapacity = cap;
      Serial.printf("[MEM] Buffer de gravação: %u amostras (%.1fs, %u bytes)\n",
        (unsigned)cap, (float)cap / SAMPLE_RATE, (unsigned)(cap * 2 + 44));
      return true;
    }
    Serial.printf("[MEM] Falha ao alocar %u bytes (%u amostras)\n",
      (unsigned)(cap * 2 + 44), (unsigned)cap);
  }

  Serial.println("[ERRO] Heap insuficiente para o buffer de gravação");
  return false;
}

bool readChunk(int16_t* buf) {
  size_t bytesRead = 0;
  esp_err_t err = i2s_read(
    I2S_NUM_0, buf, CHUNK_BYTES, &bytesRead, portMAX_DELAY
  );
  if (err != ESP_OK) return false;

  while (bytesRead < CHUNK_BYTES) {
    size_t got = 0;
    esp_err_t e = i2s_read(
      I2S_NUM_0, (uint8_t*)buf + bytesRead, CHUNK_BYTES - bytesRead,
      &got, portMAX_DELAY
    );
    if (e != ESP_OK) return false;
    bytesRead += got;
  }
  return true;
}

uint32_t computeRMS(const int16_t* buf) {
  // Remove o DC offset (viés de nível DC da alimentação do INMP441)
  // antes de medir a energia: com fonte suja o offset infla o RMS e
  // faz o VAD disparar em silêncio.
  int64_t sum = 0;
  for (int i = 0; i < CHUNK_SAMPLES; i++) {
    sum += buf[i];
  }
  int32_t mean = (int32_t)(sum / CHUNK_SAMPLES);

  uint64_t sumSq = 0;
  for (int i = 0; i < CHUNK_SAMPLES; i++) {
    int32_t v = buf[i] - mean;
    sumSq += (uint64_t)(v * v);
  }
  return (uint32_t)sqrtf((float)(sumSq / CHUNK_SAMPLES));
}

void pushPreRoll(const int16_t* chunk) {
  memcpy(preRoll[preRollIndex], chunk, CHUNK_BYTES);
  preRollIndex = (preRollIndex + 1) % PRE_ROLL_CHUNKS;
}

void beginRecording(const int16_t* chunk) {
  recordSamples = 0;

  // Copia o pré-roll (últimos chunks) na ordem cronológica.
  for (int i = 0; i < PRE_ROLL_CHUNKS; i++) {
    int idx = (preRollIndex + i) % PRE_ROLL_CHUNKS;
    appendSamples(preRoll[idx], CHUNK_SAMPLES);
  }

  appendSamples(chunk, CHUNK_SAMPLES);
  silenceMs = 0;

  setLED(true);
  Serial.printf("[REC] Fala detectada — gravando (RMS acima de %u)...\n", vadThreshold);

  // Beep curto avisa que a captura começou. O beep usa o DAC no
  // mesmo I2S_NUM_0 do microfone, então desliga o mic antes de
  // tocar e religa em seguida para continuar amostrando.
  deinitI2S();
  playRecording();
  initI2SMic();

  state = RECORDING;
}

void appendSamples(const int16_t* buf, size_t n) {
  size_t max = recordCapacity - recordSamples;
  if (n > max) n = max;
  // O PCM começa 44 bytes depois do início (espaço reservado para o
  // header WAV, montado in-place na hora do envio).
  int16_t* pcm = (int16_t*)((uint8_t*)recordBuffer + 44);
  memcpy(pcm + recordSamples, buf, n * 2);
  recordSamples += n;
}

void finishRecordingAndSend() {
  deinitI2S();
  setLED(false);

  Serial.printf("[REC] Gravado: %zu bytes (%zu amostras)\n",
    recordSamples * 2, recordSamples);

  bool ok = sendAudio();
  if (ok) {
    blinkLED(1, 100);

    // Deixa o som do alto-falante morrer antes de religar o mic,
    // senão o VAD capta o próprio eco e re-grava em loop.
    delay(PLAYBACK_COOLDOWN_MS);

    startListening();
  } else {
    playError();
    blinkLED(5, 300);
    delay(3000);
    startListening();
  }
}

bool sendAudio() {
  if (recordSamples == 0) {
    Serial.println("[HTTP] Nada gravado");
    return false;
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] WiFi desconectado");
    return false;
  }

  size_t wavSize = recordSamples * 2 + 44;
  // Monta o header WAV in-place no próprio recordBuffer (44 bytes
  // reservados em appendSamples), evitando um malloc extra que não
  // caberia junto com o buffer de gravação.
  createWAVHeader((uint8_t*)recordBuffer, recordSamples * 2);

  setLED(true);

  HTTPClient http;
  WiFiClientSecure secureClient;
  String url = String(LUCY_SERVER) + "/api/voice?format=wav";

  if (USE_HTTPS) {
    secureClient.setInsecure();
    http.begin(secureClient, url);
  } else {
    http.begin(url);
  }

  http.addHeader("Authorization", "Bearer " + String(AUTH_TOKEN));
  http.addHeader("Content-Type", "audio/wav");
  http.setTimeout(30000);

  Serial.printf("[HTTP] Enviando %zu bytes para %s\n", wavSize, url.c_str());
  int httpCode = http.POST((uint8_t*)recordBuffer, wavSize);
  // Libera o buffer de gravação antes de alocar o de reprodução
  // (a RAM do ESP32 é limitada).
  free(recordBuffer);
  recordBuffer = NULL;

  if (httpCode != 200) {
    String err = http.getString();
    Serial.printf("[HTTP] Erro %d: %s\n", httpCode, err.c_str());
    http.end();
    setLED(false);
    return false;
  }

  int contentLength = http.getSize();
  Serial.printf("[HTTP] Resposta OK, recebendo %d bytes...\n", contentLength);

  WiFiClient* stream = http.getStreamPtr();

  // Lê o cabeçalho WAV (44 bytes) para descobrir o offset do chunk
  // "data" e a taxa de amostragem da resposta.
  uint8_t header[64];
  size_t headerLen = 0;
  uint32_t lastByteMs = millis();
  while (headerLen < 44 && http.connected()) {
    if (stream->available()) {
      int r = stream->readBytes(header + headerLen, 44 - headerLen);
      if (r <= 0) break;
      headerLen += r;
      lastByteMs = millis();
    } else if (millis() - lastByteMs > 5000) {
      break;
    }
  }
  if (headerLen < 44 || header[0] != 'R' || header[1] != 'I') {
    Serial.println("[HTTP] Cabeçalho WAV inválido");
    http.end();
    setLED(false);
    return false;
  }

  uint32_t dataOffset = 44;
  uint32_t sampleRate = SAMPLE_RATE;
  for (uint32_t i = 12; i + 8 <= headerLen; i++) {
    if (header[i] == 'd' && header[i+1] == 'a' && header[i+2] == 't' && header[i+3] == 'a') {
      dataOffset = i + 8;
      break;
    }
  }
  if (headerLen >= 28) {
    sampleRate = header[24] | (header[25] << 8) | (header[26] << 16) | (header[27] << 24);
    if (sampleRate == 0) sampleRate = SAMPLE_RATE;
  }

  // Pula bytes excedentes até o início do PCM (headers não padrão
  // podem ter chunks extras entre "fmt " e "data").
  while (dataOffset > headerLen) {
    if (!stream->available()) {
      if (millis() - lastByteMs > 5000) break;
      delay(1);
      continue;
    }
    uint8_t junk[64];
    int r = stream->readBytes(junk, min((size_t)64, (size_t)(dataOffset - headerLen)));
    if (r <= 0) break;
    headerLen += r;
  }
  if (dataOffset > headerLen) {
    Serial.println("[HTTP] Fim prematuro do cabeçalho WAV");
    http.end();
    setLED(false);
    return false;
  }

  // Streaming playback: toca o PCM conforme ele chega, sem guardar a
  // resposta inteira na RAM. O i2s_write bloqueante dita o ritmo do
  // download — respostas de qualquer tamanho tocam completas.
  setLED(true);
  initDAC(sampleRate);

  uint8_t chunk[2048];
  size_t playedBytes = 0;
  lastByteMs = millis();
  while (http.connected()) {
    if (contentLength > 0 && playedBytes >= (size_t)contentLength - dataOffset) break;

    if (stream->available()) {
      int toRead = min((int)stream->available(), (int)sizeof(chunk));
      int r = stream->readBytes(chunk, toRead);
      if (r <= 0) break;
      size_t written = 0;
      i2s_write(I2S_NUM_0, chunk, r, &written, portMAX_DELAY);
      playedBytes += r;
      lastByteMs = millis();
    } else if (millis() - lastByteMs > 5000) {
      break;
    }
  }

  i2s_zero_dma_buffer(I2S_NUM_0);
  deinitDAC();

  http.end();
  setLED(false);

  Serial.printf("[HTTP] Recebidos %zu bytes de PCM (streaming)\n", playedBytes);
  return playedBytes > 0;
}

void initDAC(uint32_t sampleRate) {
  // Configura I2S modo DAC
  i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX | I2S_MODE_DAC_BUILT_IN),
    .sample_rate = sampleRate,
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
  i2s_set_clk(I2S_NUM_0, sampleRate, I2S_BITS_PER_SAMPLE_16BIT, I2S_CHANNEL_MONO);
}

void deinitDAC() {
  i2s_set_dac_mode(I2S_DAC_CHANNEL_DISABLE);
  deinitI2S();
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
    setLED(true);
    delay(200);
    setLED(false);
    return;
  }

  if (isMP3) {
    Serial.println("[PLAY] Formato MP3 recebido — WAV é recomendado para ESP32");
    setLED(true);
    delay(1000);
    setLED(false);
    return;
  }

  // Pula header WAV e encontra o chunk data
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

  setLED(true);

  initDAC(SAMPLE_RATE);

  size_t bytesWritten = 0;
  i2s_write(I2S_NUM_0, pcmData, pcmSize, &bytesWritten, portMAX_DELAY);
  i2s_zero_dma_buffer(I2S_NUM_0);

  deinitDAC();

  setLED(false);
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
  uint32_t sampleRate = SAMPLE_RATE;
  memcpy(header + 24, &sampleRate, 4);
  memcpy(header + 28, &byteRate, 4);
  memcpy(header + 32, &blockAlign, 2);
  memcpy(header + 34, &bitsPer, 2);
  memcpy(header + 36, "data", 4);
  memcpy(header + 40, &dataSize, 4);
}

// ═══════════════════════════════════════════════════════════════
//  FEEDBACK SONORO (sem tela/LED)
// ═══════════════════════════════════════════════════════════════

// Sintetiza um tom senoidal como WAV e toca no DAC (GPIO25).
// Bloqueia enquanto toca; libera a memória ao final.
void playTone(float freq, int durationMs, float volume) {
  uint32_t samples = (uint32_t)(SAMPLE_RATE * durationMs / 1000);
  if (samples == 0) return;

  uint32_t wavSize = 44 + samples * 2;
  uint8_t* buf = (uint8_t*)malloc(wavSize);
  if (!buf) {
    Serial.println("[BEEP] Falha ao alocar buffer");
    return;
  }

  createWAVHeader(buf, samples * 2);
  int16_t* pcm = (int16_t*)(buf + 44);

  uint32_t fadeSamples = (uint32_t)(SAMPLE_RATE * 0.005f); // 5ms fade in/out
  for (uint32_t i = 0; i < samples; i++) {
    float env = 1.0f;
    if (i < fadeSamples) env = (float)i / fadeSamples;
    if (samples - i < fadeSamples) env = (float)(samples - i) / fadeSamples;
    float v = sinf(2.0f * PI * freq * ((float)i / SAMPLE_RATE));
    pcm[i] = (int16_t)(v * 32767.0f * volume * env);
  }

  playBuffer = (int16_t*)buf;
  playSize = wavSize;
  playAudio();
  free(playBuffer);
  playBuffer = NULL;
  playSize = 0;
}

void playPowerOn() {
  playTone(1100, 80);
}

void playReady() {
  playTone(880, 120);
  delay(90);
  playTone(880, 120);
}

void playRecording() {
  playTone(1200, 90);
}

void playError() {
  playTone(180, 200);
  delay(100);
  playTone(180, 250);
}

// Baixa e toca o "Pronta!" do servidor. Retorna false se indisponível.
bool fetchGreeting() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[GREET] WiFi desconectado — beeps locais");
    return false;
  }

  HTTPClient http;
  WiFiClientSecure secureClient;
  String url = String(LUCY_SERVER) + "/api/voice/greeting";

  if (USE_HTTPS) {
    secureClient.setInsecure();
    http.begin(secureClient, url);
  } else {
    http.begin(url);
  }

  http.addHeader("Authorization", "Bearer " + String(AUTH_TOKEN));
  // Timeout generoso: a primeira geração do greeting (cache frio)
  // leva ~11s no servidor (Edge TTS). Com cache quente é instantâneo.
  http.setTimeout(20000);

  Serial.printf("[GREET] Buscando %s\n", url.c_str());
  int httpCode = http.GET();
  if (httpCode != 200) {
    Serial.printf("[GREET] Erro %d\n", httpCode);
    http.end();
    return false;
  }

  int contentLength = http.getSize();
  WiFiClient* stream = http.getStreamPtr();
  size_t allocSize = MAX_PLAY_SIZE;
  if (contentLength > 0 && (size_t)contentLength < allocSize) {
    allocSize = contentLength;
  }
  playBuffer = (int16_t*)malloc(allocSize + 1);
  playSize = 0;
  if (!playBuffer) {
    Serial.println("[GREET] Falha ao alocar buffer");
    http.end();
    return false;
  }

  uint32_t lastByteMs = millis();
  while (http.connected() && playSize < allocSize) {
    if (contentLength > 0 && playSize >= (size_t)contentLength) break;
    if (stream->available()) {
      int toRead = min(
        (int)stream->available(),
        (int)(allocSize - playSize)
      );
      if (toRead > 0) {
        int read = stream->readBytes((uint8_t*)playBuffer + playSize, toRead);
        playSize += read;
        lastByteMs = millis();
      }
    } else if (millis() - lastByteMs > 5000) {
      break;
    }
  }

  http.end();

  bool ok = playSize > 44;
  if (ok) {
    Serial.printf("[GREET] Recebidos %zu bytes, tocando...\n", playSize);
    playAudio();
  } else {
    Serial.println("[GREET] Resposta vazia");
  }

  free(playBuffer);
  playBuffer = NULL;
  playSize = 0;
  return ok;
}

#if HAS_LED
void setupLED() {
  pinMode(PIN_LED, OUTPUT);
  digitalWrite(PIN_LED, LOW);
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
#else
void setupLED() {}

void setLED(bool on) {
  (void)on;
}

void blinkLED(int count, int delayMs) {
  (void)count;
  (void)delayMs;
}
#endif
