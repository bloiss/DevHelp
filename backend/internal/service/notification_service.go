package service

import (
	"encoding/json"
	"time"

	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/bloiss/devhelp/backend/internal/repository"
	"github.com/google/uuid"
)

type NotificationService struct {
	repo *repository.NotificationRepository
}

func NewNotificationService(repo *repository.NotificationRepository) *NotificationService {
	return &NotificationService{repo: repo}
}

type NotifPayload struct {
	Actor        string `json:"actor"`
	PostID       string `json:"post_id,omitempty"`
	PostTitle    string `json:"post_title,omitempty"`
	PostCategory string `json:"post_category,omitempty"`
	CommentID    string `json:"comment_id,omitempty"`
}

type NotifResponse struct {
	ID        uuid.UUID    `json:"id"`
	Type      string       `json:"type"`
	Payload   NotifPayload `json:"payload"`
	Read      bool         `json:"read"`
	CreatedAt time.Time    `json:"created_at"`
}

func (s *NotificationService) create(userID uuid.UUID, notifType string, payload NotifPayload) error {
	data, _ := json.Marshal(payload)
	n := &model.Notification{
		UserID:  userID,
		Type:    notifType,
		Payload: string(data),
	}
	return s.repo.Create(n)
}

func (s *NotificationService) CreateCommentNotif(recipientID uuid.UUID, payload NotifPayload) error {
	return s.create(recipientID, "comment", payload)
}

func (s *NotificationService) CreateLikeNotif(recipientID uuid.UUID, payload NotifPayload) error {
	return s.create(recipientID, "like", payload)
}

func (s *NotificationService) List(userID uuid.UUID) ([]NotifResponse, error) {
	notifs, err := s.repo.FindByUser(userID)
	if err != nil {
		return nil, err
	}
	result := make([]NotifResponse, 0, len(notifs))
	for _, n := range notifs {
		var p NotifPayload
		_ = json.Unmarshal([]byte(n.Payload), &p)
		result = append(result, NotifResponse{
			ID:        n.ID,
			Type:      n.Type,
			Payload:   p,
			Read:      n.Read,
			CreatedAt: n.CreatedAt,
		})
	}
	return result, nil
}

func (s *NotificationService) UnreadCount(userID uuid.UUID) (int64, error) {
	return s.repo.UnreadCount(userID)
}

func (s *NotificationService) MarkRead(id uuid.UUID) error {
	return s.repo.MarkRead(id)
}

func (s *NotificationService) MarkAllRead(userID uuid.UUID) error {
	return s.repo.MarkAllRead(userID)
}
