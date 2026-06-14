package service

import (
	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/bloiss/devhelp/backend/internal/repository"
	"github.com/google/uuid"
)

type ModerationService struct {
	postRepo    *repository.PostRepository
	commentRepo *repository.CommentRepository
}

func NewModerationService(postRepo *repository.PostRepository, commentRepo *repository.CommentRepository) *ModerationService {
	return &ModerationService{postRepo: postRepo, commentRepo: commentRepo}
}

type ModerationQueue struct {
	Posts    []model.Post    `json:"posts"`
	Comments []model.Comment `json:"comments"`
}

func (s *ModerationService) ListByStatus(status model.ContentStatus, page, pageSize int) (*ModerationQueue, error) {
	posts, _, err := s.postRepo.FindAll(repository.PostFilters{
		Status:      &status,
		AllStatuses: true,
		Page:        page,
		PageSize:    pageSize,
	})
	if err != nil {
		return nil, err
	}
	comments, err := s.commentRepo.FindByStatus(status, page, pageSize)
	if err != nil {
		return nil, err
	}
	return &ModerationQueue{Posts: posts, Comments: comments}, nil
}

func (s *ModerationService) UpdatePostStatus(id uuid.UUID, status model.ContentStatus) error {
	return s.postRepo.UpdateStatus(id, status)
}

func (s *ModerationService) UpdateCommentStatus(id uuid.UUID, status model.ContentStatus) error {
	return s.commentRepo.UpdateStatus(id, status)
}
