package repository

import (
	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CommentRepository struct {
	db *gorm.DB
}

func NewCommentRepository(db *gorm.DB) *CommentRepository {
	return &CommentRepository{db: db}
}

func (r *CommentRepository) FindByPost(postID uuid.UUID) ([]model.Comment, error) {
	var comments []model.Comment
	err := r.db.
		Preload("Author").
		Where("post_id = ? AND status = ? AND is_hidden = false", postID, model.StatusApproved).
		Order("created_at ASC").
		Find(&comments).Error
	return comments, err
}

func (r *CommentRepository) FindByID(id uuid.UUID) (*model.Comment, error) {
	var c model.Comment
	err := r.db.Preload("Author").First(&c, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *CommentRepository) Create(c *model.Comment) error {
	return r.db.Create(c).Error
}

func (r *CommentRepository) Update(c *model.Comment) error {
	return r.db.Save(c).Error
}

func (r *CommentRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.Comment{}, "id = ?", id).Error
}
