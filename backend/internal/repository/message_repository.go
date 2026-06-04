package repository

import (
	"time"

	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// ConvWithPreview enrichit une conversation avec les infos d'aperçu.
type ConvWithPreview struct {
	model.Conversation
	OtherUser   model.User     `json:"other_user"`
	LastMessage *model.Message `json:"last_message"`
	UnreadCount int64          `json:"unread_count"`
}

type MessageRepository struct {
	db *gorm.DB
}

func NewMessageRepository(db *gorm.DB) *MessageRepository {
	return &MessageRepository{db: db}
}

// FindOrCreateConversation trouve ou crée une conversation entre deux utilisateurs.
func (r *MessageRepository) FindOrCreateConversation(userA, userB uuid.UUID) (*model.Conversation, bool, error) {
	var conv model.Conversation

	err := r.db.Raw(`
		SELECT c.* FROM conversations c
		JOIN conversation_participants cp1 ON cp1.conversation_id = c.id AND cp1.user_id = ?
		JOIN conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id = ?
		LIMIT 1
	`, userA, userB).Scan(&conv).Error
	if err != nil {
		return nil, false, err
	}

	if conv.ID != uuid.Nil {
		if err := r.db.Preload("Participants").First(&conv, "id = ?", conv.ID).Error; err != nil {
			return nil, false, err
		}
		return &conv, false, nil
	}

	conv = model.Conversation{
		Status:          "request",
		RequestSenderID: &userA,
	}
	if err := r.db.Create(&conv).Error; err != nil {
		return nil, false, err
	}

	if err := r.db.Exec(
		`INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?), (?, ?)`,
		conv.ID, userA, conv.ID, userB,
	).Error; err != nil {
		return nil, false, err
	}

	if err := r.db.Preload("Participants").First(&conv, "id = ?", conv.ID).Error; err != nil {
		return nil, false, err
	}

	return &conv, true, nil
}

// FindConversationByID retourne une conversation par son ID.
func (r *MessageRepository) FindConversationByID(convID uuid.UUID) (*model.Conversation, error) {
	var conv model.Conversation
	err := r.db.First(&conv, "id = ?", convID).Error
	if err != nil {
		return nil, err
	}
	return &conv, nil
}

// FindConversationsByUser retourne toutes les conversations d'un utilisateur avec aperçu.
func (r *MessageRepository) FindConversationsByUser(userID uuid.UUID) ([]ConvWithPreview, error) {
	var convIDs []uuid.UUID
	if err := r.db.Raw(
		`SELECT conversation_id FROM conversation_participants WHERE user_id = ?`, userID,
	).Scan(&convIDs).Error; err != nil {
		return nil, err
	}
	if len(convIDs) == 0 {
		return []ConvWithPreview{}, nil
	}

	var convs []model.Conversation
	if err := r.db.Preload("Participants").
		Where("id IN ?", convIDs).
		Order("created_at DESC").
		Find(&convs).Error; err != nil {
		return nil, err
	}

	result := make([]ConvWithPreview, 0, len(convs))
	for _, conv := range convs {
		preview := ConvWithPreview{Conversation: conv}

		for _, p := range conv.Participants {
			if p.ID != userID {
				preview.OtherUser = p
				break
			}
		}

		var lastMsg model.Message
		if err := r.db.Preload("Sender").
			Where("conversation_id = ? AND is_deleted = false", conv.ID).
			Order("created_at DESC").
			First(&lastMsg).Error; err == nil {
			preview.LastMessage = &lastMsg
		}

		// Compte les messages non lus (status != 'read' et envoyés par l'autre)
		r.db.Model(&model.Message{}).
			Where("conversation_id = ? AND sender_id != ? AND status != 'read' AND is_deleted = false", conv.ID, userID).
			Count(&preview.UnreadCount)

		result = append(result, preview)
	}

	return result, nil
}

// FindMessages retourne les messages d'une conversation en ordre chronologique (ASC).
// Si before != nil, retourne les messages antérieurs à ce timestamp.
// Retourne (messages, hasMore, error).
func (r *MessageRepository) FindMessages(convID uuid.UUID, before *time.Time, limit int) ([]model.Message, bool, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}

	query := r.db.Preload("Sender").
		Preload("Reads").
		Preload("SharedPost.Author").
		Where("conversation_id = ? AND is_deleted = false", convID)

	if before != nil {
		query = query.Where("created_at < ?", before)
	}

	// Fetch limit+1 pour détecter s'il y a plus de messages
	var messages []model.Message
	err := query.
		Order("created_at DESC").
		Limit(limit + 1).
		Find(&messages).Error
	if err != nil {
		return nil, false, err
	}

	hasMore := len(messages) > limit
	if hasMore {
		messages = messages[:limit]
	}

	// Inverser pour obtenir l'ordre ASC (plus anciens en premier)
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	return messages, hasMore, nil
}

// CreateMessage insère un nouveau message.
func (r *MessageRepository) CreateMessage(msg *model.Message) error {
	return r.db.Create(msg).Error
}

// UpdateMessageStatus met à jour le statut d'un message.
func (r *MessageRepository) UpdateMessageStatus(msgID uuid.UUID, status string) error {
	return r.db.Model(&model.Message{}).
		Where("id = ?", msgID).
		Update("status", status).Error
}

// MarkRead crée des entrées MessageRead et met le status à 'read'.
// Retourne les IDs des messages marqués comme lus.
func (r *MessageRepository) MarkRead(convID, userID uuid.UUID) ([]uuid.UUID, error) {
	// Trouver les messages de la conv envoyés par l'autre participant
	var msgIDs []uuid.UUID
	if err := r.db.Model(&model.Message{}).
		Where("conversation_id = ? AND sender_id != ? AND is_deleted = false", convID, userID).
		Pluck("id", &msgIDs).Error; err != nil {
		return nil, err
	}
	if len(msgIDs) == 0 {
		return nil, nil
	}

	// Insérer les records de lecture (ignorer les doublons)
	now := time.Now().UTC()
	reads := make([]model.MessageRead, 0, len(msgIDs))
	for _, id := range msgIDs {
		reads = append(reads, model.MessageRead{
			MessageID: id,
			UserID:    userID,
			ReadAt:    now,
		})
	}
	if err := r.db.Clauses(clause.OnConflict{DoNothing: true}).Create(&reads).Error; err != nil {
		return nil, err
	}

	// Mettre à jour le status des messages
	r.db.Model(&model.Message{}).
		Where("id IN ? AND status != 'read'", msgIDs).
		Update("status", "read")

	return msgIDs, nil
}

// GetParticipants retourne les IDs de tous les participants d'une conversation.
func (r *MessageRepository) GetParticipants(convID uuid.UUID) []uuid.UUID {
	var ids []uuid.UUID
	r.db.Raw(
		`SELECT user_id FROM conversation_participants WHERE conversation_id = ?`, convID,
	).Scan(&ids)
	return ids
}

// GetSenderIDs retourne les IDs des expéditeurs des messages d'une conv (excluant userID).
func (r *MessageRepository) GetSenderIDs(convID, excludeUserID uuid.UUID) []uuid.UUID {
	var ids []uuid.UUID
	r.db.Raw(`
		SELECT DISTINCT sender_id FROM messages
		WHERE conversation_id = ? AND sender_id != ?
	`, convID, excludeUserID).Scan(&ids)
	return ids
}

// AcceptConversation passe le statut de la conversation à "active".
func (r *MessageRepository) AcceptConversation(convID uuid.UUID) error {
	return r.db.Model(&model.Conversation{}).
		Where("id = ?", convID).
		Update("status", "active").Error
}

// IsParticipant vérifie si un utilisateur est participant d'une conversation.
func (r *MessageRepository) IsParticipant(convID, userID uuid.UUID) bool {
	var count int64
	r.db.Raw(
		`SELECT COUNT(*) FROM conversation_participants WHERE conversation_id = ? AND user_id = ?`,
		convID, userID,
	).Scan(&count)
	return count > 0
}

// CountUnreadConversations retourne le nombre de conversations avec des messages non lus.
func (r *MessageRepository) CountUnreadConversations(userID uuid.UUID) int64 {
	var count int64
	r.db.Raw(`
		SELECT COUNT(DISTINCT m.conversation_id)
		FROM messages m
		JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id AND cp.user_id = ?
		WHERE m.sender_id != ? AND m.status != 'read' AND m.is_deleted = false
	`, userID, userID).Scan(&count)
	return count
}

// ─── Présence ─────────────────────────────────────────────────────────────────

// UpsertPresence met à jour la présence d'un utilisateur.
func (r *MessageRepository) UpsertPresence(userID uuid.UUID, activeConvID *uuid.UUID) error {
	now := time.Now().UTC()
	presence := model.UserPresence{
		UserID:       userID,
		LastSeen:     now,
		ActiveConvID: activeConvID,
	}
	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"last_seen", "active_conv_id"}),
	}).Create(&presence).Error
}

// GetPresence retourne la présence d'un utilisateur.
func (r *MessageRepository) GetPresence(userID uuid.UUID) *model.UserPresence {
	var p model.UserPresence
	if err := r.db.First(&p, "user_id = ?", userID).Error; err != nil {
		return nil
	}
	return &p
}
