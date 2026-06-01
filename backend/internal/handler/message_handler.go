package handler

import (
	"net/http"
	"strconv"

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

// GET /conversations/:id/messages
func (h *MessageHandler) GetMessages(c *gin.Context) {
	convIDStr := c.Param("id")
	convID, err := uuid.Parse(convIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid conversation id"})
		return
	}

	userID := c.MustGet("user_id").(uuid.UUID)

	page := 1
	if p := c.Query("page"); p != "" {
		if n, err := strconv.Atoi(p); err == nil && n > 0 {
			page = n
		}
	}

	messages, err := h.svc.GetMessages(convID, userID, page)
	if err != nil {
		switch err {
		case service.ErrNotParticipant:
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get messages"})
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": messages})
}

// POST /conversations/:id/messages
// Body: { "content": "..." }
func (h *MessageHandler) Send(c *gin.Context) {
	convIDStr := c.Param("id")
	convID, err := uuid.Parse(convIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid conversation id"})
		return
	}

	var req struct {
		Content string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	senderID := c.MustGet("user_id").(uuid.UUID)
	msg, err := h.svc.SendMessage(convID, senderID, req.Content)
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
