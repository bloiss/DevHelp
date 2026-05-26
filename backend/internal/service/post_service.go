package service

import (
	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/bloiss/devhelp/backend/internal/repository"
	"github.com/google/uuid"
	"errors"
)
type PostService struct {
	postRepo *repository.PostRepository
}

func NewPostService(postRepo *repository.PostRepository) *PostService {
	return &PostService{postRepo: postRepo}
    
}
func (s *PostService) Create(userID uuid.UUID, title, content string, categoryID uuid.UUID) (*model.Post, error) {
    if title == "" {
        return nil, errors.New("title is required")
    }

    post := &model.Post{
        ID:         uuid.New(),
        UserID:     userID,
        Title:      title,
        Content:    content,
        CategoryID: categoryID,
        Status:     model.StatusPendingModeration,
    }

    err := s.postRepo.Create(post)
    if err != nil {
        return nil, err
    }
    return post, nil
}
func(s *PostService) GetByID(id uuid.UUID)(*model.Post,error){
	return s.postRepo.FindByID(id)
}
func(s *PostService) List(limit, offset int)([]model.Post, int64, error){
	return s.postRepo.FindAll(limit, offset)
}
func (s *PostService) Update(id, userID uuid.UUID, title, content string) (*model.Post, error){
post, err := s.postRepo.FindByID(id)
if err != nil {
    return nil, err
}
if post.UserID != userID {
    return nil, errors.New("not allowed")
}
post.Title = title
post.Content = content
err = s.postRepo.Update(post)
if err != nil {
    return nil, err
}
return post, nil
}
func (s *PostService) Delete(id, userID uuid.UUID) error {
    post, err := s.postRepo.FindByID(id)
if err != nil {
   return err} 
if post.UserID != userID { return errors.New("not allowed") }
return s.postRepo.Delete(id)  
}
