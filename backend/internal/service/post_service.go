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
	userRepo     *repository.UserRepository
}

func NewPostService(repo *repository.PostRepository, categoryRepo *repository.CategoryRepository, userRepo *repository.UserRepository) *PostService {
	return &PostService{repo: repo, categoryRepo: categoryRepo, userRepo: userRepo}
}

type PostListInput struct {
	CategoryID     *uuid.UUID
	CategorySlug   *string
	AuthorID       *uuid.UUID
	AuthorUsername *string
	Status         *model.ContentStatus // admin uniquement
	AllStatuses    bool                 // admin : retourner tous les statuts
	Page           int
	PageSize       int
}

type PostListResult struct {
	Data     []model.Post `json:"data"`
	Total    int64        `json:"total"`
	Page     int          `json:"page"`
	PerPage  int          `json:"per_page"`
}

func (s *PostService) List(input PostListInput) (*PostListResult, error) {
	// Résoudre le slug catégorie en UUID si fourni
	if input.CategorySlug != nil && input.CategoryID == nil {
		cat, err := s.categoryRepo.FindBySlug(*input.CategorySlug)
		if err != nil {
			return nil, ErrCategoryNotFound
		}
		input.CategoryID = &cat.ID
	}

	// Résoudre le username auteur en UUID si fourni
	if input.AuthorUsername != nil && input.AuthorID == nil {
		user, err := s.userRepo.FindByUsername(*input.AuthorUsername)
		if err != nil {
			return nil, ErrUserNotFound
		}
		input.AuthorID = &user.ID
	}

	posts, total, err := s.repo.FindAll(repository.PostFilters{
		CategoryID:  input.CategoryID,
		AuthorID:    input.AuthorID,
		Status:      input.Status,
		AllStatuses: input.AllStatuses,
		Page:        input.Page,
		PageSize:    input.PageSize,
	})
	if err != nil {
		return nil, err
	}
	pageSize := input.PageSize
	if pageSize <= 0 {
		pageSize = 20
	}
	return &PostListResult{Data: posts, Total: total, Page: input.Page, PerPage: pageSize}, nil
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
