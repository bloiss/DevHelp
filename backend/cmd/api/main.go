package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	// Charger .env en développement
	if os.Getenv("ENV") != "production" {
		if err := godotenv.Load("../../.env"); err != nil {
			log.Println("No .env file found, using environment variables")
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("DevHelp API starting on port %s", port)

	// TODO: initialiser DB, router, middlewares
	// router := api.NewRouter()
	// log.Fatal(http.ListenAndServe(":"+port, router))
}
