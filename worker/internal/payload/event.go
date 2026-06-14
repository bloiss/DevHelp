package payload

import "time"

type ModerationEvent struct {
	ContentType string    `json:"content_type"`
	ContentID   string    `json:"content_id"`
	AuthorID    string    `json:"author_id"`
	Title       string    `json:"title,omitempty"`
	Body        string    `json:"body"`
	CreatedAt   time.Time `json:"created_at"`
}
