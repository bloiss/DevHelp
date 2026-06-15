package service

import (
	"errors"

	"github.com/bloiss/devhelp/backend/internal/hub"
	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/bloiss/devhelp/backend/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var ErrInvalidVoteValue = errors.New("value must be 1 or -1")

type LikeService struct {
	repo     *repository.LikeRepository
	postRepo *repository.PostRepository
	userRepo *repository.UserRepository
	notifSvc *NotificationService
	wsHub    *hub.Hub
}

func NewLikeService(
	repo *repository.LikeRepository,
	postRepo *repository.PostRepository,
	userRepo *repository.UserRepository,
	notifSvc *NotificationService,
	wsHub *hub.Hub,
) *LikeService {
	return &LikeService{repo: repo, postRepo: postRepo, userRepo: userRepo, notifSvc: notifSvc, wsHub: wsHub}
}

func (s *LikeService) sendPostLikeNotif(likerID, postID uuid.UUID) {
	post, err := s.postRepo.FindByID(postID, nil)
	if err != nil || post.UserID == likerID {
		return
	}
	liker, err := s.userRepo.FindByID(likerID)
	if err != nil {
		return
	}
	_ = s.notifSvc.CreateLikeNotif(post.UserID, NotifPayload{
		Actor:        liker.Username,
		PostID:       postID.String(),
		PostTitle:    post.Title,
		PostCategory: post.Category.Slug,
	})
	s.wsHub.Send(post.UserID, hub.Event{
		Type:    "notification",
		Payload: []byte(`{}`),
	})
}

type VoteResult struct {
	LikeCount    int64 `json:"like_count"`
	DislikeCount int64 `json:"dislike_count"`
	UserVote     *int  `json:"user_vote"`
}

// Toggle gère le vote d'un utilisateur sur un post ou commentaire.
// - Même valeur → supprime le vote (toggle off)
// - Valeur différente → met à jour le vote
// - Pas de vote existant → crée le vote
func (s *LikeService) Toggle(userID, targetID uuid.UUID, targetType string, value int) (*VoteResult, error) {
	if value != 1 && value != -1 {
		return nil, ErrInvalidVoteValue
	}

	existing, err := s.repo.Find(userID, targetID, targetType)

	if err != nil && errors.Is(err, gorm.ErrRecordNotFound) {
		// Pas de vote → créer
		like := &model.Like{
			UserID:     userID,
			TargetID:   targetID,
			TargetType: targetType,
			Value:      value,
		}
		if err := s.repo.Create(like); err != nil {
			return nil, err
		}
		// Notification pour les likes positifs sur posts (pas d'auto-notification)
		if targetType == "post" && value == 1 {
			s.sendPostLikeNotif(userID, targetID)
		}
	} else if err == nil {
		if existing.Value == value {
			// Même valeur → supprimer (toggle off)
			if err := s.repo.Delete(existing.ID); err != nil {
				return nil, err
			}
		} else {
			// Valeur différente → mettre à jour
			existing.Value = value
			if err := s.repo.Update(existing); err != nil {
				return nil, err
			}
		}
	} else {
		return nil, err
	}

	likes, dislikes, err := s.repo.CountSeparate(targetID, targetType)
	if err != nil {
		return nil, err
	}

	updated, err := s.repo.Find(userID, targetID, targetType)
	var userVote *int
	if err == nil {
		v := updated.Value
		userVote = &v
	}

	return &VoteResult{LikeCount: likes, DislikeCount: dislikes, UserVote: userVote}, nil
}
