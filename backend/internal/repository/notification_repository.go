package repository

import (
	"time"

	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type NotificationRepository struct {
	db *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) *NotificationRepository {
	return &NotificationRepository{db: db}
}

func (r *NotificationRepository) Create(n *model.Notification) error {
	return r.db.Create(n).Error
}

func (r *NotificationRepository) FindByUser(userID uuid.UUID) ([]model.Notification, error) {
	var notifs []model.Notification
	err := r.db.
		Where("user_id = ? AND deleted_at IS NULL AND is_archived = false", userID).
		Order("created_at DESC").Limit(50).Find(&notifs).Error
	return notifs, err
}

func (r *NotificationRepository) FindInbox(userID uuid.UUID) ([]model.Notification, error) {
	var notifs []model.Notification
	err := r.db.
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Order("created_at DESC").
		Limit(200).
		Find(&notifs).Error
	return notifs, err
}

func (r *NotificationRepository) UnreadCount(userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&model.Notification{}).
		Where("user_id = ? AND read = false AND deleted_at IS NULL AND is_archived = false", userID).
		Count(&count).Error
	return count, err
}

func (r *NotificationRepository) MarkRead(id uuid.UUID) error {
	return r.db.Model(&model.Notification{}).Where("id = ?", id).Update("read", true).Error
}

func (r *NotificationRepository) MarkAllRead(userID uuid.UUID) error {
	return r.db.Model(&model.Notification{}).
		Where("user_id = ? AND read = false", userID).
		Update("read", true).Error
}

func (r *NotificationRepository) MarkUnread(id uuid.UUID) error {
	return r.db.Model(&model.Notification{}).Where("id = ?", id).Update("read", false).Error
}

func (r *NotificationRepository) SetStar(id, userID uuid.UUID, starred bool) error {
	return r.db.Model(&model.Notification{}).
		Where("id = ? AND user_id = ?", id, userID).
		Update("is_starred", starred).Error
}

func (r *NotificationRepository) SetArchive(id, userID uuid.UUID, archived bool) error {
	return r.db.Model(&model.Notification{}).
		Where("id = ? AND user_id = ?", id, userID).
		Update("is_archived", archived).Error
}

func (r *NotificationRepository) SoftDelete(id, userID uuid.UUID) error {
	now := time.Now()
	return r.db.Model(&model.Notification{}).
		Where("id = ? AND user_id = ?", id, userID).
		Update("deleted_at", now).Error
}

func (r *NotificationRepository) SoftDeleteAll(userID uuid.UUID) error {
	now := time.Now()
	return r.db.Model(&model.Notification{}).
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Update("deleted_at", now).Error
}
