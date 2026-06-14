package service

import (
	"encoding/json"
	"time"

	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/bloiss/devhelp/backend/internal/repository"
	"github.com/google/uuid"
)

type NotificationService struct {
	repo    *repository.NotificationRepository
	pushSvc *PushService
}

func NewNotificationService(repo *repository.NotificationRepository) *NotificationService {
	return &NotificationService{repo: repo}
}

func (s *NotificationService) SetPushService(pushSvc *PushService) {
	s.pushSvc = pushSvc
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
	// Vérifier les prefs avant de créer
	if s.pushSvc != nil {
		prefs := s.pushSvc.GetPrefs(userID)
		if notifType == "comment" && !prefs.NotifyOnComment {
			return nil
		}
		if notifType == "like" && !prefs.NotifyOnLike {
			return nil
		}
		if (notifType == "message_request" || notifType == "message_accepted") && !prefs.NotifyOnMessage {
			return nil
		}
	}

	data, _ := json.Marshal(payload)
	n := &model.Notification{
		UserID:  userID,
		Type:    notifType,
		Payload: string(data),
	}
	if err := s.repo.Create(n); err != nil {
		return err
	}

	// Envoyer push si activé
	if s.pushSvc != nil {
		prefs := s.pushSvc.GetPrefs(userID)
		if prefs.PushEnabled {
			go s.pushSvc.SendToUser(userID, pushTitle(notifType, payload), pushBody(payload), pushURL(notifType, payload))
		}
	}
	return nil
}

func pushTitle(notifType string, p NotifPayload) string {
	switch notifType {
	case "comment":
		return p.Actor + " a commenté ton post"
	case "like":
		return p.Actor + " a aimé ton post"
	case "follow":
		return p.Actor + " te suit maintenant"
	case "message_request":
		return p.Actor + " t'a envoyé une demande de message"
	case "message_accepted":
		return p.Actor + " a accepté ta demande de message"
	}
	return "Nouvelle notification"
}

func pushBody(p NotifPayload) string {
	if p.PostTitle != "" {
		return "\"" + p.PostTitle + "\""
	}
	return ""
}

func pushURL(notifType string, p NotifPayload) string {
	if p.ConvID != "" {
		return "/messages?conv=" + p.ConvID
	}
	if p.PostCategory != "" && p.PostID != "" {
		return "/forum/" + p.PostCategory + "/" + p.PostID
	}
	if notifType == "follow" && p.Actor != "" {
		return "/profile/" + p.Actor
	}
	return "/"
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

func (s *NotificationService) DeleteAll(userID uuid.UUID) error {
	return s.repo.SoftDeleteAll(userID)
}
