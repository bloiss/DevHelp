package service

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"strings"
	"time"

	"github.com/bloiss/devhelp/backend/internal/middleware"
	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/bloiss/devhelp/backend/internal/repository"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var (
	ErrEmailAlreadyExists    = errors.New("email already in use")
	ErrUsernameAlreadyExists = errors.New("username already in use")
	ErrInvalidCredentials    = errors.New("invalid email or password")
	ErrInvalidToken          = errors.New("invalid or expired token")
	ErrAccountNotFound       = errors.New("account not found")
)

type AuthService struct {
	userRepo         *repository.UserRepository
	jwtAccessSecret  string
	jwtRefreshSecret string
	accessExpiry     time.Duration
	refreshExpiry    time.Duration
}

func NewAuthService(
	userRepo *repository.UserRepository,
	jwtAccessSecret, jwtRefreshSecret string,
	accessExpiry, refreshExpiry time.Duration,
) *AuthService {
	return &AuthService{
		userRepo:         userRepo,
		jwtAccessSecret:  jwtAccessSecret,
		jwtRefreshSecret: jwtRefreshSecret,
		accessExpiry:     accessExpiry,
		refreshExpiry:    refreshExpiry,
	}
}

// ─── Register ─────────────────────────────────────────────────────

type RegisterInput struct {
	Email    string
	Username string
	Password string
}

func (s *AuthService) Register(input RegisterInput) (*model.User, string, string, error) {
	// Unicité email
	if _, err := s.userRepo.FindByEmail(input.Email); err == nil {
		return nil, "", "", ErrEmailAlreadyExists
	}
	// Unicité username
	if _, err := s.userRepo.FindByUsername(input.Username); err == nil {
		return nil, "", "", ErrUsernameAlreadyExists
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", "", err
	}
	hashStr := string(hash)

	user := &model.User{
		Email:        input.Email,
		Username:     input.Username,
		PasswordHash: &hashStr,
		Role:         model.RoleUser,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, "", "", err
	}

	access, refresh, err := s.generateTokenPair(user)
	return user, access, refresh, err
}

// ─── Login ────────────────────────────────────────────────────────

func (s *AuthService) Login(email, password string) (*model.User, string, string, error) {
	user, err := s.userRepo.FindByEmail(email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", "", ErrInvalidCredentials
		}
		return nil, "", "", err
	}

	if user.PasswordHash == nil {
		return nil, "", "", ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(*user.PasswordHash), []byte(password)); err != nil {
		return nil, "", "", ErrInvalidCredentials
	}

	access, refresh, err := s.generateTokenPair(user)
	return user, access, refresh, err
}

// ─── Refresh ──────────────────────────────────────────────────────

func (s *AuthService) RefreshTokens(refreshTokenStr string) (*model.User, string, string, error) {
	tokenHash := hashToken(refreshTokenStr)

	rt, err := s.userRepo.FindRefreshToken(tokenHash)
	if err != nil || time.Now().After(rt.ExpiresAt) {
		return nil, "", "", ErrInvalidToken
	}

	user, err := s.userRepo.FindByID(rt.UserID)
	if err != nil {
		return nil, "", "", ErrAccountNotFound
	}

	// Rotation : supprimer l'ancien token et en créer un nouveau
	_ = s.userRepo.DeleteRefreshToken(tokenHash)

	access, refresh, err := s.generateTokenPair(user)
	return user, access, refresh, err
}

// ─── Forgot Password ──────────────────────────────────────────────

func (s *AuthService) ForgotPassword(email string) (string, error) {
	user, err := s.userRepo.FindByEmail(email)
	if err != nil {
		// Ne pas révéler si l'email existe ou non
		return "", nil
	}

	rawToken, err := generateSecureToken(32)
	if err != nil {
		return "", err
	}

	resetToken := &model.PasswordResetToken{
		UserID:    user.ID,
		TokenHash: hashToken(rawToken),
		ExpiresAt: time.Now().Add(1 * time.Hour),
	}

	if err := s.userRepo.CreatePasswordResetToken(resetToken); err != nil {
		return "", err
	}

	return rawToken, nil
}

// ─── Reset Password ───────────────────────────────────────────────

func (s *AuthService) ResetPassword(rawToken, newPassword string) error {
	tokenHash := hashToken(rawToken)

	resetToken, err := s.userRepo.FindPasswordResetToken(tokenHash)
	if err != nil || time.Now().After(resetToken.ExpiresAt) {
		return ErrInvalidToken
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user, err := s.userRepo.FindByID(resetToken.UserID)
	if err != nil {
		return ErrAccountNotFound
	}

	hashStr := string(hash)
	user.PasswordHash = &hashStr
	if err := s.userRepo.Update(user); err != nil {
		return err
	}

	return s.userRepo.MarkResetTokenUsed(resetToken.ID)
}

// ─── Set Password (après inscription OAuth) ───────────────────────

func (s *AuthService) SetPassword(userID uuid.UUID, newPassword string) error {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return ErrAccountNotFound
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	hashStr := string(hash)
	user.PasswordHash = &hashStr
	return s.userRepo.Update(user)
}

// ─── Logout ───────────────────────────────────────────────────────

func (s *AuthService) Logout(refreshTokenStr string) error {
	return s.userRepo.DeleteRefreshToken(hashToken(refreshTokenStr))
}

func (s *AuthService) GetUserByID(id uuid.UUID) (*model.User, error) {
	return s.userRepo.FindByID(id)
}

// ─── Helpers privés ───────────────────────────────────────────────

func (s *AuthService) generateTokenPair(user *model.User) (string, string, error) {
	access, err := middleware.GenerateAccessToken(user.ID, string(user.Role), s.jwtAccessSecret, s.accessExpiry)
	if err != nil {
		return "", "", err
	}

	rawRefresh, err := generateSecureToken(32)
	if err != nil {
		return "", "", err
	}

	rt := &model.RefreshToken{
		UserID:    user.ID,
		TokenHash: hashToken(rawRefresh),
		ExpiresAt: time.Now().Add(s.refreshExpiry),
	}
	if err := s.userRepo.CreateRefreshToken(rt); err != nil {
		return "", "", err
	}

	return access, rawRefresh, nil
}

func hashToken(token string) string {
	h := sha256.Sum256([]byte(token))
	return hex.EncodeToString(h[:])
}

func generateSecureToken(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return strings.TrimRight(hex.EncodeToString(b), "="), nil
}
