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

// List godoc
// @Summary      Lister les commentaires d'un post
// @Tags         comments
// @Produce      json
// @Param        id path string true "UUID post"
// @Success      200 {array} model.Comment
// @Router       /posts/{id}/comments [get]
func (h *CommentHandler) List(c *gin.Context) {
	postID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	comments, err := h.svc.ListByPost(postID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "post not found"})
		return
	}
	c.JSON(http.StatusOK, comments)
}

type commentCreateRequest struct {
	Content string `json:"content" binding:"required,min=1"`
}

// Create godoc
// @Summary      Commenter un post
// @Tags         comments
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path string               true "UUID post"
// @Param        body body commentCreateRequest true "Contenu"
// @Success      201 {object} model.Comment
// @Router       /posts/{id}/comments [post]
func (h *CommentHandler) Create(c *gin.Context) {
	postID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	var req commentCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.MustGet("user_id").(uuid.UUID)

	comment, err := h.svc.Create(postID, userID, req.Content)
	if err != nil {
		switch err {
		case service.ErrPostNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": "post not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create comment"})
		}
		return
	}
	c.JSON(http.StatusCreated, comment)
}

// Delete godoc
// @Summary      Supprimer un commentaire (auteur ou admin)
// @Tags         comments
// @Security     BearerAuth
// @Param        id         path string true "UUID post"
// @Param        commentId  path string true "UUID commentaire"
// @Success      204
// @Router       /posts/{id}/comments/{commentId} [delete]
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
			c.JSON(http.StatusNotFound, gin.H{"error": "comment not found"})
		case service.ErrCommentForbidden:
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete comment"})
		}
		return
	}
	c.JSON(http.StatusNoContent, nil)
}
