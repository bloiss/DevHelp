package handler

import (
	"net/http"

	"github.com/bloiss/devhelp/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type NotificationHandler struct {
	svc     *service.NotificationService
	pushSvc *service.PushService
}

func NewNotificationHandler(svc *service.NotificationService, pushSvc *service.PushService) *NotificationHandler {
	return &NotificationHandler{svc: svc, pushSvc: pushSvc}
}

func (h *NotificationHandler) List(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	notifs, err := h.svc.List(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch notifications"})
		return
	}
	c.JSON(http.StatusOK, notifs)
}

func (h *NotificationHandler) Inbox(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	notifs, err := h.svc.ListInbox(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch inbox"})
		return
	}
	c.JSON(http.StatusOK, notifs)
}

func (h *NotificationHandler) UnreadCount(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	count, err := h.svc.UnreadCount(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to count"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"count": count})
}

func (h *NotificationHandler) MarkRead(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.svc.MarkRead(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to mark as read"})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *NotificationHandler) MarkAllRead(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	if err := h.svc.MarkAllRead(userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed"})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *NotificationHandler) MarkUnread(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.svc.MarkUnread(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to mark as unread"})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *NotificationHandler) Star(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var body struct {
		Starred bool `json:"starred"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	if err := h.svc.SetStar(id, userID, body.Starred); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to star"})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *NotificationHandler) Archive(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var body struct {
		Archived bool `json:"archived"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	if err := h.svc.SetArchive(id, userID, body.Archived); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to archive"})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *NotificationHandler) Delete(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.svc.Delete(id, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete"})
		return
	}
	c.Status(http.StatusNoContent)
}

// ─── Préférences de notifications ───────────────────────────────────────────

func (h *NotificationHandler) GetPrefs(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	prefs := h.pushSvc.GetPrefs(userID)
	c.JSON(http.StatusOK, prefs)
}

func (h *NotificationHandler) UpdatePrefs(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	var body struct {
		PushEnabled     *bool `json:"push_enabled"`
		NotifyOnComment *bool `json:"notify_on_comment"`
		NotifyOnLike    *bool `json:"notify_on_like"`
		NotifyOnMessage *bool `json:"notify_on_message"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	prefs := h.pushSvc.GetPrefs(userID)
	prefs.UserID = userID
	if body.PushEnabled != nil     { prefs.PushEnabled = *body.PushEnabled }
	if body.NotifyOnComment != nil { prefs.NotifyOnComment = *body.NotifyOnComment }
	if body.NotifyOnLike != nil    { prefs.NotifyOnLike = *body.NotifyOnLike }
	if body.NotifyOnMessage != nil { prefs.NotifyOnMessage = *body.NotifyOnMessage }

	if err := h.pushSvc.UpdatePrefs(prefs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update prefs"})
		return
	}
	c.JSON(http.StatusOK, prefs)
}

// ─── Push subscriptions ──────────────────────────────────────────────────────

func (h *NotificationHandler) GetVAPIDKey(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"public_key": h.pushSvc.VAPIDPublicKey()})
}

func (h *NotificationHandler) SavePushSub(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	var body struct {
		Endpoint string `json:"endpoint" binding:"required"`
		P256dh   string `json:"p256dh"   binding:"required"`
		Auth     string `json:"auth"     binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	if err := h.pushSvc.SaveSubscription(userID, body.Endpoint, body.P256dh, body.Auth); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save subscription"})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *NotificationHandler) DeletePushSub(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	var body struct {
		Endpoint string `json:"endpoint" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	if err := h.pushSvc.DeleteSubscription(userID, body.Endpoint); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete subscription"})
		return
	}
	c.Status(http.StatusNoContent)
}
