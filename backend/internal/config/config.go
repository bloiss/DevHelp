package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port string
	Env  string

	DatabaseURL string

	JWTAccessSecret  string
	JWTRefreshSecret string
	JWTAccessExpiry  string
	JWTRefreshExpiry string

	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string

	GitHubClientID     string
	GitHubClientSecret string
	GitHubRedirectURL  string

	SMTPHost     string
	SMTPPort     int
	SMTPUser     string
	SMTPPassword string
	SMTPFrom     string

	CaptchaSecret string

	S3Endpoint  string
	S3AccessKey string
	S3SecretKey string
	S3Bucket    string
	S3Region    string
	S3UseSSL    bool

	RabbitMQURL             string
	RabbitMQModerationQueue string

	AIProvider    string
	OpenAIAPIKey  string
	OpenAIModel   string
	AnthropicKey  string
	AnthropicModel string
	OllamaBaseURL string
	OllamaModel   string

	SentryDSN string
}

func Load() *Config {
	smtpPort, _ := strconv.Atoi(getEnv("SMTP_PORT", "587"))

	return &Config{
		Port: getEnv("PORT", "8080"),
		Env:  getEnv("ENV", "development"),

		DatabaseURL: mustEnv("DATABASE_URL"),

		JWTAccessSecret:  mustEnv("JWT_ACCESS_SECRET"),
		JWTRefreshSecret: mustEnv("JWT_REFRESH_SECRET"),
		JWTAccessExpiry:  getEnv("JWT_ACCESS_EXPIRY", "15m"),
		JWTRefreshExpiry: getEnv("JWT_REFRESH_EXPIRY", "168h"),

		GoogleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		GoogleRedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),

		GitHubClientID:     os.Getenv("GITHUB_CLIENT_ID"),
		GitHubClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
		GitHubRedirectURL:  os.Getenv("GITHUB_REDIRECT_URL"),

		SMTPHost:     os.Getenv("SMTP_HOST"),
		SMTPPort:     smtpPort,
		SMTPUser:     os.Getenv("SMTP_USER"),
		SMTPPassword: os.Getenv("SMTP_PASSWORD"),
		SMTPFrom:     getEnv("SMTP_FROM", "noreply@devhelp.app"),

		CaptchaSecret: os.Getenv("CAPTCHA_SECRET"),

		S3Endpoint:  getEnv("S3_ENDPOINT", "http://localhost:9000"),
		S3AccessKey: os.Getenv("S3_ACCESS_KEY"),
		S3SecretKey: os.Getenv("S3_SECRET_KEY"),
		S3Bucket:    getEnv("S3_BUCKET", "devhelp"),
		S3Region:    getEnv("S3_REGION", "us-east-1"),
		S3UseSSL:    getEnv("S3_USE_SSL", "false") == "true",

		RabbitMQURL:             getEnv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/"),
		RabbitMQModerationQueue: getEnv("RABBITMQ_MODERATION_QUEUE", "moderation.check"),

		AIProvider:     getEnv("AI_PROVIDER", "ollama"),
		OpenAIAPIKey:   os.Getenv("OPENAI_API_KEY"),
		OpenAIModel:    getEnv("OPENAI_MODEL", "gpt-4o-mini"),
		AnthropicKey:   os.Getenv("ANTHROPIC_API_KEY"),
		AnthropicModel: getEnv("ANTHROPIC_MODEL", "claude-haiku-4-5-20251001"),
		OllamaBaseURL:  getEnv("OLLAMA_BASE_URL", "http://localhost:11434"),
		OllamaModel:    getEnv("OLLAMA_MODEL", "llama3.2"),

		SentryDSN: os.Getenv("SENTRY_DSN"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		panic("missing required env var: " + key)
	}
	return v
}
