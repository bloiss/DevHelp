package database

import (
	"log"

	"github.com/bloiss/devhelp/backend/internal/model"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect(dsn string) *gorm.DB {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("failed to get underlying sql.DB: %v", err)
	}
	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(10)

	log.Println("Database connected successfully")
	return db
}

func Migrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&model.User{},
		&model.OAuthProvider{},
		&model.RefreshToken{},
		&model.PasswordResetToken{},
		&model.Category{},
		&model.Post{},
		&model.PostImage{},
		&model.Comment{},
		&model.Like{},
		&model.Notification{},
		&model.NotificationPrefs{},
		&model.PushSubscription{},
		&model.Conversation{},
		&model.Message{},
		&model.ModerationLog{},
		&model.Report{},
	)
}
