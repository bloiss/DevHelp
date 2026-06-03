package repository

import (
	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type FollowRepository struct {
	db *gorm.DB
}

func NewFollowRepository(db *gorm.DB) *FollowRepository {
	return &FollowRepository{db: db}
}

func (r *FollowRepository) Follow(followerID, followingID uuid.UUID) error {
	f := &model.Follow{
		FollowerID:  followerID,
		FollowingID: followingID,
	}
	return r.db.
		Where(model.Follow{FollowerID: followerID, FollowingID: followingID}).
		FirstOrCreate(f).Error
}

func (r *FollowRepository) Unfollow(followerID, followingID uuid.UUID) error {
	return r.db.
		Where("follower_id = ? AND following_id = ?", followerID, followingID).
		Delete(&model.Follow{}).Error
}

func (r *FollowRepository) IsFollowing(followerID, followingID uuid.UUID) bool {
	var count int64
	r.db.Model(&model.Follow{}).
		Where("follower_id = ? AND following_id = ?", followerID, followingID).
		Count(&count)
	return count > 0
}

func (r *FollowRepository) CountFollowers(userID uuid.UUID) int64 {
	var count int64
	r.db.Model(&model.Follow{}).Where("following_id = ?", userID).Count(&count)
	return count
}

func (r *FollowRepository) CountFollowing(userID uuid.UUID) int64 {
	var count int64
	r.db.Model(&model.Follow{}).Where("follower_id = ?", userID).Count(&count)
	return count
}

func (r *FollowRepository) ListFollowers(userID uuid.UUID) ([]model.User, error) {
	var users []model.User
	err := r.db.
		Joins("JOIN follows ON follows.follower_id = users.id").
		Where("follows.following_id = ?", userID).
		Find(&users).Error
	return users, err
}

func (r *FollowRepository) ListFollowing(userID uuid.UUID) ([]model.User, error) {
	var users []model.User
	err := r.db.
		Joins("JOIN follows ON follows.following_id = users.id").
		Where("follows.follower_id = ?", userID).
		Find(&users).Error
	return users, err
}
