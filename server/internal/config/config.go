package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	DatabaseURL string
	JWTSecret   string
	OpenAIKey   string
	RedisURL    string
}

func Load() (*Config, error) {
	godotenv.Load()

	cfg := &Config{
		Port:        getEnv("PORT", "8080"),
		DatabaseURL: getEnv("DATABASE_URL", "postgres://lucy:lucy@localhost:5432/lucy?sslmode=disable"),
		JWTSecret:   getEnv("JWT_SECRET", ""),
		OpenAIKey:   getEnv("OPENAI_API_KEY", ""),
		RedisURL:    getEnv("REDIS_URL", "redis://localhost:6379/0"),
	}

	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
