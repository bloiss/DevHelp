package handler

import (
	"net/http"

	"github.com/bloiss/devhelp/backend/internal/repository"
	"github.com/bloiss/devhelp/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type FollowHandler struct {
	svc      *service.FollowService
	userRepo *repository.UserRepository
}

func NewFollowHandler(svc *service.FollowService, userRepo *repository.UserRepository) *FollowHandler {
	return &FollowHandler{svc: svc, userRepo: userRepo}
}

// resolveUsername retourne le model.User à partir du paramètre :username.
func (h *FollowHandler) resolveUsername(c *gin.Context) (uuid.UUID, bool) {
	username := c.Param("username")
	user, err := h.userRepo.FindByUsername(username)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return uuid.Nil, false
	}
	return user.ID, true
}

// Follow godoc
// @Summary      Suivre un utilisateur
// @Description  Permet à l'utilisateur connecté de suivre un autre utilisateur identifié par son username.
// @Tags         follow
// @Produce      json
// @Security     BearerAuth
// @Param        username path string true "Username de l'utilisateur à suivre"
// @Success      200 {object} map[string]string
// @Failure      400 {object} map[string]string
// @Failure      401 {object} map[string]string
// @Failure      404 {object} map[string]string
// @Router       /api/v1/users/{username}/follow [post]
func (h *FollowHandler) Follow(c *gin.Context) {
	followerID := c.MustGet("user_id").(uuid.UUID)
	followingID, ok := h.resolveUsername(c)
	if !ok {
		return
	}

	if err := h.svc.Follow(followerID, followingID); err != nil {
		switch err {
		case service.ErrCannotFollowSelf:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to follow user"})
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "followed"})
}

// Unfollow godoc
// @Summary      Ne plus suivre un utilisateur
// @Description  Permet à l'utilisateur connecté d'arrêter de suivre un autre utilisateur identifié par son username.
// @Tags         follow
// @Produce      json
// @Security     BearerAuth
// @Param        username path string true "Username de l'utilisateur à ne plus suivre"
// @Success      200 {object} map[string]string
// @Failure      401 {object} map[string]string
// @Failure      404 {object} map[string]string
// @Router       /api/v1/users/{username}/follow [delete]
func (h *FollowHandler) Unfollow(c *gin.Context) {
	followerID := c.MustGet("user_id").(uuid.UUID)
	followingID, ok := h.resolveUsername(c)
	if !ok {
		return
	}

	if err := h.svc.Unfollow(followerID, followingID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to unfollow user"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "unfollowed"})
}

// Followers godoc
// @Summary      Lister les abonnés d'un utilisateur
// @Description  Retourne la liste des utilisateurs qui suivent le profil identifié par son username.
// @Tags         follow
// @Produce      json
// @Param        username path string true "Username de l'utilisateur"
// @Success      200 {object} map[string]interface{}
// @Failure      404 {object} map[string]string
// @Router       /api/v1/users/{username}/followers [get]
func (h *FollowHandler) Followers(c *gin.Context) {
	targetID, ok := h.resolveUsername(c)
	if !ok {
		return
	}

	users, err := h.svc.ListFollowers(targetID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list followers"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": users})
}

// Following godoc
// @Summary      Lister les abonnements d'un utilisateur
// @Description  Retourne la liste des utilisateurs que suit le profil identifié par son username.
// @Tags         follow
// @Produce      json
// @Param        username path string true "Username de l'utilisateur"
// @Success      200 {object} map[string]interface{}
// @Failure      404 {object} map[string]string
// @Router       /api/v1/users/{username}/following [get]
func (h *FollowHandler) Following(c *gin.Context) {
	targetID, ok := h.resolveUsername(c)
	if !ok {
		return
	}

	users, err := h.svc.ListFollowing(targetID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list following"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": users})
}
