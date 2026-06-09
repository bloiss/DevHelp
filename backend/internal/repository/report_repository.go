package repository

import (
	"time"

	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ReportRepository struct {
	db *gorm.DB
}

func NewReportRepository(db *gorm.DB) *ReportRepository {
	return &ReportRepository{db: db}
}

// ReportFull enrichit un Report avec les infos du reporter et un extrait de la cible.
type ReportFull struct {
	model.Report
	Reporter      model.User `json:"reporter"`
	TargetTitle   string     `json:"target_title,omitempty"`
	TargetContent string     `json:"target_content,omitempty"`
}

func (r *ReportRepository) Create(report *model.Report) error {
	return r.db.Create(report).Error
}

func (r *ReportRepository) ExistsForTarget(reporterID, targetID uuid.UUID, targetType string) bool {
	var count int64
	r.db.Model(&model.Report{}).
		Where("reporter_id = ? AND target_id = ? AND target_type = ? AND status = 'pending'",
			reporterID, targetID, targetType).
		Count(&count)
	return count > 0
}

func (r *ReportRepository) FindAll(status *string, page, pageSize int) ([]ReportFull, int64, error) {
	q := r.db.Model(&model.Report{}).Order("created_at desc")
	if status != nil {
		q = q.Where("status = ?", *status)
	}

	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var reports []model.Report
	offset := (page - 1) * pageSize
	if err := q.Limit(pageSize).Offset(offset).Find(&reports).Error; err != nil {
		return nil, 0, err
	}

	// Charger les reporters en batch
	reporterIDs := make([]uuid.UUID, 0, len(reports))
	for _, rep := range reports {
		reporterIDs = append(reporterIDs, rep.ReporterID)
	}
	var reporters []model.User
	r.db.Where("id IN ?", reporterIDs).Find(&reporters)
	reporterMap := make(map[uuid.UUID]model.User, len(reporters))
	for _, u := range reporters {
		reporterMap[u.ID] = u
	}

	// Séparer les IDs par type de cible
	postIDs, commentIDs := make([]uuid.UUID, 0), make([]uuid.UUID, 0)
	for _, rep := range reports {
		switch rep.TargetType {
		case "post":
			postIDs = append(postIDs, rep.TargetID)
		case "comment":
			commentIDs = append(commentIDs, rep.TargetID)
		}
	}

	// Charger les posts
	postMap := make(map[uuid.UUID]model.Post)
	if len(postIDs) > 0 {
		var posts []model.Post
		r.db.Select("id, title, content").Where("id IN ?", postIDs).Find(&posts)
		for _, p := range posts {
			postMap[p.ID] = p
		}
	}

	// Charger les commentaires
	commentMap := make(map[uuid.UUID]model.Comment)
	if len(commentIDs) > 0 {
		var comments []model.Comment
		r.db.Select("id, content").Where("id IN ?", commentIDs).Find(&comments)
		for _, c := range comments {
			commentMap[c.ID] = c
		}
	}

	results := make([]ReportFull, 0, len(reports))
	for _, rep := range reports {
		full := ReportFull{Report: rep, Reporter: reporterMap[rep.ReporterID]}
		switch rep.TargetType {
		case "post":
			if p, ok := postMap[rep.TargetID]; ok {
				full.TargetTitle = p.Title
				if len(p.Content) > 200 {
					full.TargetContent = p.Content[:200] + "…"
				} else {
					full.TargetContent = p.Content
				}
			}
		case "comment":
			if c, ok := commentMap[rep.TargetID]; ok {
				if len(c.Content) > 200 {
					full.TargetContent = c.Content[:200] + "…"
				} else {
					full.TargetContent = c.Content
				}
			}
		}
		results = append(results, full)
	}

	return results, total, nil
}

func (r *ReportRepository) FindByID(id uuid.UUID) (*model.Report, error) {
	var report model.Report
	if err := r.db.First(&report, id).Error; err != nil {
		return nil, err
	}
	return &report, nil
}

func (r *ReportRepository) Resolve(id, resolverID uuid.UUID, status string) error {
	now := time.Now()
	return r.db.Model(&model.Report{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":      status,
		"resolved_by": resolverID,
		"resolved_at": now,
	}).Error
}
