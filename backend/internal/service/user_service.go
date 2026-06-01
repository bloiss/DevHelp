package service

import (
	"errors"
	"strings"

	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/bloiss/devhelp/backend/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrUserNotFound      = errors.New("user not found")
	ErrUsernameTaken     = errors.New("username already taken")
	ErrUsernameInvalid   = errors.New("username must be 3-30 chars, alphanumeric and underscores only")
	ErrRoleInvalid       = errors.New("invalid role")
)

type UserService struct {
	userRepo   *repository.UserRepository
	postRepo   *repository.PostRepository
	followRepo *repository.FollowRepository
}

func NewUserService(userRepo *repository.UserRepository, postRepo *repository.PostRepository, followRepo *repository.FollowRepository) *UserService {
	return &UserService{userRepo: userRepo, postRepo: postRepo, followRepo: followRepo}
}

// ProfileResponse est la réponse publique enrichie du profil utilisateur.
type ProfileResponse struct {
	User           *model.User  `json:"user"`
	PostCount      int64        `json:"post_count"`
	FollowerCount  int64        `json:"follower_count"`
	FollowingCount int64        `json:"following_count"`
	IsFollowing    bool         `json:"is_following"`
	RecentPosts    []model.Post `json:"recent_posts"`
}

// PublicProfile est conservé pour la compatibilité (non utilisé en externe).
type PublicProfile = ProfileResponse

func (s *UserService) GetProfile(username string, requesterID *uuid.UUID) (*ProfileResponse, error) {
	user, err := s.userRepo.FindByUsername(username)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	approved := model.StatusApproved
	recentPosts, postCount, err := s.postRepo.FindAll(repository.PostFilters{
		AuthorID:    &user.ID,
		Status:      &approved,
		Page:        1,
		PageSize:    5,
		RequesterID: requesterID,
	})
	if err != nil {
		return nil, err
	}

	followerCount := s.followRepo.CountFollowers(user.ID)
	followingCount := s.followRepo.CountFollowing(user.ID)

	isFollowing := false
	if requesterID != nil {
		isFollowing = s.followRepo.IsFollowing(*requesterID, user.ID)
	}

	return &ProfileResponse{
		User:           user,
		PostCount:      postCount,
		FollowerCount:  followerCount,
		FollowingCount: followingCount,
		IsFollowing:    isFollowing,
		RecentPosts:    recentPosts,
	}, nil
}

// ─── Admin ────────────────────────────────────────────────────────────────────

type UserListResult struct {
	Data    []model.User `json:"data"`
	Total   int64        `json:"total"`
	Page    int          `json:"page"`
	PerPage int          `json:"per_page"`
}

func (s *UserService) ListUsers(page, pageSize int) (*UserListResult, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize
	users, total, err := s.userRepo.FindAll(pageSize, offset)
	if err != nil {
		return nil, err
	}
	return &UserListResult{Data: users, Total: total, Page: page, PerPage: pageSize}, nil
}

func (s *UserService) SetRole(userID uuid.UUID, role model.UserRole) error {
	switch role {
	case model.RoleUser, model.RoleModerator, model.RoleAdmin:
		// valid
	default:
		return ErrRoleInvalid
	}
	return s.userRepo.UpdateRole(userID, role)
}

// ─── UpdateMe ─────────────────────────────────────────────────────────────────

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
