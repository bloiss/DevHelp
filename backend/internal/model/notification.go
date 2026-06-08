package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Notification struct {
	ID         uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID     uuid.UUID  `gorm:"type:uuid;not null;index"                       json:"user_id"`
	Type       string     `gorm:"type:varchar(30);not null"                      json:"type"`
	Payload    string     `gorm:"type:text;not null;default:'{}'"                json:"payload"`
	Read       bool       `gorm:"not null;default:false"                         json:"read"`
	IsStarred  bool       `gorm:"column:is_starred;not null;default:false"       json:"is_starred"`
	IsArchived bool       `gorm:"column:is_archived;not null;default:false"      json:"is_archived"`
	DeletedAt  *time.Time `gorm:"column:deleted_at;index"                        json:"deleted_at,omitempty"`
	CreatedAt  time.Time  `                                                      json:"created_at"`
}

func (n *Notification) BeforeCreate(tx *gorm.DB) error {
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	return nil
}
