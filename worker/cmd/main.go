package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/joho/godotenv"
)

func main() {
	if os.Getenv("ENV") != "production" {
		if err := godotenv.Load("../../.env"); err != nil {
			log.Println("No .env file found, using environment variables")
		}
	}

	log.Println("DevHelp Moderation Worker starting...")
	log.Printf("RabbitMQ: %s", os.Getenv("RABBITMQ_URL"))
	log.Printf("AI Provider: %s", os.Getenv("AI_PROVIDER"))

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	// TODO: démarrer le consumer RabbitMQ
	// consumer := consumer.New(rabbitmqURL, aiClient, db)
	// go consumer.Start()

	<-quit
	log.Println("Worker shutting down gracefully...")
}
