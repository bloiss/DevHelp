package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

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
	ID              uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"          json:"id"`
	Status          string     `gorm:"type:varchar(20);not null;default:'active'"              json:"status"` // "active" | "request"
	RequestSenderID *uuid.UUID `gorm:"type:uuid"                                               json:"request_sender_id,omitempty"`
	CreatedAt       time.Time  `                                                               json:"created_at"`

	Participants []User    `gorm:"many2many:conversation_participants;" json:"participants,omitempty"`
	Messages     []Message `gorm:"foreignKey:ConversationID"           json:"messages,omitempty"`
}

func (c *Conversation) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

// Message représente un message dans une conversation.
// Status: "sent" | "delivered" | "read"
type Message struct {
	ID             uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ConversationID uuid.UUID  `gorm:"type:uuid;not null;index"                       json:"conversation_id"`
	SenderID       uuid.UUID  `gorm:"type:uuid;not null;index"                       json:"sender_id"`
	Content        string     `gorm:"not null"                                       json:"content"`
	Status         string     `gorm:"type:varchar(20);not null;default:'sent'"       json:"status"`
	AttachmentURL  *string    `gorm:"type:text"                                      json:"attachment_url,omitempty"`
	AttachmentType *string    `gorm:"type:varchar(20)"                               json:"attachment_type,omitempty"` // "image" | "gif"
	SharedPostID   *uuid.UUID `gorm:"type:uuid"                                      json:"shared_post_id,omitempty"`
	IsDeleted      bool       `gorm:"not null;default:false"                         json:"is_deleted"`
	CreatedAt      time.Time  `                                                      json:"created_at"`

	Sender     User          `gorm:"foreignKey:SenderID"     json:"sender,omitempty"`
	SharedPost *Post         `gorm:"foreignKey:SharedPostID" json:"shared_post,omitempty"`
	Reads      []MessageRead `gorm:"foreignKey:MessageID"    json:"reads,omitempty"`
}

func (m *Message) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

// MessageRead enregistre qui a lu quel message et quand.
type MessageRead struct {
	MessageID uuid.UUID `gorm:"type:uuid;primaryKey;index" json:"message_id"`
	UserID    uuid.UUID `gorm:"type:uuid;primaryKey;index" json:"user_id"`
	ReadAt    time.Time `gorm:"not null"                   json:"read_at"`
}

// UserPresence suit la présence en ligne et la conversation active.
type UserPresence struct {
	UserID       uuid.UUID  `gorm:"type:uuid;primaryKey"     json:"user_id"`
	LastSeen     time.Time  `gorm:"not null"                 json:"last_seen"`
	ActiveConvID *uuid.UUID `gorm:"type:uuid"                json:"active_conv_id,omitempty"`
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
