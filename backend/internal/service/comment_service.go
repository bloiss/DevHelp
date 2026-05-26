package service

import (
	"errors"

	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/bloiss/devhelp/backend/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrCommentNotFound   = errors.New("comment not found")
	ErrCommentForbidden  = errors.New("not allowed to delete this comment")
	ErrCommentEmpty      = errors.New("comment content cannot be empty")
)

type CommentService struct {
	repo *repository.CommentRepository
}

func NewCommentService(repo *repository.CommentRepository) *CommentService {
	return &CommentService{repo: repo}
}

func (s *CommentService) ListByPost(postID uuid.UUID) ([]model.Comment, error) {
	return s.repo.FindByPost(postID)
}

func (s *CommentService) Create(postID, userID uuid.UUID, content string) (*model.Comment, error) {
	if content == "" {
		return nil, ErrCommentEmpty
	}
	c := &model.Comment{
		PostID:  postID,
		UserID:  userID,
		Content: content,
	}
	if err := s.repo.Create(c); err != nil {
		return nil, err
	}
	return c, nil
}

func (s *CommentService) Delete(id, requesterID uuid.UUID, requesterRole string) error {
	comment, err := s.repo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrCommentNotFound
		}
		return err
	}

	if requesterRole != "admin" && requesterRole != "moderator" && comment.UserID != requesterID {
		return ErrCommentForbidden
	}

	return s.repo.Delete(id)
}
