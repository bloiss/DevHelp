package handler

import (
	"net/http"
	"strconv"

	"github.com/bloiss/devhelp/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type UserHandler struct {
	svc *service.UserService
}

func NewUserHandler(svc *service.UserService) *UserHandler {
	return &UserHandler{svc: svc}
}

// GetProfile godoc
// @Summary      Profil public d'un utilisateur
// @Description  Retourne le profil public d'un utilisateur avec ses statistiques (posts, followers, following).
// @Tags         users
// @Produce      json
// @Param        username path string true "Nom d'utilisateur"
// @Success      200 {object} service.PublicProfile
// @Failure      404 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /api/v1/users/{username} [get]
func (h *UserHandler) GetProfile(c *gin.Context) {
	username := c.Param("username")

	var requesterID *uuid.UUID
	if id, exists := c.Get("user_id"); exists {
		uid := id.(uuid.UUID)
		requesterID = &uid
	}

	profile, err := h.svc.GetProfile(username, requesterID)
	if err != nil {
		switch err {
		case service.ErrUserNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch profile"})
		}
		return
	}
	c.JSON(http.StatusOK, profile)
}

// SearchUsers godoc
// @Summary      Rechercher des utilisateurs par username
// @Description  Recherche des utilisateurs dont le username correspond à la requête. Utile pour l'autocomplétion.
// @Tags         users
// @Produce      json
// @Param        q     query string true  "Terme de recherche (min 1 caractère)"
// @Param        limit query int    false "Nombre max de résultats (défaut 10)"
// @Success      200 {object} map[string]interface{}
// @Failure      400 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /api/v1/users/search [get]
func (h *UserHandler) SearchUsers(c *gin.Context) {
	q := c.Query("q")
	if len(q) < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "query too short"})
		return
	}
	limit := 10
	if l := c.Query("limit"); l != "" {
		if n, err := strconv.Atoi(l); err == nil && n > 0 {
			limit = n
		}
	}
	users, err := h.svc.SearchUsers(q, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "search failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": users})
}

type updateMeRequest struct {
	Username  *string `json:"username"`
	AvatarURL *string `json:"avatar_url"`
	BannerURL *string `json:"banner_url"`
	Bio       *string `json:"bio"`
}

// UpdateMe godoc
// @Summary      Mettre à jour son propre profil
// @Description  Met à jour les informations du profil de l'utilisateur connecté (username, avatar, bannière, bio).
// @Tags         users
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body updateMeRequest true "Champs à modifier"
// @Success      200 {object} model.User
// @Failure      400 {object} map[string]string
// @Failure      401 {object} map[string]string
// @Failure      404 {object} map[string]string
// @Failure      409 {object} map[string]string
// @Router       /api/v1/users/me [patch]
func (h *UserHandler) UpdateMe(c *gin.Context) {
	var req updateMeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.MustGet("user_id").(uuid.UUID)

	user, err := h.svc.UpdateMe(userID, service.UpdateMeInput{
		Username:  req.Username,
		AvatarURL: req.AvatarURL,
		BannerURL: req.BannerURL,
		Bio:       req.Bio,
	})
	if err != nil {
		switch err {
		case service.ErrUserNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		case service.ErrUsernameTaken:
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		case service.ErrUsernameInvalid:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update profile"})
		}
		return
	}
	c.JSON(http.StatusOK, user)
}
