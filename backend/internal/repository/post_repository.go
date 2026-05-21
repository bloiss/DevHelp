package repository

import (
	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostRepository struct {
    db *gorm.DB
}

func NewPostRepository(db *gorm.DB)  *PostRepository {
    return &PostRepository{db: db}
}
func (r *PostRepository) Create(post *model.Post) error {
    return r.db.Create(post).Error
}

func (r *PostRepository) FindByID(id uuid.UUID) (*model.Post, error){
    var post model.Post
    err := r.db.First(&post, "id =  ?", id).Error
    return &post, err
}

func (r *PostRepository) FindAll(limit, offset int) ([]model.Post, int64, error){
    var posts []model.Post
    var total int64
    r.db.Model(&model.Post{}).Count(&total)
    err := r.db.Limit(limit).Offset(offset).Find(&posts).Error
    return posts, total, err
}
func (r *PostRepository) Update(post *model.Post) error {
    return r.db.Save(post).Error
}

func (r *PostRepository) Delete(id uuid.UUID) error {
    return r.db.Delete(&model.Post{}, "id = ?", id).Error

  
}
    
