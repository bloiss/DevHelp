package service

import (
	"errors"

	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/bloiss/devhelp/backend/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrPostNotFound   = errors.New("post not found")
	ErrPostForbidden  = errors.New("forbidden")
)

type PostService struct {
	repo         *repository.PostRepository
	categoryRepo *repository.CategoryRepository
}

func NewPostService(repo *repository.PostRepository, categoryRepo *repository.CategoryRepository) *PostService {
	return &PostService{repo: repo, categoryRepo: categoryRepo}
}

type PostListInput struct {
	CategoryID *uuid.UUID
	AuthorID   *uuid.UUID
	Status     *model.ContentStatus // admin uniquement
	Page       int
	PageSize   int
}

type PostListResult struct {
	Posts    []model.Post `json:"posts"`
	Total    int64        `json:"total"`
	Page     int          `json:"page"`
	PageSize int          `json:"page_size"`
}

func (s *PostService) List(input PostListInput) (*PostListResult, error) {
	posts, total, err := s.repo.FindAll(repository.PostFilters{
		CategoryID: input.CategoryID,
		AuthorID:   input.AuthorID,
		Status:     input.Status,
		Page:       input.Page,
		PageSize:   input.PageSize,
	})
	if err != nil {
		return nil, err
	}
	pageSize := input.PageSize
	if pageSize <= 0 {
		pageSize = 20
	}
	return &PostListResult{Posts: posts, Total: total, Page: input.Page, PageSize: pageSize}, nil
}

func (s *PostService) GetByID(id uuid.UUID, requesterRole string) (*model.Post, error) {
	post, err := s.repo.FindByID(id)
	if err != nil {
		return nil, ErrPostNotFound
	}
	// Utilisateurs non-admin ne voient pas les posts non approuvés (sauf le leur)
	if post.Status != model.StatusApproved && requesterRole != "admin" && requesterRole != "moderator" {
		return nil, ErrPostNotFound
	}
	return post, nil
}

type PostCreateInput struct {
	UserID     uuid.UUID
	CategoryID uuid.UUID
	Title      string
	Content    string
}

func (s *PostService) Create(input PostCreateInput) (*model.Post, error) {
	// Vérifie que la catégorie existe
	if _, err := s.categoryRepo.FindByID(input.CategoryID); err != nil {
		return nil, ErrCategoryNotFound
	}

	post := &model.Post{
		UserID:     input.UserID,
		CategoryID: input.CategoryID,
		Title:      input.Title,
		Content:    input.Content,
		Status:     model.StatusPendingModeration,
	}
	if err := s.repo.Create(post); err != nil {
		return nil, err
	}
	// Reload avec les relations
	return s.repo.FindByID(post.ID)
}

type PostUpdateInput struct {
	CategoryID *uuid.UUID
	Title      *string
	Content    *string
}

func (s *PostService) Update(id, requesterID uuid.UUID, requesterRole string, input PostUpdateInput) (*model.Post, error) {
	post, err := s.repo.FindByID(id)
	if err != nil {
		return nil, ErrPostNotFound
	}

	if post.UserID != requesterID && requesterRole != "admin" && requesterRole != "moderator" {
		return nil, ErrPostForbidden
	}

	if input.CategoryID != nil {
		if _, err := s.categoryRepo.FindByID(*input.CategoryID); err != nil {
			return nil, ErrCategoryNotFound
		}
		post.CategoryID = *input.CategoryID
	}
	if input.Title != nil {
		post.Title = *input.Title
	}
	if input.Content != nil {
		post.Content = *input.Content
	}

	if err := s.repo.Update(post); err != nil {
		return nil, err
	}
	return s.repo.FindByID(post.ID)
}

func (s *PostService) AdminUpdate(post *model.Post) error {
	return s.repo.Update(post)
}

func (s *PostService) Delete(id, requesterID uuid.UUID, requesterRole string) error {
	post, err := s.repo.FindByID(id)
	if err != nil {
		return ErrPostNotFound
	}
	if post.UserID != requesterID && requesterRole != "admin" && requesterRole != "moderator" {
		return ErrPostForbidden
	}
	return s.repo.Delete(id)
}
