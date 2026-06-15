package handler

import (
	"net/http"

	"github.com/bloiss/devhelp/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ModerationHandler struct {
	svc *service.ModerationService
}

func NewModerationHandler(svc *service.ModerationService) *ModerationHandler {
	return &ModerationHandler{svc: svc}
}

func (h *ModerationHandler) ListQueue(c *gin.Context) {
	status := c.DefaultQuery("status", "")
	contentType := c.DefaultQuery("type", "")
	page := queryInt(c, "page", 1)
	perPage := queryInt(c, "per_page", 20)

	result, err := h.svc.List(status, contentType, page, perPage)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch moderation queue"})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ModerationHandler) GetStats(c *gin.Context) {
	stats, err := h.svc.GetStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch stats"})
		return
	}
	c.JSON(http.StatusOK, stats)
}

type reviewRequest struct {
	Status string `json:"status" binding:"required"`
}

func (h *ModerationHandler) ReviewPost(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var req reviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	adminID := c.MustGet("user_id").(uuid.UUID)
	if err := h.svc.Review(id, "post", req.Status, adminID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update post"})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *ModerationHandler) ReviewComment(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var req reviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	adminID := c.MustGet("user_id").(uuid.UUID)
	if err := h.svc.Review(id, "comment", req.Status, adminID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update comment"})
		return
	}
	c.Status(http.StatusNoContent)
}
