package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRole string

const (
	RoleUser      UserRole = "user"
	RoleModerator UserRole = "moderator"
	RoleAdmin     UserRole = "admin"
)

type User struct {
	ID            uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Email         string     `gorm:"uniqueIndex;not null"                           json:"email"`
	Username      string     `gorm:"uniqueIndex;not null"                           json:"username"`
	PasswordHash  *string    `gorm:"column:password_hash"                           json:"-"`
	AvatarURL     *string    `gorm:"column:avatar_url"                              json:"avatar_url,omitempty"`
	Role          UserRole   `gorm:"type:varchar(20);not null;default:'user'"       json:"role"`
	EmailVerified bool       `gorm:"not null;default:false"                         json:"email_verified"`
	CreatedAt     time.Time  `                                                      json:"created_at"`
	UpdatedAt     time.Time  `                                                      json:"updated_at"`
	DeletedAt     *time.Time `gorm:"index"                                          json:"-"`

	// Relations
	OAuthProviders      []OAuthProvider      `gorm:"foreignKey:UserID"      json:"-"`
	Posts               []Post               `gorm:"foreignKey:UserID"      json:"-"`
	Comments            []Comment            `gorm:"foreignKey:UserID"      json:"-"`
	NotificationPrefs   *NotificationPrefs   `gorm:"foreignKey:UserID"      json:"-"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

type OAuthProvider struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID     uuid.UUID `gorm:"type:uuid;not null;index"                       json:"user_id"`
	Provider   string    `gorm:"type:varchar(20);not null"`
	ProviderID string    `gorm:"type:varchar(255);not null"`
	CreatedAt  time.Time
}

type RefreshToken struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index"`
	TokenHash string    `gorm:"not null"`
	ExpiresAt time.Time `gorm:"not null"`
	CreatedAt time.Time
}

type PasswordResetToken struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index"`
	TokenHash string    `gorm:"not null"`
	ExpiresAt time.Time `gorm:"not null"`
	Used      bool      `gorm:"not null;default:false"`
	CreatedAt time.Time
}
