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

// List godoc
// @Summary      Lister toutes les notifications
// @Description  Retourne toutes les notifications de l'utilisateur connecté.
// @Tags         notifications
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} map[string]interface{}
// @Failure      401 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /api/v1/notifications [get]
func (h *NotificationHandler) List(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	notifs, err := h.svc.List(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch notifications"})
		return
	}
	c.JSON(http.StatusOK, notifs)
}

// Inbox godoc
// @Summary      Boîte de réception des notifications
// @Description  Retourne les notifications non archivées de l'utilisateur connecté (inbox).
// @Tags         notifications
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} map[string]interface{}
// @Failure      401 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /api/v1/notifications/inbox [get]
func (h *NotificationHandler) Inbox(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	notifs, err := h.svc.ListInbox(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch inbox"})
		return
	}
	c.JSON(http.StatusOK, notifs)
}

// UnreadCount godoc
// @Summary      Nombre de notifications non lues
// @Description  Retourne le nombre de notifications non lues de l'utilisateur connecté.
// @Tags         notifications
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} map[string]int
// @Failure      401 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /api/v1/notifications/unread-count [get]
func (h *NotificationHandler) UnreadCount(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	count, err := h.svc.UnreadCount(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to count"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"count": count})
}

// MarkRead godoc
// @Summary      Marquer une notification comme lue
// @Description  Marque une notification spécifique comme lue.
// @Tags         notifications
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "UUID notification"
// @Success      204
// @Failure      400 {object} map[string]string
// @Failure      401 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /api/v1/notifications/{id}/read [patch]
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

// MarkAllRead godoc
// @Summary      Marquer toutes les notifications comme lues
// @Description  Marque toutes les notifications de l'utilisateur connecté comme lues.
// @Tags         notifications
// @Produce      json
// @Security     BearerAuth
// @Success      204
// @Failure      401 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /api/v1/notifications/read-all [patch]
func (h *NotificationHandler) MarkAllRead(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	if err := h.svc.MarkAllRead(userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed"})
		return
	}
	c.Status(http.StatusNoContent)
}

// MarkUnread godoc
// @Summary      Marquer une notification comme non lue
// @Description  Marque une notification spécifique comme non lue.
// @Tags         notifications
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "UUID notification"
// @Success      204
// @Failure      400 {object} map[string]string
// @Failure      401 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /api/v1/notifications/{id}/unread [patch]
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

// Star godoc
// @Summary      Étoiler ou désétoiler une notification
// @Description  Marque ou démarque une notification avec une étoile pour la mettre en favori.
// @Tags         notifications
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path string true "UUID notification"
// @Param        body body object true "starred: true/false"
// @Success      204
// @Failure      400 {object} map[string]string
// @Failure      401 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /api/v1/notifications/{id}/star [patch]
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

// Archive godoc
// @Summary      Archiver ou désarchiver une notification
// @Description  Déplace une notification dans les archives ou la restaure.
// @Tags         notifications
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path string true "UUID notification"
// @Param        body body object true "archived: true/false"
// @Success      204
// @Failure      400 {object} map[string]string
// @Failure      401 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /api/v1/notifications/{id}/archive [patch]
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

// Delete godoc
// @Summary      Supprimer une notification
// @Description  Supprime définitivement une notification de l'utilisateur connecté.
// @Tags         notifications
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "UUID notification"
// @Success      204
// @Failure      400 {object} map[string]string
// @Failure      401 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /api/v1/notifications/{id} [delete]
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

func (h *NotificationHandler) DeleteAll(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	if err := h.svc.DeleteAll(userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete all"})
		return
	}
	c.Status(http.StatusNoContent)
}

// ─── Préférences de notifications ───────────────────────────────────────────

// GetPrefs godoc
// @Summary      Récupérer les préférences de notifications
// @Description  Retourne les préférences de notifications push de l'utilisateur connecté.
// @Tags         notifications
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} map[string]interface{}
// @Failure      401 {object} map[string]string
// @Router       /api/v1/notifications/prefs [get]
func (h *NotificationHandler) GetPrefs(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	prefs := h.pushSvc.GetPrefs(userID)
	c.JSON(http.StatusOK, prefs)
}

// UpdatePrefs godoc
// @Summary      Mettre à jour les préférences de notifications
// @Description  Met à jour les préférences de notifications push (push activé, commentaires, likes, messages).
// @Tags         notifications
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body object true "Préférences (push_enabled, notify_on_comment, notify_on_like, notify_on_message)"
// @Success      200 {object} map[string]interface{}
// @Failure      400 {object} map[string]string
// @Failure      401 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /api/v1/notifications/prefs [patch]
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

// GetVAPIDKey godoc
// @Summary      Récupérer la clé publique VAPID
// @Description  Retourne la clé publique VAPID nécessaire pour s'abonner aux notifications push.
// @Tags         notifications
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} map[string]string
// @Failure      401 {object} map[string]string
// @Router       /api/v1/push/vapid-key [get]
func (h *NotificationHandler) GetVAPIDKey(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"public_key": h.pushSvc.VAPIDPublicKey()})
}

// SavePushSub godoc
// @Summary      Enregistrer un abonnement push
// @Description  Enregistre un abonnement Web Push pour recevoir des notifications en temps réel.
// @Tags         notifications
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body object true "Subscription (endpoint, p256dh, auth)"
// @Success      204
// @Failure      400 {object} map[string]string
// @Failure      401 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /api/v1/push/subscriptions [post]
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

// DeletePushSub godoc
// @Summary      Supprimer un abonnement push
// @Description  Supprime un abonnement Web Push enregistré pour ne plus recevoir de notifications sur cet endpoint.
// @Tags         notifications
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body object true "Endpoint de la subscription à supprimer"
// @Success      204
// @Failure      400 {object} map[string]string
// @Failure      401 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /api/v1/push/subscriptions [delete]
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
