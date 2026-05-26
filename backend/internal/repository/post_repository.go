package repository

import (
	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostRepository struct {
	db *gorm.DB
}

func NewPostRepository(db *gorm.DB) *PostRepository {
	return &PostRepository{db: db}
}

type PostFilters struct {
	CategoryID *uuid.UUID
	AuthorID   *uuid.UUID
	Status     *model.ContentStatus // nil = approved uniquement (public)
	Page       int
	PageSize   int
}

func (r *PostRepository) FindAll(f PostFilters) ([]model.Post, int64, error) {
	q := r.db.Model(&model.Post{}).
		Preload("Author").
		Preload("Category").
		Preload("Images")

	if f.CategoryID != nil {
		q = q.Where("category_id = ?", f.CategoryID)
	}
	if f.AuthorID != nil {
		q = q.Where("user_id = ?", f.AuthorID)
	}
	if f.Status != nil {
		q = q.Where("status = ?", *f.Status)
	} else {
		q = q.Where("status = ? AND is_hidden = false", model.StatusApproved)
	}

	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if f.PageSize <= 0 {
		f.PageSize = 20
	}
	if f.Page <= 0 {
		f.Page = 1
	}
	offset := (f.Page - 1) * f.PageSize

	var posts []model.Post
	err := q.Order("created_at DESC").Limit(f.PageSize).Offset(offset).Find(&posts).Error
	return posts, total, err
}

func (r *PostRepository) FindByID(id uuid.UUID) (*model.Post, error) {
	var post model.Post
	err := r.db.
		Preload("Author").
		Preload("Category").
		Preload("Images").
		First(&post, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &post, nil
}

func (r *PostRepository) Create(post *model.Post) error {
	return r.db.Create(post).Error
}

func (r *PostRepository) Update(post *model.Post) error {
	return r.db.Save(post).Error
}

func (r *PostRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.Post{}, "id = ?", id).Error
}
