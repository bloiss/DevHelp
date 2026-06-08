package handler

import (
	"net/http"

	"github.com/bloiss/devhelp/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CategoryHandler struct {
	svc *service.CategoryService
}

func NewCategoryHandler(svc *service.CategoryService) *CategoryHandler {
	return &CategoryHandler{svc: svc}
}

// List godoc
// @Summary      Lister toutes les catégories
// @Description  Retourne la liste complète des catégories disponibles.
// @Tags         categories
// @Produce      json
// @Success      200 {array} model.Category
// @Failure      500 {object} map[string]string
// @Router       /api/v1/categories [get]
func (h *CategoryHandler) List(c *gin.Context) {
	cats, err := h.svc.List()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch categories"})
		return
	}
	c.JSON(http.StatusOK, cats)
}

// GetBySlug godoc
// @Summary      Récupérer une catégorie par son slug
// @Description  Retourne les détails d'une catégorie identifiée par son slug.
// @Tags         categories
// @Produce      json
// @Param        slug path string true "Slug de la catégorie"
// @Success      200 {object} model.Category
// @Failure      404 {object} map[string]string
// @Router       /api/v1/categories/{slug} [get]
func (h *CategoryHandler) GetBySlug(c *gin.Context) {
	cat, err := h.svc.GetBySlug(c.Param("slug"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "category not found"})
		return
	}
	c.JSON(http.StatusOK, cat)
}

type categoryWriteRequest struct {
	Name        string  `json:"name"        binding:"required,min=2,max=60"`
	Description *string `json:"description"`
	Pillar      *string `json:"pillar"`
}

// Create godoc
// @Summary      Créer une catégorie (admin)
// @Description  Crée une nouvelle catégorie. Réservé aux administrateurs.
// @Tags         categories
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body categoryWriteRequest true "Données"
// @Success      201 {object} model.Category
// @Failure      400 {object} map[string]string
// @Failure      409 {object} map[string]string
// @Router       /api/v1/categories [post]
func (h *CategoryHandler) Create(c *gin.Context) {
	var req categoryWriteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cat, err := h.svc.Create(service.CategoryInput{
		Name:        req.Name,
		Description: req.Description,
		Pillar:      req.Pillar,
	})
	if err != nil {
		switch err {
		case service.ErrCategoryNameExists, service.ErrCategorySlugExists:
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		case service.ErrCategoryInvalidPillar:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create category"})
		}
		return
	}
	c.JSON(http.StatusCreated, cat)
}

// Update godoc
// @Summary      Modifier une catégorie (admin)
// @Description  Met à jour les informations d'une catégorie existante. Réservé aux administrateurs.
// @Tags         categories
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path string              true "UUID catégorie"
// @Param        body body categoryWriteRequest true "Données"
// @Success      200 {object} model.Category
// @Failure      400 {object} map[string]string
// @Failure      404 {object} map[string]string
// @Failure      409 {object} map[string]string
// @Router       /api/v1/categories/{id} [put]
func (h *CategoryHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req categoryWriteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cat, err := h.svc.Update(id, service.CategoryInput{
		Name:        req.Name,
		Description: req.Description,
		Pillar:      req.Pillar,
	})
	if err != nil {
		switch err {
		case service.ErrCategoryNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case service.ErrCategoryNameExists, service.ErrCategorySlugExists:
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		case service.ErrCategoryInvalidPillar:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update category"})
		}
		return
	}
	c.JSON(http.StatusOK, cat)
}

// Delete godoc
// @Summary      Supprimer une catégorie (admin)
// @Description  Supprime une catégorie. Réservé aux administrateurs.
// @Tags         categories
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "UUID catégorie"
// @Success      204
// @Failure      400 {object} map[string]string
// @Failure      404 {object} map[string]string
// @Router       /api/v1/categories/{id} [delete]
func (h *CategoryHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.svc.Delete(id); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "category not found"})
		return
	}
	c.JSON(http.StatusNoContent, nil)
}
