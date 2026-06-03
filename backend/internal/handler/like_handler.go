package handler

import (
	"net/http"

	"github.com/bloiss/devhelp/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type LikeHandler struct {
	svc *service.LikeService
}

func NewLikeHandler(svc *service.LikeService) *LikeHandler {
	return &LikeHandler{svc: svc}
}

type voteRequest struct {
	Value int `json:"value" binding:"required"`
}

// VotePost godoc
// @Summary      Voter sur un post (+1 / -1, toggle)
// @Tags         likes
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path string      true "UUID post"
// @Param        body body voteRequest true "Valeur du vote"
// @Success      200 {object} service.VoteResult
// @Router       /posts/{id}/like [post]
func (h *LikeHandler) VotePost(c *gin.Context) {
	h.vote(c, "post")
}

// VoteComment godoc
// @Summary      Voter sur un commentaire (+1 / -1, toggle)
// @Tags         likes
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id        path string      true "UUID post"
// @Param        commentId path string      true "UUID commentaire"
// @Param        body      body voteRequest true "Valeur du vote"
// @Success      200 {object} service.VoteResult
// @Router       /posts/{id}/comments/{commentId}/like [post]
func (h *LikeHandler) VoteComment(c *gin.Context) {
	h.vote(c, "comment")
}

func (h *LikeHandler) vote(c *gin.Context, targetType string) {
	var targetID uuid.UUID
	var err error

	if targetType == "comment" {
		targetID, err = uuid.Parse(c.Param("commentId"))
	} else {
		targetID, err = uuid.Parse(c.Param("id"))
	}
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req voteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.MustGet("user_id").(uuid.UUID)

	result, err := h.svc.Toggle(userID, targetID, targetType, req.Value)
	if err != nil {
		switch err {
		case service.ErrInvalidVoteValue:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "vote failed"})
		}
		return
	}
	c.JSON(http.StatusOK, result)
}
