package handler

import (
	"net/http"
	"strconv"

	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/bloiss/devhelp/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AdminHandler struct {
	userSvc *service.UserService
	postSvc *service.PostService
}

func NewAdminHandler(userSvc *service.UserService, postSvc *service.PostService) *AdminHandler {
	return &AdminHandler{userSvc: userSvc, postSvc: postSvc}
}

// ListUsers godoc
// @Summary      Lister tous les utilisateurs (admin)
// @Tags         admin
// @Produce      json
// @Security     BearerAuth
// @Param        page     query int false "Page"
// @Param        per_page query int false "Par page"
// @Success      200 {object} service.UserListResult
// @Router       /admin/users [get]
func (h *AdminHandler) ListUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	result, err := h.userSvc.ListUsers(page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch users"})
		return
	}
	c.JSON(http.StatusOK, result)
}

type setRoleRequest struct {
	Role model.UserRole `json:"role" binding:"required"`
}

// SetUserRole godoc
// @Summary      Changer le rôle d'un utilisateur (admin)
// @Tags         admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path string       true "UUID utilisateur"
// @Param        body body setRoleRequest true "Nouveau rôle"
// @Success      200 {object} map[string]string
// @Router       /admin/users/{id}/role [patch]
func (h *AdminHandler) SetUserRole(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req setRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.userSvc.SetRole(id, req.Role); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "role updated"})
}

// ListPosts godoc
// @Summary      Lister tous les posts avec filtre de statut (admin)
// @Tags         admin
// @Produce      json
// @Security     BearerAuth
// @Param        status   query string false "Filtrer par statut"
// @Param        page     query int    false "Page"
// @Param        per_page query int    false "Par page"
// @Success      200 {object} service.PostListResult
// @Router       /admin/posts [get]
func (h *AdminHandler) ListPosts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	input := service.PostListInput{
		Page:        page,
		PageSize:    pageSize,
		AllStatuses: true,
	}

	if v := c.Query("status"); v != "" {
		s := model.ContentStatus(v)
		input.Status = &s
		input.AllStatuses = false
	}

	result, err := h.postSvc.List(input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch posts"})
		return
	}
	c.JSON(http.StatusOK, result)
}
