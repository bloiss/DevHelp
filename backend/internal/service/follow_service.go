package service

import (
	"errors"

	"github.com/bloiss/devhelp/backend/internal/hub"
	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/bloiss/devhelp/backend/internal/repository"
	"github.com/google/uuid"
)

var ErrCannotFollowSelf = errors.New("cannot follow yourself")

type FollowService struct {
	repo     *repository.FollowRepository
	userRepo *repository.UserRepository
	notifSvc *NotificationService
	wsHub    *hub.Hub
}

func NewFollowService(
	repo *repository.FollowRepository,
	userRepo *repository.UserRepository,
	notifSvc *NotificationService,
	wsHub *hub.Hub,
) *FollowService {
	return &FollowService{
		repo:     repo,
		userRepo: userRepo,
		notifSvc: notifSvc,
		wsHub:    wsHub,
	}
}

func (s *FollowService) Follow(followerID, followingID uuid.UUID) error {
	if followerID == followingID {
		return ErrCannotFollowSelf
	}
	if err := s.repo.Follow(followerID, followingID); err != nil {
		return err
	}

	// Notification persistante + WS
	follower, _ := s.userRepo.FindByID(followerID)
	if follower != nil {
		_ = s.notifSvc.CreateFollowNotif(followingID, NotifPayload{
			Actor: follower.Username,
		})
		s.wsHub.Send(followingID, hub.Event{
			Type:    "notification",
			Payload: []byte(`{}`),
		})
	}

	return nil
}

func (s *FollowService) Unfollow(followerID, followingID uuid.UUID) error {
	return s.repo.Unfollow(followerID, followingID)
}

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
