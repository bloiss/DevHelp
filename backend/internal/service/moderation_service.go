package service

import (
	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/bloiss/devhelp/backend/internal/repository"
	"github.com/google/uuid"
)

type ModerationItem struct {
	Type    string               `json:"type"`
	Post    *model.Post          `json:"post,omitempty"`
	Comment *model.Comment       `json:"comment,omitempty"`
	Log     *model.ModerationLog `json:"log,omitempty"`
}

type ModerationListResult struct {
	Items         []ModerationItem `json:"items"`
	TotalPosts    int64            `json:"total_posts"`
	TotalComments int64            `json:"total_comments"`
	Page          int              `json:"page"`
	PerPage       int              `json:"per_page"`
}

type ModerationStats struct {
	PendingModeration int64 `json:"pending_moderation"`
	Approved          int64 `json:"approved"`
	Flagged           int64 `json:"flagged"`
	Blocked           int64 `json:"blocked"`
	Total             int64 `json:"total"`
}

type ModerationService struct {
	postRepo    *repository.PostRepository
	commentRepo *repository.CommentRepository
	logRepo     *repository.ModerationLogRepository
}

func NewModerationService(
	postRepo *repository.PostRepository,
	commentRepo *repository.CommentRepository,
	logRepo *repository.ModerationLogRepository,
) *ModerationService {
	return &ModerationService{postRepo: postRepo, commentRepo: commentRepo, logRepo: logRepo}
}

func (s *ModerationService) List(status, contentType string, page, perPage int) (*ModerationListResult, error) {
	if perPage <= 0 {
		perPage = 20
	}
	if page <= 0 {
		page = 1
	}

	var statusPtr *model.ContentStatus
	if status != "" && status != "all" {
		cs := model.ContentStatus(status)
		statusPtr = &cs
	}

	result := &ModerationListResult{Page: page, PerPage: perPage}

	if contentType == "" || contentType == "all" || contentType == "post" {
		posts, total, err := s.postRepo.FindAll(repository.PostFilters{
			Status:      statusPtr,
			AllStatuses: statusPtr == nil,
			Page:        page,
			PageSize:    perPage,
		})
		if err != nil {
			return nil, err
		}
		result.TotalPosts = total

		if len(posts) > 0 {
			ids := make([]uuid.UUID, len(posts))
			for i, p := range posts {
				ids[i] = p.ID
			}
			logs := s.logRepo.FindLatestBatch(ids, "post")
			for i := range posts {
				item := ModerationItem{Type: "post"}
				p := posts[i]
				item.Post = &p
				if l, ok := logs[p.ID]; ok {
					item.Log = l
				}
				result.Items = append(result.Items, item)
			}
		}
	}

	if contentType == "" || contentType == "all" || contentType == "comment" {
		comments, total, err := s.commentRepo.FindFiltered(statusPtr, page, perPage)
		if err != nil {
			return nil, err
		}
		result.TotalComments = total

		if len(comments) > 0 {
			ids := make([]uuid.UUID, len(comments))
			for i, c := range comments {
				ids[i] = c.ID
			}
			logs := s.logRepo.FindLatestBatch(ids, "comment")
			for i := range comments {
				item := ModerationItem{Type: "comment"}
				c := comments[i]
				item.Comment = &c
				if l, ok := logs[c.ID]; ok {
					item.Log = l
				}
				result.Items = append(result.Items, item)
			}
		}
	}

	if result.Items == nil {
		result.Items = []ModerationItem{}
	}
	return result, nil
}

func (s *ModerationService) GetStats() (*ModerationStats, error) {
	raw, err := s.logRepo.Stats()
	if err != nil {
		return nil, err
	}
	stats := &ModerationStats{
		PendingModeration: raw["pending_moderation"],
		Approved:          raw["approved"],
		Flagged:           raw["flagged"],
		Blocked:           raw["blocked"],
	}
	stats.Total = stats.PendingModeration + stats.Approved + stats.Flagged + stats.Blocked
	return stats, nil
}

func (s *ModerationService) Review(contentID uuid.UUID, contentType, finalStatus string, adminID uuid.UUID) error {
	status := model.ContentStatus(finalStatus)
	if contentType == "post" {
		if err := s.postRepo.UpdateStatus(contentID, status); err != nil {
			return err
		}
	} else {
		if err := s.commentRepo.UpdateStatus(contentID, status); err != nil {
			return err
		}
	}
	_ = s.logRepo.UpdateReview(contentID, contentType, finalStatus, adminID)
	return nil
}
