package handler

import (
	"net/http"

	"github.com/bloiss/devhelp/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CommentHandler struct {
	svc *service.CommentService
}

func NewCommentHandler(svc *service.CommentService) *CommentHandler {
	return &CommentHandler{svc: svc}
}

type createCommentRequest struct {
	Content string `json:"content" binding:"required"`
}

// List godoc
// @Summary      Lister les commentaires d'un post
// @Description  Retourne tous les commentaires associés à un post, avec le vote de l'utilisateur connecté si disponible.
// @Tags         comments
// @Produce      json
// @Param        id path string true "UUID post"
// @Success      200 {array} model.Comment
// @Failure      400 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /api/v1/posts/{id}/comments [get]
func (h *CommentHandler) List(c *gin.Context) {
	postID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	var requesterID *uuid.UUID
	if raw, exists := c.Get("user_id"); exists {
		if uid, ok := raw.(uuid.UUID); ok {
			requesterID = &uid
		}
	}
	comments, err := h.svc.ListByPost(postID, requesterID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch comments"})
		return
	}

	c.JSON(http.StatusOK, comments)
}

// Create godoc
// @Summary      Créer un commentaire
// @Description  Ajoute un commentaire sur un post. L'auteur est déduit du token JWT.
// @Tags         comments
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path string              true "UUID post"
// @Param        body body createCommentRequest true "Contenu"
// @Success      201 {object} model.Comment
// @Failure      400 {object} map[string]string
// @Failure      401 {object} map[string]string
// @Failure      500 {object} map[string]string
// @Router       /api/v1/posts/{id}/comments [post]
func (h *CommentHandler) Create(c *gin.Context) {
	postID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	var req createCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.MustGet("user_id").(uuid.UUID)

	comment, err := h.svc.Create(postID, userID, req.Content)
	if err != nil {
		switch err {
		case service.ErrCommentEmpty:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create comment"})
		}
		return
	}

	c.JSON(http.StatusCreated, comment)
}

// Delete godoc
// @Summary      Supprimer un commentaire
// @Description  Supprime un commentaire. Seul l'auteur du commentaire ou un admin peut supprimer.
// @Tags         comments
// @Produce      json
// @Security     BearerAuth
// @Param        id        path string true "UUID post"
// @Param        commentId path string true "UUID commentaire"
// @Success      204
// @Failure      400 {object} map[string]string
// @Failure      401 {object} map[string]string
// @Failure      403 {object} map[string]string
// @Failure      404 {object} map[string]string
// @Router       /api/v1/posts/{id}/comments/{commentId} [delete]
func (h *CommentHandler) Delete(c *gin.Context) {
	commentID, err := uuid.Parse(c.Param("commentId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid comment id"})
		return
	}

	userID := c.MustGet("user_id").(uuid.UUID)
	role, _ := c.Get("user_role")
	roleStr, _ := role.(string)

	if err := h.svc.Delete(commentID, userID, roleStr); err != nil {
		switch err {
		case service.ErrCommentNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case service.ErrCommentForbidden:
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete comment"})
		}
		return
	}

	c.Status(http.StatusNoContent)
}
