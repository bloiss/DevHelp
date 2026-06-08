package handler

import (
	"net/http"
	"time"

	"github.com/bloiss/devhelp/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type MessageHandler struct {
	svc *service.MessageService
}

func NewMessageHandler(svc *service.MessageService) *MessageHandler {
	return &MessageHandler{svc: svc}
}

// List godoc
// @Summary      Lister les conversations
// @Description  Retourne toutes les conversations de l'utilisateur connecté, triées par activité récente.
// @Tags         messages
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} map[string]interface{}
// @Failure      401 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /api/v1/conversations [get]
func (h *MessageHandler) List(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	convs, err := h.svc.ListConversations(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list conversations"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": convs})
}

// Open godoc
// @Summary      Ouvrir ou créer une conversation
// @Description  Ouvre une conversation existante ou en crée une nouvelle avec un autre utilisateur. Retourne la conversation.
// @Tags         messages
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body object true "user_id: UUID de l'interlocuteur"
// @Success      200 {object} map[string]interface{}
// @Failure      400 {object} map[string]string
// @Failure      401 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /api/v1/conversations [post]
func (h *MessageHandler) Open(c *gin.Context) {
	var req struct {
		UserID uuid.UUID `json:"user_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	requesterID := c.MustGet("user_id").(uuid.UUID)
	conv, err := h.svc.OpenConversation(requesterID, req.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to open conversation"})
		return
	}
	c.JSON(http.StatusOK, conv)
}

// GetMessages godoc
// @Summary      Lister les messages d'une conversation
// @Description  Retourne les messages d'une conversation avec pagination par curseur (before timestamp). L'utilisateur doit être participant.
// @Tags         messages
// @Produce      json
// @Security     BearerAuth
// @Param        id     path  string true  "UUID conversation"
// @Param        before query string false "Curseur de pagination (RFC3339 timestamp)"
// @Success      200 {object} map[string]interface{}
// @Failure      400 {object} map[string]string
// @Failure      401 {object} map[string]string
// @Failure      403 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /api/v1/conversations/{id}/messages [get]
func (h *MessageHandler) GetMessages(c *gin.Context) {
	convIDStr := c.Param("id")
	convID, err := uuid.Parse(convIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid conversation id"})
		return
	}

	userID := c.MustGet("user_id").(uuid.UUID)

	var before *time.Time
	if b := c.Query("before"); b != "" {
		t, err := time.Parse(time.RFC3339, b)
		if err == nil {
			before = &t
		}
	}

	messages, hasMore, err := h.svc.GetMessages(convID, userID, before)
	if err != nil {
		switch err {
		case service.ErrNotParticipant:
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get messages"})
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": messages, "has_more": hasMore})
}

// Send godoc
// @Summary      Envoyer un message
// @Description  Envoie un message dans une conversation. Le message peut contenir du texte, une pièce jointe, ou un post partagé.
// @Tags         messages
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path  string true "UUID conversation"
// @Param        body body  object true "Contenu du message (content, attachment_url, attachment_type, shared_post_id)"
// @Success      201 {object} map[string]interface{}
// @Failure      400 {object} map[string]string
// @Failure      401 {object} map[string]string
// @Failure      403 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /api/v1/conversations/{id}/messages [post]
func (h *MessageHandler) Send(c *gin.Context) {
	convIDStr := c.Param("id")
	convID, err := uuid.Parse(convIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid conversation id"})
		return
	}

	var req struct {
		Content        string     `json:"content"`
		AttachmentURL  *string    `json:"attachment_url"`
		AttachmentType *string    `json:"attachment_type"`
		SharedPostID   *uuid.UUID `json:"shared_post_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.Content == "" && req.AttachmentURL == nil && req.SharedPostID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "message must have content, attachment or shared post"})
		return
	}

	senderID := c.MustGet("user_id").(uuid.UUID)
	msg, err := h.svc.SendMessage(convID, senderID, req.Content, req.AttachmentURL, req.AttachmentType, req.SharedPostID)
	if err != nil {
		switch err {
		case service.ErrNotParticipant:
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to send message"})
		}
		return
	}
	c.JSON(http.StatusCreated, msg)
}

// Accept godoc
// @Summary      Accepter une demande de conversation
// @Description  Accepte une demande de conversation en attente, permettant l'échange de messages.
// @Tags         messages
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "UUID conversation"
// @Success      200 {object} map[string]string
// @Failure      400 {object} map[string]string
// @Failure      401 {object} map[string]string
// @Failure      403 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /api/v1/conversations/{id}/accept [post]
func (h *MessageHandler) Accept(c *gin.Context) {
	convIDStr := c.Param("id")
	convID, err := uuid.Parse(convIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid conversation id"})
		return
	}

	userID := c.MustGet("user_id").(uuid.UUID)
	if err := h.svc.AcceptRequest(convID, userID); err != nil {
		switch err {
		case service.ErrNotParticipant:
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to accept conversation"})
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "conversation accepted"})
}

// MarkRead godoc
// @Summary      Marquer une conversation comme lue
// @Description  Met à jour le curseur de lecture de l'utilisateur dans la conversation pour effacer le badge de messages non lus.
// @Tags         messages
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "UUID conversation"
// @Success      200 {object} map[string]bool
// @Failure      400 {object} map[string]string
// @Failure      401 {object} map[string]string
// @Router       /api/v1/conversations/{id}/read [post]
func (h *MessageHandler) MarkRead(c *gin.Context) {
	convIDStr := c.Param("id")
	convID, err := uuid.Parse(convIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid conversation id"})
		return
	}

	userID := c.MustGet("user_id").(uuid.UUID)
	h.svc.MarkRead(userID, convID)
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// GetPresence godoc
// @Summary      Présence des participants d'une conversation
// @Description  Retourne le statut de présence en ligne des autres participants de la conversation.
// @Tags         messages
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "UUID conversation"
// @Success      200 {object} map[string]interface{}
// @Failure      400 {object} map[string]string
// @Failure      401 {object} map[string]string
// @Failure      403 {object} map[string]string
// @Router       /api/v1/conversations/{id}/presence [get]
func (h *MessageHandler) GetPresence(c *gin.Context) {
	convIDStr := c.Param("id")
	convID, err := uuid.Parse(convIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid conversation id"})
		return
	}

	userID := c.MustGet("user_id").(uuid.UUID)
	if !h.svc.IsParticipant(convID, userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "not a participant"})
		return
	}

	// Retourner la présence des autres participants
	presences := h.svc.GetConvPresences(convID, userID)
	c.JSON(http.StatusOK, gin.H{"data": presences})
}

// UnreadCount godoc
// @Summary      Nombre de conversations avec messages non lus
// @Description  Retourne le nombre total de conversations contenant des messages non lus pour l'utilisateur connecté.
// @Tags         messages
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} map[string]int
// @Failure      401 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /api/v1/conversations/unread-count [get]
func (h *MessageHandler) UnreadCount(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	count, err := h.svc.UnreadCount(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get unread count"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"count": count})
}
