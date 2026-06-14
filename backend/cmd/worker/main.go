package main

import (
    "encoding/json"
    "log"
    "os"
    "os/signal"
    "syscall"

    "github.com/bloiss/devhelp/backend/internal/queue"
    "github.com/joho/godotenv"
)

func main() {
    if os.Getenv("ENV") != "production" {
        if err := godotenv.Load("../.env"); err != nil {
            log.Println("No .env file found, using environment variables")
        }
    }

    mq, err := queue.New(os.Getenv("RABBITMQ_URL"))
    if err != nil {
        log.Fatalf("RabbitMQ connection failed: %v", err)
    }
    defer mq.Close()

    msgs, err := mq.Consume("post.moderation")
    if err != nil {
        log.Fatalf("Failed to consume: %v", err)
    }

    log.Println("Worker started, waiting for posts...")

    go func() {
        for msg := range msgs {
            var payload map[string]string
            json.Unmarshal(msg.Body, &payload)
            log.Printf("Received post for moderation: %s", payload["post_id"])
        }
    }()

    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit
    log.Println("Worker shutting down...")
}
