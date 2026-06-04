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
	ConvID       string `json:"conv_id,omitempty"`
}

type NotifResponse struct {
	ID         uuid.UUID    `json:"id"`
	Type       string       `json:"type"`
	Payload    NotifPayload `json:"payload"`
	Read       bool         `json:"read"`
	IsStarred  bool         `json:"is_starred"`
	IsArchived bool         `json:"is_archived"`
	CreatedAt  time.Time    `json:"created_at"`
}

func (s *NotificationService) mapNotif(n model.Notification) NotifResponse {
	var p NotifPayload
	_ = json.Unmarshal([]byte(n.Payload), &p)
	return NotifResponse{
		ID:         n.ID,
		Type:       n.Type,
		Payload:    p,
		Read:       n.Read,
		IsStarred:  n.IsStarred,
		IsArchived: n.IsArchived,
		CreatedAt:  n.CreatedAt,
	}
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

func (s *NotificationService) CreateFollowNotif(recipientID uuid.UUID, payload NotifPayload) error {
	return s.create(recipientID, "follow", payload)
}

func (s *NotificationService) CreateMessageAcceptedNotif(recipientID uuid.UUID, payload NotifPayload) error {
	return s.create(recipientID, "message_accepted", payload)
}

func (s *NotificationService) List(userID uuid.UUID) ([]NotifResponse, error) {
	notifs, err := s.repo.FindByUser(userID)
	if err != nil {
		return nil, err
	}
	result := make([]NotifResponse, 0, len(notifs))
	for _, n := range notifs {
		result = append(result, s.mapNotif(n))
	}
	return result, nil
}

func (s *NotificationService) ListInbox(userID uuid.UUID) ([]NotifResponse, error) {
	notifs, err := s.repo.FindInbox(userID)
	if err != nil {
		return nil, err
	}
	result := make([]NotifResponse, 0, len(notifs))
	for _, n := range notifs {
		result = append(result, s.mapNotif(n))
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

func (s *NotificationService) MarkUnread(id uuid.UUID) error {
	return s.repo.MarkUnread(id)
}

func (s *NotificationService) SetStar(id, userID uuid.UUID, starred bool) error {
	return s.repo.SetStar(id, userID, starred)
}

func (s *NotificationService) SetArchive(id, userID uuid.UUID, archived bool) error {
	return s.repo.SetArchive(id, userID, archived)
}

func (s *NotificationService) Delete(id, userID uuid.UUID) error {
	return s.repo.SoftDelete(id, userID)
}
