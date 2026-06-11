package handler

import (
    "github.com/bloiss/devhelp/backend/internal/service"
	"github.com/gin-gonic/gin"
	"net/http"
    
)
type AIHandler struct {
	aiService *service.AIService
}

func NewAIHandler(svc *service.AIService) *AIHandler {
	return &AIHandler{aiService: svc}
}
func (h *AIHandler) Assist(c *gin.Context) {
    type assistRequest struct {
        Text string `json:"text" binding:"required"`
    }
    var req assistRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    result, err := h.aiService.Improve(req.Text)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"result": result})
}
