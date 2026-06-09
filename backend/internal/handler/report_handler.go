package handler

import (
	"net/http"
	"strconv"

	"github.com/bloiss/devhelp/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ReportHandler struct {
	svc *service.ReportService
}

func NewReportHandler(svc *service.ReportService) *ReportHandler {
	return &ReportHandler{svc: svc}
}

type createReportRequest struct {
	Reason string `json:"reason" binding:"required,min=3,max=500"`
}

// ReportPost godoc
// @Summary      Signaler un post
// @Tags         reports
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path string            true "UUID post"
// @Param        body body createReportRequest true "Raison"
// @Success      201
// @Router       /posts/{id}/report [post]
func (h *ReportHandler) ReportPost(c *gin.Context) {
	postID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	var req createReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	reporterID := c.MustGet("user_id").(uuid.UUID)

	if err := h.svc.Create(reporterID, postID, "post", req.Reason); err != nil {
		switch err {
		case service.ErrAlreadyReported:
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create report"})
		}
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "signalement enregistré"})
}

// ReportComment godoc
// @Summary      Signaler un commentaire
// @Tags         reports
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id        path string            true "UUID post"
// @Param        commentId path string            true "UUID commentaire"
// @Param        body      body createReportRequest true "Raison"
// @Success      201
// @Router       /posts/{id}/comments/{commentId}/report [post]
func (h *ReportHandler) ReportComment(c *gin.Context) {
	commentID, err := uuid.Parse(c.Param("commentId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid comment id"})
		return
	}

	var req createReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	reporterID := c.MustGet("user_id").(uuid.UUID)

	if err := h.svc.Create(reporterID, commentID, "comment", req.Reason); err != nil {
		switch err {
		case service.ErrAlreadyReported:
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create report"})
		}
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "signalement enregistré"})
}

// AdminListReports godoc
// @Summary      Lister les signalements (admin/modo)
// @Tags         reports
// @Produce      json
// @Security     BearerAuth
// @Param        status   query string false "Filtrer par statut (pending, resolved, dismissed)"
// @Param        page     query int    false "Page"
// @Param        per_page query int    false "Par page"
// @Success      200 {object} service.ReportListResult
// @Router       /admin/reports [get]
func (h *ReportHandler) AdminListReports(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	var status *string
	if v := c.Query("status"); v != "" {
		status = &v
	}

	result, err := h.svc.List(status, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch reports"})
		return
	}
	c.JSON(http.StatusOK, result)
}

type updateReportRequest struct {
	Status string `json:"status" binding:"required"`
}

// AdminUpdateReport godoc
// @Summary      Résoudre ou ignorer un signalement (admin/modo)
// @Tags         reports
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path string             true "UUID signalement"
// @Param        body body updateReportRequest true "Nouveau statut (resolved|dismissed)"
// @Success      200
// @Router       /admin/reports/{id} [patch]
func (h *ReportHandler) AdminUpdateReport(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req updateReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resolverID := c.MustGet("user_id").(uuid.UUID)

	if err := h.svc.Resolve(id, resolverID, req.Status); err != nil {
		switch err {
		case service.ErrReportNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case service.ErrInvalidReportStatus:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update report"})
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "signalement mis à jour"})
}
