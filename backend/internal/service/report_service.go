package service

import (
	"errors"

	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/bloiss/devhelp/backend/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrAlreadyReported  = errors.New("vous avez déjà signalé ce contenu")
	ErrReportNotFound   = errors.New("signalement introuvable")
	ErrInvalidReportStatus = errors.New("statut invalide : utilisez 'resolved' ou 'dismissed'")
)

type ReportService struct {
	repo *repository.ReportRepository
}

func NewReportService(repo *repository.ReportRepository) *ReportService {
	return &ReportService{repo: repo}
}

type ReportListResult struct {
	Data    []repository.ReportFull `json:"data"`
	Total   int64                   `json:"total"`
	Page    int                     `json:"page"`
	PerPage int                     `json:"per_page"`
}

func (s *ReportService) Create(reporterID, targetID uuid.UUID, targetType, reason string) error {
	if s.repo.ExistsForTarget(reporterID, targetID, targetType) {
		return ErrAlreadyReported
	}
	return s.repo.Create(&model.Report{
		ReporterID: reporterID,
		TargetID:   targetID,
		TargetType: targetType,
		Reason:     reason,
		Status:     "pending",
	})
}

func (s *ReportService) List(status *string, page, pageSize int) (*ReportListResult, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 20
	}
	data, total, err := s.repo.FindAll(status, page, pageSize)
	if err != nil {
		return nil, err
	}
	return &ReportListResult{Data: data, Total: total, Page: page, PerPage: pageSize}, nil
}

func (s *ReportService) Resolve(id, resolverID uuid.UUID, status string) error {
	if status != "resolved" && status != "dismissed" {
		return ErrInvalidReportStatus
	}
	if _, err := s.repo.FindByID(id); err != nil {
		return ErrReportNotFound
	}
	return s.repo.Resolve(id, resolverID, status)
}
