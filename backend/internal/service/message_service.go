package service

import (
	"encoding/json"
	"errors"

	"github.com/bloiss/devhelp/backend/internal/hub"
	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/bloiss/devhelp/backend/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrNotParticipant       = errors.New("not a participant of this conversation")
	ErrConversationNotFound = errors.New("conversation not found")
)

type MessageService struct {
	repo       *repository.MessageRepository
	hub        *hub.Hub
	notifSvc   *NotificationService
	userRepo   *repository.UserRepository
	followRepo *repository.FollowRepository
}

func NewMessageService(
	repo *repository.MessageRepository,
	h *hub.Hub,
	notifSvc *NotificationService,
	userRepo *repository.UserRepository,
	followRepo *repository.FollowRepository,
) *MessageService {
	return &MessageService{
		repo:       repo,
		hub:        h,
		notifSvc:   notifSvc,
		userRepo:   userRepo,
		followRepo: followRepo,
	}
}

func (s *MessageService) ListConversations(userID uuid.UUID) ([]repository.ConvWithPreview, error) {
	return s.repo.FindConversationsByUser(userID)
}

func (s *MessageService) GetMessages(convID, userID uuid.UUID, page int) ([]model.Message, error) {
	if !s.repo.IsParticipant(convID, userID) {
		return nil, ErrNotParticipant
	}
	// Marquer comme lus
	_ = s.repo.MarkMessagesRead(convID, userID)
	return s.repo.FindMessages(convID, page, 20)
}

// SendMessage crée un message et envoie un événement WS au destinataire.
func (s *MessageService) SendMessage(convID, senderID uuid.UUID, content string) (*model.Message, error) {
	if !s.repo.IsParticipant(convID, senderID) {
		return nil, ErrNotParticipant
	}

	msg := &model.Message{
		ConversationID: convID,
		SenderID:       senderID,
		Content:        content,
	}
	if err := s.repo.CreateMessage(msg); err != nil {
		return nil, err
	}

	// Charger le sender pour l'inclure dans l'event
	sender, _ := s.userRepo.FindByID(senderID)
	if sender != nil {
		msg.Sender = *sender
	}

	// Trouver le destinataire (l'autre participant)
	previews, err := s.repo.FindConversationsByUser(senderID)
	if err == nil {
		for _, p := range previews {
			if p.Conversation.ID == convID {
				recipientID := p.OtherUser.ID
				payload, _ := json.Marshal(map[string]interface{}{
					"conv_id": convID,
					"message": msg,
				})
				s.hub.Send(recipientID, hub.Event{
					Type:    "new_message",
					Payload: json.RawMessage(payload),
				})
				break
			}
		}
	}

	return msg, nil
}

// OpenConversation trouve ou crée une conversation entre deux utilisateurs.
// Si première fois → Status="request" sauf si follow mutuel → Status="active".
func (s *MessageService) OpenConversation(requesterID, targetID uuid.UUID) (*repository.ConvWithPreview, error) {
	conv, isNew, err := s.repo.FindOrCreateConversation(requesterID, targetID)
	if err != nil {
		return nil, err
	}

	if isNew {
		// Vérifier si follow mutuel
		aFollowsB := s.followRepo.IsFollowing(requesterID, targetID)
		bFollowsA := s.followRepo.IsFollowing(targetID, requesterID)

		if aFollowsB && bFollowsA {
			conv.Status = "active"
			_ = s.repo.AcceptConversation(conv.ID)
		} else {
			// Notifier la cible d'une nouvelle demande de conversation
			requester, _ := s.userRepo.FindByID(requesterID)
			if requester != nil {
				payload, _ := json.Marshal(map[string]interface{}{
					"conv_id": conv.ID,
					"from":    requester,
				})
				s.hub.Send(targetID, hub.Event{
					Type:    "new_conversation_request",
					Payload: json.RawMessage(payload),
				})
				// Notif persistante
				_ = s.notifSvc.create(targetID, "message_request", NotifPayload{
					Actor: requester.Username,
				})
			}
		}
	}

	// Construire le ConvWithPreview
	previews, err := s.repo.FindConversationsByUser(requesterID)
	if err != nil {
		return nil, err
	}
	for i, p := range previews {
		if p.Conversation.ID == conv.ID {
			return &previews[i], nil
		}
	}

	// Fallback si pas trouvé dans la liste
	return &repository.ConvWithPreview{Conversation: *conv}, nil
}

// AcceptRequest accepte une demande de conversation.
func (s *MessageService) AcceptRequest(convID, userID uuid.UUID) error {
	if !s.repo.IsParticipant(convID, userID) {
		return ErrNotParticipant
	}
	return s.repo.AcceptConversation(convID)
}

func (s *MessageService) UnreadCount(userID uuid.UUID) (int64, error) {
	return s.repo.CountUnreadConversations(userID), nil
}
