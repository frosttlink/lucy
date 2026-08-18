/*
 * Lucy ESP32 — Teste do alto-falante
 *
 * Toca um tom de 440Hz por 2s e depois 880Hz por 2s, em loop,
 * direto pelo DAC (GPIO25) — o mesmo caminho do firmware principal.
 *
 * NÃO precisa de Wi-Fi nem de servidor. Se você OUVIR os tons,
 * a cadeia ESP32 → capacitor 1µF → PAM8403 → alto-falante está OK.
 *
 * Upload: Ferramentas → Placa → "ESP32 Dev Module" → Upload (→)
 * Monitor Serial: 115200 baud
 */

#include <driver/i2s.h>
#include <math.h>

// 22050 Hz: o driver legacy do IDF 5.x exige rate > ~19531 Hz
// no modo DAC built-in (160MHz/(rate*2*slot_bits) < 256).
#define SAMPLE_RATE 22050

void playTone(float freq, int durationMs, float volume = 0.3f) {
  uint32_t samples = (uint32_t)(SAMPLE_RATE * durationMs / 1000);
  if (samples == 0) return;

  int16_t* pcm = (int16_t*)malloc(samples * 2);
  if (!pcm) return;

  uint32_t fade = SAMPLE_RATE / 200; // 5ms fade in/out (evita "estalo")
  for (uint32_t i = 0; i < samples; i++) {
    float env = 1.0f;
    if (i < fade) env = (float)i / fade;
    if (samples - i < fade) env = (float)(samples - i) / fade;
    float v = sinf(2.0f * PI * freq * ((float)i / SAMPLE_RATE));
    pcm[i] = (int16_t)(v * 32767.0f * volume * env);
  }

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
  i2s_write(I2S_NUM_0, pcm, samples * 2, &bytesWritten, portMAX_DELAY);
  i2s_zero_dma_buffer(I2S_NUM_0);

  i2s_set_dac_mode(I2S_DAC_CHANNEL_DISABLE);
  i2s_driver_uninstall(I2S_NUM_0);

  free(pcm);
}

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("[TESTE] Tom em loop: 440Hz 2s → 880Hz 2s");
}

void loop() {
  Serial.println("Tocando 440Hz por 2s...");
  playTone(440, 2000);
  delay(300);
  Serial.println("Tocando 880Hz por 2s...");
  playTone(880, 2000);
  delay(2000);
}
