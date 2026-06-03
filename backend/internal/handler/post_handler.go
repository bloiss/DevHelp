package handler

import (
	"net/http"

	"github.com/bloiss/devhelp/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type PostHandler struct {
	postService *service.PostService
}

func NewPostHandler(postService *service.PostService) *PostHandler {
	return &PostHandler{postService: postService}
}

type createPostRequest struct{
	Title 		 string `json:"Title"       binding:"required"`
	Content      string `json:"Content"     binding:"required"`
	CategoryID   string `json:"CategoryID"  binding:"required"`
}
func (h *PostHandler) CreatePost(c *gin.Context) {
	var req createPostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
    c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
    return
	}
	userID := c.MustGet("userID").(uuid.UUID)
categoryID, _ := uuid.Parse(req.CategoryID)

post, err := h.postService.Create(userID, req.Title, req.Content, categoryID)
if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
    return
}

c.JSON(http.StatusCreated, post)

}

