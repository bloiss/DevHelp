package service

import (
	"encoding/json"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

type ModerationEvent struct {
	ContentType string    `json:"content_type"`
	ContentID   string    `json:"content_id"`
	AuthorID    string    `json:"author_id"`
	Title       string    `json:"title,omitempty"`
	Body        string    `json:"body"`
	CreatedAt   time.Time `json:"created_at"`
}

type ModerationPublisher struct {
	conn    *amqp.Connection
	channel *amqp.Channel
	queue   string
}

func NewModerationPublisher(url, queue string) (*ModerationPublisher, error) {
	conn, err := amqp.Dial(url)
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
	return &ModerationPublisher{conn: conn, channel: ch, queue: queue}, nil
}

func (p *ModerationPublisher) Publish(event ModerationEvent) error {
	body, err := json.Marshal(event)
	if err != nil {
		return err
	}
	return p.channel.Publish("", p.queue, false, false, amqp.Publishing{
		ContentType:  "application/json",
		DeliveryMode: amqp.Persistent,
		Body:         body,
	})
}

func (p *ModerationPublisher) Close() {
	if p.channel != nil {
		p.channel.Close()
	}
	if p.conn != nil {
		p.conn.Close()
	}
}
