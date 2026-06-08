package repository

import (
	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type PushRepository struct {
	db *gorm.DB
}

func NewPushRepository(db *gorm.DB) *PushRepository {
	return &PushRepository{db: db}
}

// ─── Push Subscriptions ──────────────────────────────────────────────────────

func (r *PushRepository) Save(sub *model.PushSubscription) error {
	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "endpoint"}},
		DoUpdates: clause.AssignmentColumns([]string{"p256dh_key", "auth_key"}),
	}).Create(sub).Error
}

func (r *PushRepository) DeleteByEndpoint(userID uuid.UUID, endpoint string) error {
	return r.db.
		Where("user_id = ? AND endpoint = ?", userID, endpoint).
		Delete(&model.PushSubscription{}).Error
}

func (r *PushRepository) FindByUser(userID uuid.UUID) []model.PushSubscription {
	var subs []model.PushSubscription
	r.db.Where("user_id = ?", userID).Find(&subs)
	return subs
}

// ─── Notification Prefs ──────────────────────────────────────────────────────

func (r *PushRepository) GetPrefs(userID uuid.UUID) *model.NotificationPrefs {
	var prefs model.NotificationPrefs
	if err := r.db.Where("user_id = ?", userID).First(&prefs).Error; err != nil {
		// Pas encore de prefs → retourner les valeurs par défaut
		return &model.NotificationPrefs{
			UserID:          userID,
			PushEnabled:     true,
			NotifyOnComment: true,
			NotifyOnLike:    true,
			NotifyOnMessage: true,
		}
	}
	return &prefs
}

func (r *PushRepository) UpsertPrefs(prefs *model.NotificationPrefs) error {
	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"push_enabled", "notify_on_comment", "notify_on_like", "notify_on_message"}),
	}).Create(prefs).Error
}
