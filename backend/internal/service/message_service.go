package service

import (
	"encoding/json"
	"errors"
	"time"

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

// GetMessages retourne les messages d'une conversation avec pagination par curseur.
// before : timestamp ISO 8601 optionnel pour charger les messages antérieurs.
func (s *MessageService) GetMessages(convID, userID uuid.UUID, before *time.Time) ([]model.Message, bool, error) {
	if !s.repo.IsParticipant(convID, userID) {
		return nil, false, ErrNotParticipant
	}
	return s.repo.FindMessages(convID, before, 20)
}

// SendMessage crée un message et le diffuse via WebSocket.
func (s *MessageService) SendMessage(convID, senderID uuid.UUID, content string, attachmentURL, attachmentType *string, sharedPostID *uuid.UUID) (*model.Message, error) {
	if !s.repo.IsParticipant(convID, senderID) {
		return nil, ErrNotParticipant
	}

	msg := &model.Message{
		ConversationID: convID,
		SenderID:       senderID,
		Content:        content,
		Status:         "sent",
		AttachmentURL:  attachmentURL,
		AttachmentType: attachmentType,
		SharedPostID:   sharedPostID,
	}
	if err := s.repo.CreateMessage(msg); err != nil {
		return nil, err
	}

	// Charger le message complet avec toutes les relations (SharedPost, Sender, etc.)
	if fullMsg, err := s.repo.GetMessageByID(msg.ID); err == nil {
		msg = fullMsg
	} else {
		// Fallback : charger au moins le sender
		sender, _ := s.userRepo.FindByID(senderID)
		if sender != nil {
			msg.Sender = *sender
		}
	}

	// Trouver les destinataires (autres participants)
	participants := s.repo.GetParticipants(convID)
	for _, pid := range participants {
		if pid == senderID {
			continue
		}
		// Si le destinataire est en ligne → mark delivered
		if s.hub.IsOnline(pid) {
			msg.Status = "delivered"
			_ = s.repo.UpdateMessageStatus(msg.ID, "delivered")
		}

		// Envoyer l'événement WS
		payload, _ := json.Marshal(map[string]interface{}{
			"conv_id": convID.String(),
			"message": msg,
		})
		s.hub.Send(pid, hub.Event{
			Type:    "new_message",
			Payload: json.RawMessage(payload),
		})
	}

	return msg, nil
}

// MarkRead marque les messages d'une conversation comme lus par userID
// et envoie des read_receipts aux expéditeurs via WS.
func (s *MessageService) MarkRead(userID, convID uuid.UUID) {
	msgIDs, err := s.repo.MarkRead(convID, userID)
	if err != nil || len(msgIDs) == 0 {
		return
	}

	// Envoyer read_receipt aux expéditeurs
	senderIDs := s.repo.GetSenderIDs(convID, userID)
	if len(senderIDs) == 0 {
		return
	}

	idStrings := make([]string, len(msgIDs))
	for i, id := range msgIDs {
		idStrings[i] = id.String()
	}

	receiptPayload, _ := json.Marshal(map[string]interface{}{
		"conv_id":     convID.String(),
		"reader_id":   userID.String(),
		"message_ids": idStrings,
		"read_at":     time.Now().UTC().Format(time.RFC3339),
	})
	receiptEvent := hub.Event{
		Type:    "read_receipt",
		Payload: json.RawMessage(receiptPayload),
	}

	for _, sid := range senderIDs {
		s.hub.Send(sid, receiptEvent)
	}
}

// RelayTyping envoie un événement "typing" aux autres participants d'une conversation.
func (s *MessageService) RelayTyping(senderID, convID uuid.UUID, isTyping bool) {
	sender, _ := s.userRepo.FindByID(senderID)
	username := ""
	if sender != nil {
		username = sender.Username
	}

	payload, _ := json.Marshal(map[string]interface{}{
		"conv_id":   convID.String(),
		"user_id":   senderID.String(),
		"username":  username,
		"is_typing": isTyping,
	})
	event := hub.Event{
		Type:    "typing",
		Payload: json.RawMessage(payload),
	}

	participants := s.repo.GetParticipants(convID)
	for _, pid := range participants {
		if pid != senderID {
			s.hub.Send(pid, event)
		}
	}
}

// UpdatePresence met à jour la présence d'un utilisateur et notifie les participants.
func (s *MessageService) UpdatePresence(userID uuid.UUID, convID *uuid.UUID) {
	_ = s.repo.UpsertPresence(userID, convID)

	if convID == nil {
		return
	}

	// Notifier les autres participants de la présence
	presencePayload, _ := json.Marshal(map[string]interface{}{
		"user_id":   userID.String(),
		"is_online": s.hub.IsOnline(userID),
		"conv_id":   convID.String(),
	})
	presenceEvent := hub.Event{
		Type:    "presence",
		Payload: json.RawMessage(presencePayload),
	}

	participants := s.repo.GetParticipants(*convID)
	for _, pid := range participants {
		if pid != userID {
			s.hub.Send(pid, presenceEvent)
		}
	}
}

// GetPresence retourne la présence d'un utilisateur (connecté + last_seen).
func (s *MessageService) GetPresence(targetID uuid.UUID) map[string]interface{} {
	isOnline := s.hub.IsOnline(targetID)
	result := map[string]interface{}{
		"user_id":   targetID.String(),
		"is_online": isOnline,
	}
	if p := s.repo.GetPresence(targetID); p != nil {
		result["last_seen"] = p.LastSeen.UTC().Format(time.RFC3339)
	}
	return result
}

// OpenConversation trouve ou crée une conversation entre deux utilisateurs.
func (s *MessageService) OpenConversation(requesterID, targetID uuid.UUID) (*repository.ConvWithPreview, error) {
	conv, isNew, err := s.repo.FindOrCreateConversation(requesterID, targetID)
	if err != nil {
		return nil, err
	}

	if isNew {
		aFollowsB := s.followRepo.IsFollowing(requesterID, targetID)
		bFollowsA := s.followRepo.IsFollowing(targetID, requesterID)

		if aFollowsB && bFollowsA {
			conv.Status = "active"
			_ = s.repo.AcceptConversation(conv.ID)
		} else {
			requester, _ := s.userRepo.FindByID(requesterID)
			if requester != nil {
				wsPayload, _ := json.Marshal(map[string]interface{}{
					"conv_id": conv.ID,
					"from":    requester,
				})
				s.hub.Send(targetID, hub.Event{
					Type:    "new_conversation_request",
					Payload: json.RawMessage(wsPayload),
				})
				_ = s.notifSvc.create(targetID, "message_request", NotifPayload{
					Actor:  requester.Username,
					ConvID: conv.ID.String(),
				})
				// Déclencher notification WS
				s.hub.Send(targetID, hub.Event{
					Type:    "notification",
					Payload: json.RawMessage(`{}`),
				})
			}
		}
	}

	previews, err := s.repo.FindConversationsByUser(requesterID)
	if err != nil {
		return nil, err
	}
	for i, p := range previews {
		if p.Conversation.ID == conv.ID {
			return &previews[i], nil
		}
	}

	return &repository.ConvWithPreview{Conversation: *conv}, nil
}

// AcceptRequest accepte une demande de conversation et notifie le demandeur.
func (s *MessageService) AcceptRequest(convID, userID uuid.UUID) error {
	if !s.repo.IsParticipant(convID, userID) {
		return ErrNotParticipant
	}
	if err := s.repo.AcceptConversation(convID); err != nil {
		return err
	}

	// Notifier le demandeur original
	conv, err := s.repo.FindConversationByID(convID)
	if err == nil && conv.RequestSenderID != nil {
		accepter, _ := s.userRepo.FindByID(userID)
		if accepter != nil {
			_ = s.notifSvc.create(*conv.RequestSenderID, "message_accepted", NotifPayload{
				Actor:  accepter.Username,
				ConvID: convID.String(),
			})
			s.hub.Send(*conv.RequestSenderID, hub.Event{
				Type:    "notification",
				Payload: json.RawMessage(`{}`),
			})
		}
	}

	return nil
}

func (s *MessageService) UnreadCount(userID uuid.UUID) (int64, error) {
	return s.repo.CountUnreadConversations(userID), nil
}

func (s *MessageService) IsParticipant(convID, userID uuid.UUID) bool {
	return s.repo.IsParticipant(convID, userID)
}

// GetConvPresences retourne la présence des autres participants d'une conversation.
func (s *MessageService) GetConvPresences(convID, callerID uuid.UUID) []map[string]interface{} {
	participants := s.repo.GetParticipants(convID)
	result := make([]map[string]interface{}, 0, len(participants))
	for _, pid := range participants {
		if pid == callerID {
			continue
		}
		result = append(result, s.GetPresence(pid))
	}
	return result
}
