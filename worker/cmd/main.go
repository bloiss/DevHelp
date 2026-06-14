package main

import (
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"

	"github.com/bloiss/devhelp/worker/internal/consumer"
	"github.com/bloiss/devhelp/worker/internal/moderation"
	"github.com/bloiss/devhelp/worker/internal/repository"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func main() {
	if os.Getenv("ENV") != "production" {
		loadEnv()
	}

	rabbitURL := getEnv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")
	queueName := getEnv("RABBITMQ_MODERATION_QUEUE", "moderation.check")
	dbURL := mustEnv("DATABASE_URL")

	db, err := gorm.Open(postgres.Open(dbURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}
	log.Println("Database connected")

	modSvc := moderation.NewService()
	repo := repository.New(db)

	c, err := consumer.New(rabbitURL, queueName, modSvc, repo)
	if err != nil {
		log.Fatalf("RabbitMQ connection failed: %v", err)
	}
	defer c.Close()

	log.Printf("DevHelp Moderation Worker started | Queue: %s | AI: %s",
		queueName, getEnv("AI_PROVIDER", "ollama"))

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		if err := c.Start(); err != nil {
			log.Printf("consumer stopped: %v", err)
		}
	}()

	<-quit
	log.Println("Worker shutting down gracefully...")
}

func loadEnv() {
	dir, _ := os.Getwd()
	for {
		path := filepath.Join(dir, ".env")
		if err := godotenv.Load(path); err == nil {
			return
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	log.Println("No .env file found, using environment variables")
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
		log.Fatalf("missing required environment variable: %s", key)
	}
	return v
}
