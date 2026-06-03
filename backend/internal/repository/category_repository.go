package repository

import (
	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CategoryRepository struct {
	db *gorm.DB
}

func NewCategoryRepository(db *gorm.DB) *CategoryRepository {
	return &CategoryRepository{db: db}
}

func (r *CategoryRepository) FindAll() ([]model.Category, error) {
	var categories []model.Category
	err := r.db.Order("name ASC").Find(&categories).Error
	return categories, err
}

func (r *CategoryRepository) FindByID(id uuid.UUID) (*model.Category, error) {
	var cat model.Category
	err := r.db.First(&cat, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &cat, nil
}

func (r *CategoryRepository) FindBySlug(slug string) (*model.Category, error) {
	var cat model.Category
	err := r.db.First(&cat, "slug = ?", slug).Error
	if err != nil {
		return nil, err
	}
	return &cat, nil
}

func (r *CategoryRepository) Create(cat *model.Category) error {
	return r.db.Create(cat).Error
}

func (r *CategoryRepository) Update(cat *model.Category) error {
	return r.db.Save(cat).Error
}

func (r *CategoryRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.Category{}, "id = ?", id).Error
}

func (r *CategoryRepository) ExistsByName(name string) (bool, error) {
	var count int64
	err := r.db.Model(&model.Category{}).Where("name = ?", name).Count(&count).Error
	return count > 0, err
}

func (r *CategoryRepository) ExistsBySlug(slug string) (bool, error) {
	var count int64
	err := r.db.Model(&model.Category{}).Where("slug = ?", slug).Count(&count).Error
	return count > 0, err
}
