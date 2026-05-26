package service

import (
	"errors"
	"strings"
	"time"

	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/bloiss/devhelp/backend/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrUserNotFound      = errors.New("user not found")
	ErrUsernameTaken     = errors.New("username already taken")
	ErrUsernameInvalid   = errors.New("username must be 3-30 chars, alphanumeric and underscores only")
)

type UserService struct {
	userRepo *repository.UserRepository
	postRepo *repository.PostRepository
}

func NewUserService(userRepo *repository.UserRepository, postRepo *repository.PostRepository) *UserService {
	return &UserService{userRepo: userRepo, postRepo: postRepo}
}

// PublicProfile est la réponse publique du profil utilisateur.
type PublicProfile struct {
	ID        uuid.UUID      `json:"id"`
	Username  string         `json:"username"`
	AvatarURL *string        `json:"avatar_url,omitempty"`
	Role      model.UserRole `json:"role"`
	CreatedAt time.Time      `json:"created_at"`
	PostCount int64          `json:"post_count"`
}

func (s *UserService) GetProfile(username string) (*PublicProfile, error) {
	user, err := s.userRepo.FindByUsername(username)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	approved := model.StatusApproved
	_, postCount, err := s.postRepo.FindAll(repository.PostFilters{
		AuthorID: &user.ID,
		Status:   &approved,
		Page:     1,
		PageSize: 1,
	})
	if err != nil {
		return nil, err
	}

	return &PublicProfile{
		ID:        user.ID,
		Username:  user.Username,
		AvatarURL: user.AvatarURL,
		Role:      user.Role,
		CreatedAt: user.CreatedAt,
		PostCount: postCount,
	}, nil
}

type UpdateMeInput struct {
	Username  *string `json:"username"`
	AvatarURL *string `json:"avatar_url"`
}

func (s *UserService) UpdateMe(userID uuid.UUID, input UpdateMeInput) (*model.User, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, ErrUserNotFound
	}

	if input.Username != nil {
		slug := strings.TrimSpace(*input.Username)
		if len(slug) < 3 || len(slug) > 30 {
			return nil, ErrUsernameInvalid
		}
		for _, c := range slug {
			if !((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '_') {
				return nil, ErrUsernameInvalid
			}
		}
		// Vérifie disponibilité
		existing, err := s.userRepo.FindByUsername(slug)
		if err == nil && existing.ID != userID {
			return nil, ErrUsernameTaken
		}
		user.Username = slug
	}

	if input.AvatarURL != nil {
		user.AvatarURL = input.AvatarURL
	}

	if err := s.userRepo.Update(user); err != nil {
		return nil, err
	}
	return user, nil
}
