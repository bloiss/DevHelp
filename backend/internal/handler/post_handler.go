package handler

import (
	"net/http"
	"strconv"

	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/bloiss/devhelp/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type PostHandler struct {
	svc *service.PostService
}

func NewPostHandler(svc *service.PostService) *PostHandler {
	return &PostHandler{svc: svc}
}

// List godoc
// @Summary      Lister les posts (paginés)
// @Tags         posts
// @Produce      json
// @Param        category_id query string false "UUID catégorie"
// @Param        author_id   query string false "UUID auteur"
// @Param        page        query int    false "Page (défaut 1)"
// @Param        page_size   query int    false "Taille page (défaut 20)"
// @Success      200 {object} service.PostListResult
// @Router       /posts [get]
func (h *PostHandler) List(c *gin.Context) {
	input := service.PostListInput{
		Page:     queryInt(c, "page", 1),
		PageSize: queryInt(c, "page_size", 20),
	}

	if v := c.Query("category_id"); v != "" {
		id, err := uuid.Parse(v)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category_id"})
			return
		}
		input.CategoryID = &id
	}
	if v := c.Query("author_id"); v != "" {
		id, err := uuid.Parse(v)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid author_id"})
			return
		}
		input.AuthorID = &id
	}

	result, err := h.svc.List(input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch posts"})
		return
	}
	c.JSON(http.StatusOK, result)
}

// Get godoc
// @Summary      Récupérer un post par ID
// @Tags         posts
// @Produce      json
// @Param        id path string true "UUID post"
// @Success      200 {object} model.Post
// @Failure      404 {object} map[string]string
// @Router       /posts/{id} [get]
func (h *PostHandler) Get(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	role, _ := c.Get("user_role")
	roleStr, _ := role.(string)

	post, err := h.svc.GetByID(id, roleStr)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "post not found"})
		return
	}
	c.JSON(http.StatusOK, post)
}

type postCreateRequest struct {
	CategoryID uuid.UUID `json:"category_id" binding:"required"`
	Title      string    `json:"title"       binding:"required,min=5,max=200"`
	Content    string    `json:"content"     binding:"required"`
}

// Create godoc
// @Summary      Créer un post
// @Tags         posts
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body postCreateRequest true "Données"
// @Success      201 {object} model.Post
// @Router       /posts [post]
func (h *PostHandler) Create(c *gin.Context) {
	var req postCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.MustGet("user_id").(uuid.UUID)

	post, err := h.svc.Create(service.PostCreateInput{
		UserID:     userID,
		CategoryID: req.CategoryID,
		Title:      req.Title,
		Content:    req.Content,
	})
	if err != nil {
		switch err {
		case service.ErrCategoryNotFound:
			c.JSON(http.StatusBadRequest, gin.H{"error": "category not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create post"})
		}
		return
	}
	c.JSON(http.StatusCreated, post)
}

type postUpdateRequest struct {
	CategoryID *uuid.UUID `json:"category_id"`
	Title      *string    `json:"title"       binding:"omitempty,min=5,max=200"`
	Content    *string    `json:"content"`
}

// Update godoc
// @Summary      Modifier un post (auteur ou admin)
// @Tags         posts
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path string          true "UUID post"
// @Param        body body postUpdateRequest true "Données"
// @Success      200 {object} model.Post
// @Router       /posts/{id} [put]
func (h *PostHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req postUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.MustGet("user_id").(uuid.UUID)
	role, _ := c.Get("user_role")
	roleStr, _ := role.(string)

	post, err := h.svc.Update(id, userID, roleStr, service.PostUpdateInput{
		CategoryID: req.CategoryID,
		Title:      req.Title,
		Content:    req.Content,
	})
	if err != nil {
		switch err {
		case service.ErrPostNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": "post not found"})
		case service.ErrPostForbidden:
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		case service.ErrCategoryNotFound:
			c.JSON(http.StatusBadRequest, gin.H{"error": "category not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update post"})
		}
		return
	}
	c.JSON(http.StatusOK, post)
}

// Delete godoc
// @Summary      Supprimer un post (auteur ou admin)
// @Tags         posts
// @Security     BearerAuth
// @Param        id path string true "UUID post"
// @Success      204
// @Router       /posts/{id} [delete]
func (h *PostHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	userID := c.MustGet("user_id").(uuid.UUID)
	role, _ := c.Get("user_role")
	roleStr, _ := role.(string)

	if err := h.svc.Delete(id, userID, roleStr); err != nil {
		switch err {
		case service.ErrPostNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": "post not found"})
		case service.ErrPostForbidden:
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete post"})
		}
		return
	}
	c.JSON(http.StatusNoContent, nil)
}

// ─── helper ───────────────────────────────────────────────────────────────────

func queryInt(c *gin.Context, key string, def int) int {
	v := c.Query(key)
	if v == "" {
		return def
	}
	n, err := strconv.Atoi(v)
	if err != nil || n <= 0 {
		return def
	}
	return n
}

// ─── Admin-only : changer le statut d'un post ────────────────────────────────

type postStatusRequest struct {
	Status   model.ContentStatus `json:"status"    binding:"required"`
	IsHidden *bool               `json:"is_hidden"`
}

// SetStatus godoc
// @Summary      Changer le statut d'un post (admin/modo)
// @Tags         posts
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path string          true "UUID post"
// @Param        body body postStatusRequest true "Nouveau statut"
// @Success      200 {object} model.Post
// @Router       /admin/posts/{id}/status [patch]
func (h *PostHandler) SetStatus(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req postStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	post, err := h.svc.GetByID(id, "admin")
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "post not found"})
		return
	}

	post.Status = req.Status
	if req.IsHidden != nil {
		post.IsHidden = *req.IsHidden
	}

	if err := h.svc.AdminUpdate(post); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update post"})
		return
	}
	c.JSON(http.StatusOK, post)
}
