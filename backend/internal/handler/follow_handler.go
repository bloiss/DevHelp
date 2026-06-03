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

// POST /users/:username/follow
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

// DELETE /users/:username/follow
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

// GET /users/:username/followers
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

// GET /users/:username/following
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
