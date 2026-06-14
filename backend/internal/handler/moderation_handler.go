package handler

import (
	"net/http"

	"github.com/bloiss/devhelp/backend/internal/model"
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
	status := model.ContentStatus(c.DefaultQuery("status", string(model.StatusPendingModeration)))
	page := queryInt(c, "page", 1)
	pageSize := queryInt(c, "per_page", 20)

	queue, err := h.svc.ListByStatus(status, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch moderation queue"})
		return
	}
	c.JSON(http.StatusOK, queue)
}

type moderationStatusRequest struct {
	Status model.ContentStatus `json:"status" binding:"required"`
}

func (h *ModerationHandler) UpdatePostStatus(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var req moderationStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.UpdatePostStatus(id, req.Status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update post status"})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *ModerationHandler) UpdateCommentStatus(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var req moderationStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.UpdateCommentStatus(id, req.Status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update comment status"})
		return
	}
	c.Status(http.StatusNoContent)
}
