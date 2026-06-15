package repository

import (
	"time"

	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ModerationLogRepository struct {
	db *gorm.DB
}

func NewModerationLogRepository(db *gorm.DB) *ModerationLogRepository {
	return &ModerationLogRepository{db: db}
}

func (r *ModerationLogRepository) FindLatestBatch(ids []uuid.UUID, targetType string) map[uuid.UUID]*model.ModerationLog {
	result := make(map[uuid.UUID]*model.ModerationLog)
	if len(ids) == 0 {
		return result
	}
	var logs []model.ModerationLog
	r.db.Where("target_id IN ? AND target_type = ?", ids, targetType).
		Order("created_at DESC").
		Find(&logs)
	seen := make(map[uuid.UUID]bool)
	for i := range logs {
		if !seen[logs[i].TargetID] {
			seen[logs[i].TargetID] = true
			l := logs[i]
			result[logs[i].TargetID] = &l
		}
	}
	return result
}

func (r *ModerationLogRepository) UpdateReview(targetID uuid.UUID, targetType, finalStatus string, adminID uuid.UUID) error {
	now := time.Now()
	return r.db.Model(&model.ModerationLog{}).
		Where("target_id = ? AND target_type = ?", targetID, targetType).
		Updates(map[string]interface{}{
			"final_status": finalStatus,
			"reviewed_by":  adminID,
			"reviewed_at":  now,
		}).Error
}

func (r *ModerationLogRepository) Stats() (map[string]int64, error) {
	type row struct {
		Status string
		Count  int64
	}
	var rows []row
	err := r.db.Raw(`
		SELECT status, COUNT(*) as count
		FROM (
			SELECT status FROM posts
			UNION ALL
			SELECT status FROM comments
		) combined
		GROUP BY status
	`).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	stats := map[string]int64{
		"pending_moderation": 0,
		"approved":           0,
		"flagged":            0,
		"blocked":            0,
	}
	for _, r := range rows {
		stats[r.Status] += r.Count
	}
	return stats, nil
}
