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

// GET /conversations
func (h *MessageHandler) List(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	convs, err := h.svc.ListConversations(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list conversations"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": convs})
}

// POST /conversations
// Body: { "user_id": "uuid" }
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

// GET /conversations/:id/messages?before=<ISO timestamp>&limit=20
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

// POST /conversations/:id/messages
// Body: { "content": "...", "attachment_url": "...", "attachment_type": "...", "shared_post_id": "uuid" }
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

// POST /conversations/:id/accept
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

// POST /conversations/:id/read
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

// GET /conversations/:id/presence
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

// GET /conversations/unread-count
func (h *MessageHandler) UnreadCount(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	count, err := h.svc.UnreadCount(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get unread count"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"count": count})
}
