package service

import (
	"errors"
	"regexp"
	"strings"

	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/bloiss/devhelp/backend/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrCategoryNotFound      = errors.New("category not found")
	ErrCategoryNameExists    = errors.New("category name already exists")
	ErrCategorySlugExists    = errors.New("category slug already exists")
	ErrCategoryInvalidPillar = errors.New("pillar must be 'dev' or 'ai'")
)

var slugRe = regexp.MustCompile(`[^a-z0-9]+`)

type CategoryService struct {
	repo *repository.CategoryRepository
}

func NewCategoryService(repo *repository.CategoryRepository) *CategoryService {
	return &CategoryService{repo: repo}
}

type CategoryInput struct {
	Name        string
	Description *string
	Pillar      *string
}

func slugify(s string) string {
	s = strings.ToLower(s)
	s = slugRe.ReplaceAllString(s, "-")
	return strings.Trim(s, "-")
}

func (s *CategoryService) List() ([]model.Category, error) {
	return s.repo.FindAll()
}

func (s *CategoryService) GetBySlug(slug string) (*model.Category, error) {
	cat, err := s.repo.FindBySlug(slug)
	if err != nil {
		return nil, ErrCategoryNotFound
	}
	return cat, nil
}

func (s *CategoryService) Create(input CategoryInput) (*model.Category, error) {
	if input.Pillar != nil && *input.Pillar != "dev" && *input.Pillar != "ai" {
		return nil, ErrCategoryInvalidPillar
	}

	exists, _ := s.repo.ExistsByName(input.Name)
	if exists {
		return nil, ErrCategoryNameExists
	}

	slug := slugify(input.Name)
	slugExists, _ := s.repo.ExistsBySlug(slug)
	if slugExists {
		return nil, ErrCategorySlugExists
	}

	cat := &model.Category{
		Name:        input.Name,
		Slug:        slug,
		Description: input.Description,
		Pillar:      input.Pillar,
	}
	if err := s.repo.Create(cat); err != nil {
		return nil, err
	}
	return cat, nil
}

func (s *CategoryService) Update(id uuid.UUID, input CategoryInput) (*model.Category, error) {
	cat, err := s.repo.FindByID(id)
	if err != nil {
		return nil, ErrCategoryNotFound
	}

	if input.Pillar != nil && *input.Pillar != "dev" && *input.Pillar != "ai" {
		return nil, ErrCategoryInvalidPillar
	}

	// Vérifie unicité seulement si le nom change
	if input.Name != cat.Name {
		exists, _ := s.repo.ExistsByName(input.Name)
		if exists {
			return nil, ErrCategoryNameExists
		}
		newSlug := slugify(input.Name)
		if newSlug != cat.Slug {
			slugExists, _ := s.repo.ExistsBySlug(newSlug)
			if slugExists {
				return nil, ErrCategorySlugExists
			}
			cat.Slug = newSlug
		}
		cat.Name = input.Name
	}

	cat.Description = input.Description
	cat.Pillar = input.Pillar

	if err := s.repo.Update(cat); err != nil {
		return nil, err
	}
	return cat, nil
}

func (s *CategoryService) Delete(id uuid.UUID) error {
	if _, err := s.repo.FindByID(id); err != nil {
		return ErrCategoryNotFound
	}
	return s.repo.Delete(id)
}
