package database

import (
	"log"

	"github.com/bloiss/devhelp/backend/internal/model"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect(dsn string) *gorm.DB {
	db, err := gorm.Open(postgres.New(postgres.Config{
		DSN:                  dsn,
		PreferSimpleProtocol: true, // désactive les prepared statements (évite "cached plan must not change result type")
	}), &gorm.Config{
		Logger:                 logger.Default.LogMode(logger.Info),
		PrepareStmt:            false,
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
		&model.Follow{},
		&model.Notification{},
		&model.NotificationPrefs{},
		&model.PushSubscription{},
		&model.Conversation{},
		&model.Message{},
		&model.MessageRead{},
		&model.UserPresence{},
		&model.ModerationLog{},
		&model.Report{},
	)
}
