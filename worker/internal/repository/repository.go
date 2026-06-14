package repository

import (
	"time"

	"gorm.io/gorm"
)

type ModerationRepository struct {
	db *gorm.DB
}

func New(db *gorm.DB) *ModerationRepository {
	return &ModerationRepository{db: db}
}

func (r *ModerationRepository) UpdatePostStatus(id, status string) error {
	return r.db.Table("posts").
		Where("id = ?::uuid", id).
		Updates(map[string]interface{}{"status": status, "updated_at": time.Now()}).
		Error
}

func (r *ModerationRepository) UpdateCommentStatus(id, status string) error {
	return r.db.Table("comments").
		Where("id = ?::uuid", id).
		Updates(map[string]interface{}{"status": status, "updated_at": time.Now()}).
		Error
}

func (r *ModerationRepository) CreateLog(targetID, targetType, verdict, reason string, confidence *float64) error {
	return r.db.Exec(
		`INSERT INTO moderation_logs (id, target_id, target_type, ai_verdict, ai_reason, ai_confidence, created_at)
		 VALUES (gen_random_uuid(), ?::uuid, ?, ?, ?, ?, NOW())`,
		targetID, targetType, verdict, reason, confidence,
	).Error
}
