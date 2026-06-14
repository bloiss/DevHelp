package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ContentStatus string

const (
	StatusPendingModeration ContentStatus = "pending_moderation"
	StatusApproved          ContentStatus = "approved"
	StatusFlagged           ContentStatus = "flagged"
	StatusBlocked           ContentStatus = "blocked"
)

// ─── Category ────────────────────────────────────────────────────

type Category struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name        string    `gorm:"uniqueIndex;not null"                           json:"name"`
	Slug        string    `gorm:"uniqueIndex;not null"                           json:"slug"`
	Description *string   `                                                      json:"description,omitempty"`
	Pillar      *string   `gorm:"type:varchar(10)"                               json:"pillar,omitempty"` // "dev" | "ai"
	CreatedAt   time.Time `                                                      json:"created_at"`

	Posts []Post `gorm:"foreignKey:CategoryID" json:"-"`
}

func (c *Category) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

// ─── Post ─────────────────────────────────────────────────────────

type Post struct {
	ID         uuid.UUID     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID     uuid.UUID     `gorm:"type:uuid;not null;index"                       json:"user_id"`
	CategoryID uuid.UUID     `gorm:"type:uuid;not null;index"                       json:"category_id"`
	Title      string        `gorm:"not null"                                       json:"title"`
	Content    string        `gorm:"type:text;not null"                             json:"content"` // TipTap HTML
	Status     ContentStatus `gorm:"type:varchar(30);not null;default:'pending_moderation'" json:"status"`
	IsHidden   bool          `gorm:"not null;default:false"                         json:"is_hidden"`
	CreatedAt  time.Time     `                                                      json:"created_at"`
	UpdatedAt  time.Time     `                                                      json:"updated_at"`

	// Relations
	Author   User        `gorm:"foreignKey:UserID"     json:"author,omitempty"`
	Category Category    `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Images   []PostImage `gorm:"foreignKey:PostID"     json:"images,omitempty"`
	Comments []Comment   `gorm:"foreignKey:PostID"     json:"-"`

	// Champs calculés (non stockés en DB)
	LikeCount    int64 `gorm:"-" json:"like_count"`
	DislikeCount int64 `gorm:"-" json:"dislike_count"`
	CommentCount int64 `gorm:"-" json:"comment_count"`
	UserVote     *int  `gorm:"-" json:"user_vote"`
}

func (p *Post) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

type PostImage struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	PostID    uuid.UUID `gorm:"type:uuid;not null;index"                       json:"post_id"`
	URL       string    `gorm:"not null"                                       json:"url"`
	SizeBytes int64     `gorm:"not null"                                       json:"size_bytes"`
	MimeType  string    `gorm:"not null"                                       json:"mime_type"`
	CreatedAt time.Time `                                                      json:"created_at"`
}

// ─── Comment ──────────────────────────────────────────────────────

type Comment struct {
	ID        uuid.UUID     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	PostID    uuid.UUID     `gorm:"type:uuid;not null;index"                       json:"post_id"`
	UserID    uuid.UUID     `gorm:"type:uuid;not null;index"                       json:"user_id"`
	Content   string        `gorm:"not null"                                       json:"content"`
	Status    ContentStatus `gorm:"type:varchar(30);not null;default:'pending_moderation'" json:"status"`
	IsHidden  bool          `gorm:"not null;default:false"                         json:"is_hidden"`
	CreatedAt time.Time     `                                                      json:"created_at"`
	UpdatedAt time.Time     `                                                      json:"updated_at"`

	Author User `gorm:"foreignKey:UserID" json:"author,omitempty"`

	// Champs calculés (non stockés en DB)
	LikeCount    int64 `gorm:"-" json:"like_count"`
	DislikeCount int64 `gorm:"-" json:"dislike_count"`
	UserVote     *int  `gorm:"-" json:"user_vote"`
}

func (c *Comment) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

// ─── Like ─────────────────────────────────────────────────────────

type Like struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID     uuid.UUID `gorm:"type:uuid;not null;index"                       json:"user_id"`
	TargetID   uuid.UUID `gorm:"type:uuid;not null"                             json:"target_id"`
	TargetType string    `gorm:"type:varchar(10);not null"                      json:"target_type"` // "post" | "comment"
	Value      int       `gorm:"not null"                                       json:"value"`       // +1 | -1
	CreatedAt  time.Time `                                                      json:"created_at"`
}

func (l *Like) BeforeCreate(tx *gorm.DB) error {
	if l.ID == uuid.Nil {
		l.ID = uuid.New()
	}
	return nil
}
