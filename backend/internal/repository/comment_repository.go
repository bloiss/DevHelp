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

func (r *CommentRepository) FindByPost(postID uuid.UUID, requesterID *uuid.UUID) ([]model.Comment, error) {
	var comments []model.Comment
	err := r.db.
		Preload("Author").
		Where("post_id = ?", postID).
		Order("created_at ASC").
		Find(&comments).Error
	if err != nil {
		return nil, err
	}
	r.enrichComments(comments, requesterID)
	return comments, nil
}

func (r *CommentRepository) FindByID(id uuid.UUID) (*model.Comment, error) {
	var comment model.Comment
	err := r.db.Preload("Author").First(&comment, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &comment, nil
}

func (r *CommentRepository) Create(c *model.Comment) error {
	return r.db.Create(c).Error
}

func (r *CommentRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.Comment{}, "id = ?", id).Error
}

func (r *CommentRepository) FindFiltered(status *model.ContentStatus, page, pageSize int) ([]model.Comment, int64, error) {
	if pageSize <= 0 {
		pageSize = 20
	}
	if page <= 0 {
		page = 1
	}
	base := r.db.Model(&model.Comment{})
	if status != nil {
		base = base.Where("status = ?", *status)
	}
	var total int64
	base.Count(&total)

	var comments []model.Comment
	q := r.db.Preload("Author")
	if status != nil {
		q = q.Where("status = ?", *status)
	}
	err := q.Order("created_at DESC").
		Limit(pageSize).
		Offset((page - 1) * pageSize).
		Find(&comments).Error
	return comments, total, err
}

func (r *CommentRepository) UpdateStatus(id uuid.UUID, status model.ContentStatus) error {
	return r.db.Table("comments").Where("id = ?", id).Update("status", status).Error
}

func (r *CommentRepository) enrichComments(comments []model.Comment, requesterID *uuid.UUID) {
	if len(comments) == 0 {
		return
	}
	ids := make([]uuid.UUID, len(comments))
	idx := make(map[uuid.UUID]int, len(comments))
	for i, c := range comments {
		ids[i] = c.ID
		idx[c.ID] = i
	}

	// Vote counts (séparés like / dislike)
	type voteRow struct {
		TargetID uuid.UUID
		Value    int
		Count    int64
	}
	var voteRows []voteRow
	r.db.Raw(
		`SELECT target_id, value, COUNT(*) AS count
		 FROM likes WHERE target_type = 'comment' AND target_id IN ?
		 GROUP BY target_id, value`, ids,
	).Scan(&voteRows)
	for _, row := range voteRows {
		if i, ok := idx[row.TargetID]; ok {
			if row.Value == 1 {
				comments[i].LikeCount = row.Count
			} else if row.Value == -1 {
				comments[i].DislikeCount = row.Count
			}
		}
	}

	if requesterID == nil {
		return
	}
	// User votes
	type userVoteRow struct {
		TargetID uuid.UUID
		Value    int
	}
	var userVoteRows []userVoteRow
	r.db.Raw(
		`SELECT target_id, value FROM likes
		 WHERE user_id = ? AND target_type = 'comment' AND target_id IN ?`,
		*requesterID, ids,
	).Scan(&userVoteRows)
	for _, row := range userVoteRows {
		if i, ok := idx[row.TargetID]; ok {
			v := row.Value
			comments[i].UserVote = &v
		}
	}
}
