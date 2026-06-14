package consumer

import (
	"encoding/json"
	"log"
	"strings"

	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/bloiss/devhelp/worker/internal/moderation"
	"github.com/bloiss/devhelp/worker/internal/payload"
	"github.com/bloiss/devhelp/worker/internal/repository"
)

type Consumer struct {
	conn    *amqp.Connection
	channel *amqp.Channel
	queue   string
	modSvc  *moderation.Service
	repo    *repository.ModerationRepository
}

func New(amqpURL, queue string, modSvc *moderation.Service, repo *repository.ModerationRepository) (*Consumer, error) {
	conn, err := amqp.Dial(amqpURL)
	if err != nil {
		return nil, err
	}
	ch, err := conn.Channel()
	if err != nil {
		conn.Close()
		return nil, err
	}
	if _, err = ch.QueueDeclare(queue, true, false, false, false, nil); err != nil {
		ch.Close()
		conn.Close()
		return nil, err
	}
	if err = ch.Qos(1, 0, false); err != nil {
		ch.Close()
		conn.Close()
		return nil, err
	}
	return &Consumer{conn: conn, channel: ch, queue: queue, modSvc: modSvc, repo: repo}, nil
}

func (c *Consumer) Start() error {
	deliveries, err := c.channel.Consume(c.queue, "", false, false, false, false, nil)
	if err != nil {
		return err
	}
	log.Printf("Consumer ready, waiting for messages on queue: %s", c.queue)
	for msg := range deliveries {
		c.handle(msg)
	}
	return nil
}

func (c *Consumer) Close() {
	if c.channel != nil {
		c.channel.Close()
	}
	if c.conn != nil {
		c.conn.Close()
	}
}

func (c *Consumer) handle(msg amqp.Delivery) {
	var event payload.ModerationEvent
	if err := json.Unmarshal(msg.Body, &event); err != nil {
		log.Printf("invalid payload: %v", err)
		msg.Nack(false, false)
		return
	}

	result, err := c.modSvc.Classify(event.ContentType, event.Title, event.Body)
	if err != nil {
		log.Printf("moderation failed for %s %s: %v", event.ContentType, event.ContentID, err)
		_ = c.repo.CreateLog(event.ContentID, event.ContentType, "error", err.Error(), nil)
		msg.Ack(false)
		return
	}

	dbStatus := verdictToDBStatus(result.Status)
	var updateErr error
	if event.ContentType == "post" {
		updateErr = c.repo.UpdatePostStatus(event.ContentID, dbStatus)
	} else {
		updateErr = c.repo.UpdateCommentStatus(event.ContentID, dbStatus)
	}
	if updateErr != nil {
		log.Printf("db update failed for %s %s: %v", event.ContentType, event.ContentID, updateErr)
		msg.Nack(false, true)
		return
	}

	reason := strings.Join(result.Reasons, "; ")
	_ = c.repo.CreateLog(event.ContentID, event.ContentType, result.Status, reason, &result.Score)
	log.Printf("moderated %s %s → %s (score: %.2f)", event.ContentType, event.ContentID, result.Status, result.Score)
	msg.Ack(false)
}

func verdictToDBStatus(verdict string) string {
	switch verdict {
	case "approved":
		return "approved"
	case "flagged":
		return "flagged"
	case "rejected":
		return "blocked"
	default:
		return "pending_moderation"
	}
}
