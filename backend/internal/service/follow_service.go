package service

import (
	"errors"

	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/bloiss/devhelp/backend/internal/repository"
	"github.com/google/uuid"
)

var ErrCannotFollowSelf = errors.New("cannot follow yourself")

type FollowService struct {
	repo *repository.FollowRepository
}

func NewFollowService(repo *repository.FollowRepository) *FollowService {
	return &FollowService{repo: repo}
}

func (s *FollowService) Follow(followerID, followingID uuid.UUID) error {
	if followerID == followingID {
		return ErrCannotFollowSelf
	}
	return s.repo.Follow(followerID, followingID)
}

func (s *FollowService) Unfollow(followerID, followingID uuid.UUID) error {
	return s.repo.Unfollow(followerID, followingID)
}

// Stats retourne (followers, following, isFollowing).
// targetUserID est l'utilisateur dont on consulte le profil.
// requesterID est l'utilisateur connecté (peut être nil si non connecté).
func (s *FollowService) Stats(targetUserID uuid.UUID, requesterID *uuid.UUID) (followers, following int64, isFollowing bool) {
	followers = s.repo.CountFollowers(targetUserID)
	following = s.repo.CountFollowing(targetUserID)
	if requesterID != nil {
		isFollowing = s.repo.IsFollowing(*requesterID, targetUserID)
	}
	return
}

func (s *FollowService) ListFollowers(userID uuid.UUID) ([]model.User, error) {
	return s.repo.ListFollowers(userID)
}

func (s *FollowService) ListFollowing(userID uuid.UUID) ([]model.User, error) {
	return s.repo.ListFollowing(userID)
}
