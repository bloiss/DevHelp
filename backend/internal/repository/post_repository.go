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
	CategoryID  *uuid.UUID
	AuthorID    *uuid.UUID
	Status      *model.ContentStatus
	AllStatuses bool
	RequesterID *uuid.UUID // pour populer user_vote
	Page        int
	PageSize    int
	Search      string
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
	} else if !f.AllStatuses {
		q = q.Where("status = ? AND is_hidden = false", model.StatusApproved)
	}
	if f.Search != "" {
    q = q.Where("title ILIKE ? OR content ILIKE ?",
        "%"+f.Search+"%", "%"+f.Search+"%")
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
	if err := q.Order("created_at DESC").Limit(f.PageSize).Offset(offset).Find(&posts).Error; err != nil {
		return nil, 0, err
	}

	r.enrichPosts(posts, f.RequesterID)
	return posts, total, nil
}

func (r *PostRepository) FindByID(id uuid.UUID, requesterID *uuid.UUID) (*model.Post, error) {
	var post model.Post
	err := r.db.
		Preload("Author").
		Preload("Category").
		Preload("Images").
		First(&post, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	posts := []model.Post{post}
	r.enrichPosts(posts, requesterID)
	return &posts[0], nil
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

func (r *PostRepository) UpdateStatus(id uuid.UUID, status model.ContentStatus) error {
	return r.db.Table("posts").Where("id = ?", id).Update("status", status).Error
}

// enrichPosts remplit VoteCount, CommentCount et UserVote en 3 requêtes batch.
func (r *PostRepository) enrichPosts(posts []model.Post, requesterID *uuid.UUID) {
	if len(posts) == 0 {
		return
	}

	ids := make([]uuid.UUID, len(posts))
	idx := make(map[uuid.UUID]int, len(posts))
	for i, p := range posts {
		ids[i] = p.ID
		idx[p.ID] = i
	}

	// ── Vote counts ────────────────────────────────────────────
	type voteRow struct {
		TargetID uuid.UUID
		Total    int64
	}
	var voteRows []voteRow
	r.db.Raw(
		`SELECT target_id, COALESCE(SUM(value), 0) AS total
		 FROM likes WHERE target_type = 'post' AND target_id IN ?
		 GROUP BY target_id`, ids,
	).Scan(&voteRows)
	for _, row := range voteRows {
		if i, ok := idx[row.TargetID]; ok {
			posts[i].VoteCount = row.Total
		}
	}

	// ── Comment counts ─────────────────────────────────────────
	type commentRow struct {
		PostID uuid.UUID
		Total  int64
	}
	var commentRows []commentRow
	r.db.Raw(
		`SELECT post_id, COUNT(*) AS total
		 FROM comments WHERE post_id IN ?
		 GROUP BY post_id`, ids,
	).Scan(&commentRows)
	for _, row := range commentRows {
		if i, ok := idx[row.PostID]; ok {
			posts[i].CommentCount = row.Total
		}
	}

	// ── UserVote (si connecté) ─────────────────────────────────
	if requesterID == nil {
		return
	}
	type userVoteRow struct {
		TargetID uuid.UUID
		Value    int
	}
	var userVoteRows []userVoteRow
	r.db.Raw(
		`SELECT target_id, value
		 FROM likes WHERE user_id = ? AND target_type = 'post' AND target_id IN ?`,
		*requesterID, ids,
	).Scan(&userVoteRows)
	for _, row := range userVoteRows {
		if i, ok := idx[row.TargetID]; ok {
			v := row.Value
			posts[i].UserVote = &v
		}
	}
}
