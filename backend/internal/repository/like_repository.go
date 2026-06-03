package repository

import (
	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type LikeRepository struct {
	db *gorm.DB
}

func NewLikeRepository(db *gorm.DB) *LikeRepository {
	return &LikeRepository{db: db}
}

func (r *LikeRepository) Find(userID, targetID uuid.UUID, targetType string) (*model.Like, error) {
	var like model.Like
	err := r.db.First(&like, "user_id = ? AND target_id = ? AND target_type = ?", userID, targetID, targetType).Error
	if err != nil {
		return nil, err
	}
	return &like, nil
}

func (r *LikeRepository) Create(like *model.Like) error {
	return r.db.Create(like).Error
}

func (r *LikeRepository) Update(like *model.Like) error {
	return r.db.Save(like).Error
}

func (r *LikeRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.Like{}, "id = ?", id).Error
}

func (r *LikeRepository) CountByTarget(targetID uuid.UUID, targetType string) (int64, error) {
	var count int64
	err := r.db.Model(&model.Like{}).
		Select("COALESCE(SUM(value), 0)").
		Where("target_id = ? AND target_type = ?", targetID, targetType).
		Scan(&count).Error
	return count, err
}
