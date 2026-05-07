package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ─── Notification ─────────────────────────────────────────────────

type Notification struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index"                       json:"user_id"`
	Type      string    `gorm:"type:varchar(30);not null"                      json:"type"` // comment|like|message|report_update
	Payload   string    `gorm:"type:jsonb;not null"                            json:"payload"`
	Read      bool      `gorm:"not null;default:false"                         json:"read"`
	CreatedAt time.Time `                                                      json:"created_at"`
}

func (n *Notification) BeforeCreate(tx *gorm.DB) error {
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	return nil
}

type NotificationPrefs struct {
	ID               uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID           uuid.UUID `gorm:"type:uuid;uniqueIndex;not null"                 json:"user_id"`
	PushEnabled      bool      `gorm:"not null;default:true"                          json:"push_enabled"`
	NotifyOnComment  bool      `gorm:"not null;default:true"                          json:"notify_on_comment"`
	NotifyOnLike     bool      `gorm:"not null;default:true"                          json:"notify_on_like"`
	NotifyOnMessage  bool      `gorm:"not null;default:true"                          json:"notify_on_message"`
}

type PushSubscription struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index"                       json:"user_id"`
	Endpoint  string    `gorm:"not null"                                       json:"endpoint"`
	P256dhKey string    `gorm:"column:p256dh_key;not null"                     json:"p256dh_key"`
	AuthKey   string    `gorm:"column:auth_key;not null"                       json:"auth_key"`
	CreatedAt time.Time `                                                      json:"created_at"`
}

// ─── Messagerie privée ────────────────────────────────────────────

type Conversation struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time `                                                      json:"created_at"`

	Participants []User    `gorm:"many2many:conversation_participants;" json:"participants,omitempty"`
	Messages     []Message `gorm:"foreignKey:ConversationID"           json:"messages,omitempty"`
}

func (c *Conversation) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

type Message struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ConversationID uuid.UUID `gorm:"type:uuid;not null;index"                       json:"conversation_id"`
	SenderID       uuid.UUID `gorm:"type:uuid;not null;index"                       json:"sender_id"`
	Content        string    `gorm:"not null"                                       json:"content"`
	Read           bool      `gorm:"not null;default:false"                         json:"read"`
	CreatedAt      time.Time `                                                      json:"created_at"`

	Sender User `gorm:"foreignKey:SenderID" json:"sender,omitempty"`
}

func (m *Message) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

// ─── Modération ───────────────────────────────────────────────────

type ModerationLog struct {
	ID           uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	TargetID     uuid.UUID  `gorm:"type:uuid;not null;index"                       json:"target_id"`
	TargetType   string     `gorm:"type:varchar(10);not null"                      json:"target_type"` // "post" | "comment"
	AIVerdict    string     `gorm:"type:varchar(30);not null"                      json:"ai_verdict"`
	AIReason     string     `gorm:"not null"                                       json:"ai_reason"`
	AIConfidence *float64   `                                                      json:"ai_confidence,omitempty"`
	ReviewedBy   *uuid.UUID `gorm:"type:uuid"                                      json:"reviewed_by,omitempty"`
	FinalStatus  *string    `gorm:"type:varchar(30)"                               json:"final_status,omitempty"`
	CreatedAt    time.Time  `                                                      json:"created_at"`
	ReviewedAt   *time.Time `                                                      json:"reviewed_at,omitempty"`
}

type Report struct {
	ID         uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ReporterID uuid.UUID  `gorm:"type:uuid;not null;index"                       json:"reporter_id"`
	TargetID   uuid.UUID  `gorm:"type:uuid;not null"                             json:"target_id"`
	TargetType string     `gorm:"type:varchar(10);not null"                      json:"target_type"` // "post"|"comment"|"user"
	Reason     string     `gorm:"not null"                                       json:"reason"`
	Status     string     `gorm:"type:varchar(20);not null;default:'pending'"    json:"status"` // pending|resolved|dismissed
	ResolvedBy *uuid.UUID `gorm:"type:uuid"                                      json:"resolved_by,omitempty"`
	CreatedAt  time.Time  `                                                      json:"created_at"`
	ResolvedAt *time.Time `                                                      json:"resolved_at,omitempty"`
}
