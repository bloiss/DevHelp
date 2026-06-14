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

func (r *CommentRepository) FindByStatus(status model.ContentStatus, page, pageSize int) ([]model.Comment, error) {
	if pageSize <= 0 {
		pageSize = 20
	}
	if page <= 0 {
		page = 1
	}
	var comments []model.Comment
	err := r.db.
		Preload("Author").
		Where("status = ?", status).
		Order("created_at DESC").
		Limit(pageSize).
		Offset((page - 1) * pageSize).
		Find(&comments).Error
	return comments, err
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

	// Vote counts
	type voteRow struct {
		TargetID uuid.UUID
		Total    int64
	}
	var voteRows []voteRow
	r.db.Raw(
		`SELECT target_id, COALESCE(SUM(value), 0) AS total
		 FROM likes WHERE target_type = 'comment' AND target_id IN ?
		 GROUP BY target_id`, ids,
	).Scan(&voteRows)
	for _, row := range voteRows {
		if i, ok := idx[row.TargetID]; ok {
			comments[i].VoteCount = row.Total
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
