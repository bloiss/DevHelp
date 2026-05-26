package service

import (
	"errors"

	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/bloiss/devhelp/backend/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrCommentNotFound  = errors.New("comment not found")
	ErrCommentForbidden = errors.New("forbidden")
)

type CommentService struct {
	repo     *repository.CommentRepository
	postRepo *repository.PostRepository
}

func NewCommentService(repo *repository.CommentRepository, postRepo *repository.PostRepository) *CommentService {
	return &CommentService{repo: repo, postRepo: postRepo}
}

func (s *CommentService) ListByPost(postID uuid.UUID) ([]model.Comment, error) {
	if _, err := s.postRepo.FindByID(postID); err != nil {
		return nil, ErrPostNotFound
	}
	return s.repo.FindByPost(postID)
}

func (s *CommentService) Create(postID, userID uuid.UUID, content string) (*model.Comment, error) {
	if _, err := s.postRepo.FindByID(postID); err != nil {
		return nil, ErrPostNotFound
	}

	c := &model.Comment{
		PostID:  postID,
		UserID:  userID,
		Content: content,
		Status:  model.StatusPendingModeration,
	}
	if err := s.repo.Create(c); err != nil {
		return nil, err
	}
	return s.repo.FindByID(c.ID)
}

func (s *CommentService) Delete(id, requesterID uuid.UUID, requesterRole string) error {
	c, err := s.repo.FindByID(id)
	if err != nil {
		return ErrCommentNotFound
	}
	if c.UserID != requesterID && requesterRole != "admin" && requesterRole != "moderator" {
		return ErrCommentForbidden
	}
	return s.repo.Delete(id)
}
