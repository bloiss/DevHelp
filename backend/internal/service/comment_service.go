package service

import (
	"errors"

	"github.com/bloiss/devhelp/backend/internal/hub"
	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/bloiss/devhelp/backend/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrCommentNotFound  = errors.New("comment not found")
	ErrCommentForbidden = errors.New("not allowed to delete this comment")
	ErrCommentEmpty     = errors.New("comment content cannot be empty")
)

type CommentService struct {
	repo      *repository.CommentRepository
	postRepo  *repository.PostRepository
	notifSvc  *NotificationService
	wsHub     *hub.Hub
	publisher *ModerationPublisher
}

func NewCommentService(
	repo *repository.CommentRepository,
	postRepo *repository.PostRepository,
	notifSvc *NotificationService,
	wsHub *hub.Hub,
	publisher *ModerationPublisher,
) *CommentService {
	return &CommentService{repo: repo, postRepo: postRepo, notifSvc: notifSvc, wsHub: wsHub, publisher: publisher}
}

func (s *CommentService) ListByPost(postID uuid.UUID, requesterID *uuid.UUID) ([]model.Comment, error) {
	return s.repo.FindByPost(postID, requesterID)
}

func (s *CommentService) Create(postID, userID uuid.UUID, content string) (*model.Comment, error) {
	if content == "" {
		return nil, ErrCommentEmpty
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

	if s.publisher != nil {
		_ = s.publisher.Publish(ModerationEvent{
			ContentType: "comment",
			ContentID:   c.ID.String(),
			AuthorID:    userID.String(),
			Body:        content,
			CreatedAt:   c.CreatedAt,
		})
	}

	full, err := s.repo.FindByID(c.ID)
	if err != nil {
		return c, nil
	}

	post, err := s.postRepo.FindByID(postID, nil)
	if err == nil && post.UserID != userID {
		_ = s.notifSvc.CreateCommentNotif(post.UserID, NotifPayload{
			Actor:        full.Author.Username,
			PostID:       postID.String(),
			PostTitle:    post.Title,
			PostCategory: post.Category.Slug,
			CommentID:    c.ID.String(),
		})
		s.wsHub.Send(post.UserID, hub.Event{
			Type:    "notification",
			Payload: []byte(`{}`),
		})
	}

	return full, nil
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
