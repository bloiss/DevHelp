package repository

import (
	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
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
// Retourne (conv, isNew, error). Si nouvelle : Status="request".
func (r *MessageRepository) FindOrCreateConversation(userA, userB uuid.UUID) (*model.Conversation, bool, error) {
	var conv model.Conversation

	// Cherche une conversation existante entre les deux utilisateurs.
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
		// Charger les participants
		if err := r.db.Preload("Participants").First(&conv, "id = ?", conv.ID).Error; err != nil {
			return nil, false, err
		}
		return &conv, false, nil
	}

	// Créer une nouvelle conversation
	conv = model.Conversation{
		Status:          "request",
		RequestSenderID: &userA,
	}
	if err := r.db.Create(&conv).Error; err != nil {
		return nil, false, err
	}

	// Ajouter les participants
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

		// Autre participant
		for _, p := range conv.Participants {
			if p.ID != userID {
				preview.OtherUser = p
				break
			}
		}

		// Dernier message
		var lastMsg model.Message
		if err := r.db.
			Where("conversation_id = ?", conv.ID).
			Order("created_at DESC").
			First(&lastMsg).Error; err == nil {
			preview.LastMessage = &lastMsg
		}

		// Nombre de messages non lus
		r.db.Model(&model.Message{}).
			Where("conversation_id = ? AND sender_id != ? AND read = false", conv.ID, userID).
			Count(&preview.UnreadCount)

		result = append(result, preview)
	}

	return result, nil
}

// FindMessages retourne les messages d'une conversation paginés (plus récents en premier).
func (r *MessageRepository) FindMessages(convID uuid.UUID, page, perPage int) ([]model.Message, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}
	offset := (page - 1) * perPage

	var messages []model.Message
	err := r.db.
		Preload("Sender").
		Where("conversation_id = ?", convID).
		Order("created_at DESC").
		Limit(perPage).
		Offset(offset).
		Find(&messages).Error
	return messages, err
}

// CreateMessage insère un nouveau message.
func (r *MessageRepository) CreateMessage(msg *model.Message) error {
	return r.db.Create(msg).Error
}

// MarkMessagesRead marque comme lus les messages non envoyés par userID.
func (r *MessageRepository) MarkMessagesRead(convID, userID uuid.UUID) error {
	return r.db.Model(&model.Message{}).
		Where("conversation_id = ? AND sender_id != ? AND read = false", convID, userID).
		Update("read", true).Error
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
		WHERE m.sender_id != ? AND m.read = false
	`, userID, userID).Scan(&count)
	return count
}
