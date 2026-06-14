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

func (r *LikeRepository) CountSeparate(targetID uuid.UUID, targetType string) (likes int64, dislikes int64, err error) {
	type row struct {
		Value int
		Count int64
	}
	var rows []row
	err = r.db.Model(&model.Like{}).
		Select("value, COUNT(*) as count").
		Where("target_id = ? AND target_type = ?", targetID, targetType).
		Group("value").
		Scan(&rows).Error
	if err != nil {
		return
	}
	for _, r := range rows {
		if r.Value == 1 {
			likes = r.Count
		} else if r.Value == -1 {
			dislikes = r.Count
		}
	}
	return
}
