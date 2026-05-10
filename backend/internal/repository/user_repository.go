package repository

import (
	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(user *model.User) error {
	return r.db.Create(user).Error
}

func (r *UserRepository) FindByID(id uuid.UUID) (*model.User, error) {
	var user model.User
	err := r.db.First(&user, "id = ?", id).Error
	return &user, err
}

func (r *UserRepository) FindByEmail(email string) (*model.User, error) {
	var user model.User
	err := r.db.First(&user, "email = ?", email).Error
	return &user, err
}

func (r *UserRepository) FindByUsername(username string) (*model.User, error) {
	var user model.User
	err := r.db.First(&user, "username = ?", username).Error
	return &user, err
}

func (r *UserRepository) Update(user *model.User) error {
	return r.db.Save(user).Error
}

func (r *UserRepository) UpdateRole(id uuid.UUID, role model.UserRole) error {
	return r.db.Model(&model.User{}).Where("id = ?", id).Update("role", role).Error
}

func (r *UserRepository) FindAll(limit, offset int) ([]model.User, int64, error) {
	var users []model.User
	var total int64
	r.db.Model(&model.User{}).Count(&total)
	err := r.db.Limit(limit).Offset(offset).Find(&users).Error
	return users, total, err
}

// ─── OAuth ────────────────────────────────────────────────────────

func (r *UserRepository) FindOAuthProvider(provider, providerID string) (*model.OAuthProvider, error) {
	var op model.OAuthProvider
	err := r.db.First(&op, "provider = ? AND provider_id = ?", provider, providerID).Error
	return &op, err
}

func (r *UserRepository) CreateOAuthProvider(op *model.OAuthProvider) error {
	return r.db.Create(op).Error
}

func (r *UserRepository) FindOAuthByUserAndProvider(userID uuid.UUID, provider string) (*model.OAuthProvider, error) {
	var op model.OAuthProvider
	err := r.db.First(&op, "user_id = ? AND provider = ?", userID, provider).Error
	return &op, err
}

// ─── Refresh tokens ───────────────────────────────────────────────

func (r *UserRepository) CreateRefreshToken(rt *model.RefreshToken) error {
	return r.db.Create(rt).Error
}

func (r *UserRepository) FindRefreshToken(tokenHash string) (*model.RefreshToken, error) {
	var rt model.RefreshToken
	err := r.db.First(&rt, "token_hash = ?", tokenHash).Error
	return &rt, err
}

func (r *UserRepository) DeleteRefreshToken(tokenHash string) error {
	return r.db.Delete(&model.RefreshToken{}, "token_hash = ?", tokenHash).Error
}

func (r *UserRepository) DeleteUserRefreshTokens(userID uuid.UUID) error {
	return r.db.Delete(&model.RefreshToken{}, "user_id = ?", userID).Error
}

// ─── Password reset ───────────────────────────────────────────────

func (r *UserRepository) CreatePasswordResetToken(t *model.PasswordResetToken) error {
	// Invalider les anciens tokens non utilisés pour cet utilisateur
	r.db.Model(&model.PasswordResetToken{}).
		Where("user_id = ? AND used = false", t.UserID).
		Update("used", true)
	return r.db.Create(t).Error
}

func (r *UserRepository) FindPasswordResetToken(tokenHash string) (*model.PasswordResetToken, error) {
	var t model.PasswordResetToken
	err := r.db.First(&t, "token_hash = ? AND used = false", tokenHash).Error
	return &t, err
}

func (r *UserRepository) MarkResetTokenUsed(id uuid.UUID) error {
	return r.db.Model(&model.PasswordResetToken{}).Where("id = ?", id).Update("used", true).Error
}
