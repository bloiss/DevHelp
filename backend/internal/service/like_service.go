package service

import (
	"errors"

	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/bloiss/devhelp/backend/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var ErrInvalidVoteValue = errors.New("value must be 1 or -1")

type LikeService struct {
	repo *repository.LikeRepository
}

func NewLikeService(repo *repository.LikeRepository) *LikeService {
	return &LikeService{repo: repo}
}

type VoteResult struct {
	VoteCount int64  `json:"vote_count"`
	UserVote  *int   `json:"user_vote"` // +1, -1 ou null
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

	count, err := s.repo.CountByTarget(targetID, targetType)
	if err != nil {
		return nil, err
	}

	// Récupère le vote actuel de l'utilisateur après l'opération
	updated, err := s.repo.Find(userID, targetID, targetType)
	var userVote *int
	if err == nil {
		v := updated.Value
		userVote = &v
	}

	return &VoteResult{VoteCount: count, UserVote: userVote}, nil
}
