package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Notification struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index"                       json:"user_id"`
	Type      string    `gorm:"type:varchar(30);not null"                      json:"type"`
	Payload   string    `gorm:"type:text;not null;default:'{}'"                json:"payload"`
	Read      bool      `gorm:"not null;default:false"                         json:"read"`
	CreatedAt time.Time `                                                      json:"created_at"`
}

func (n *Notification) BeforeCreate(tx *gorm.DB) error {
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	return nil
}
