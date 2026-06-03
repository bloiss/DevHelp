package handler

import (
	"net/http"
	"strconv"


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
func (h *PostHandler) GetPost(c *gin.Context) {
	id := c.Param("id")
		postID, err := uuid.Parse(id)
if err != nil {
    c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
    return
}

post, err := h.postService.GetByID(postID)
if err != nil {
    c.JSON(http.StatusNotFound, gin.H{"error": "post not found"})
    return
}

c.JSON(http.StatusOK, post)

}
func (h *PostHandler) ListPosts(c *gin.Context) {
    limit := c.DefaultQuery("limit", "20")
    offset := c.DefaultQuery("offset", "0")
    limitInt, _ := strconv.Atoi(limit)
    offsetInt, _ := strconv.Atoi(offset)
posts, total, err := h.postService.List(limitInt, offsetInt)
if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
    return
}

c.JSON(http.StatusOK, gin.H{"posts": posts, "total": total})
}

type updatePostRequest struct {
	Title   string `json:"title"   binding:"required"`
	Content string `json:"content" binding:"required"`
}

func (h *PostHandler) UpdatePost(c *gin.Context) {
	id := c.Param("id")
	postID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req updatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.MustGet("userID").(uuid.UUID)

	post, err := h.postService.Update(postID, userID, req.Title, req.Content)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, post)
}
func (h *PostHandler) DeletePost(c *gin.Context) {
	id := c.Param("id")
	postID, err := uuid.Parse(id)
	if err != nil {c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userID := c.MustGet("userID").(uuid.UUID)
	if err := h.postService.Delete(postID, userID); err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
    return
}
	c.Status(http.StatusNoContent)
}

