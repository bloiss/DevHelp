package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	if os.Getenv("ENV") != "production" {
		if err := godotenv.Load("../../.env"); err != nil {
			log.Println("No .env file found, using environment variables")
		}
	}

	log.Println("DevHelp Moderation Worker starting...")

	// TODO: connexion RabbitMQ + boucle de consommation
	// consumer := worker.NewConsumer()
	// consumer.Start()
}
