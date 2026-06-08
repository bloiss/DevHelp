package handler

import (
	"net/http"

	"github.com/bloiss/devhelp/backend/internal/service"
	"github.com/gin-gonic/gin"
)

type UploadHandler struct {
	svc *service.UploadService
}

func NewUploadHandler(svc *service.UploadService) *UploadHandler {
	return &UploadHandler{svc: svc}
}

// UploadImage godoc
// @Summary      Uploader une image (PNG, JPEG, GIF — max 20 MB)
// @Tags         upload
// @Accept       multipart/form-data
// @Produce      json
// @Security     BearerAuth
// @Param        file formData file true "Image"
// @Success      201 {object} service.UploadResult
// @Router       /upload [post]
func (h *UploadHandler) UploadImage(c *gin.Context) {
	fh, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "champ 'file' manquant"})
		return
	}

	result, err := h.svc.UploadImage(c.Request.Context(), fh)
	if err != nil {
		switch err {
		case service.ErrFileTooLarge:
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": err.Error()})
		case service.ErrInvalidMimeType:
			c.JSON(http.StatusUnsupportedMediaType, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "upload failed"})
		}
		return
	}

	c.JSON(http.StatusCreated, result)
}
