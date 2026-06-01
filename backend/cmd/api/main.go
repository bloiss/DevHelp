package main

import (
	"log"
	"os"
	"time"

	"github.com/bloiss/devhelp/backend/internal/config"
	"github.com/bloiss/devhelp/backend/internal/database"
	"github.com/bloiss/devhelp/backend/internal/handler"
	"github.com/bloiss/devhelp/backend/internal/repository"
	"github.com/bloiss/devhelp/backend/internal/router"
	"github.com/bloiss/devhelp/backend/internal/service"
	"github.com/joho/godotenv"
)

func main() {
	if os.Getenv("ENV") != "production" {
		if err := godotenv.Load("../.env"); err != nil {
			log.Println("No .env file found, using environment variables")
		}
	}

	cfg := config.Load()

	db := database.Connect(cfg.DatabaseURL)

	if err := database.Migrate(db); err != nil {
		log.Fatalf("migration failed: %v", err)
	}

	// ─── Repositories ─────────────────────────────────────────────
	userRepo := repository.NewUserRepository(db)
	categoryRepo := repository.NewCategoryRepository(db)
	postRepo := repository.NewPostRepository(db)
	commentRepo := repository.NewCommentRepository(db)
	likeRepo := repository.NewLikeRepository(db)
	notifRepo := repository.NewNotificationRepository(db)

	// ─── Services ─────────────────────────────────────────────────
	accessExpiry, _ := time.ParseDuration(cfg.JWTAccessExpiry)
	refreshExpiry, _ := time.ParseDuration(cfg.JWTRefreshExpiry)

	authService := service.NewAuthService(
		userRepo,
		cfg.JWTAccessSecret,
		cfg.JWTRefreshSecret,
		accessExpiry,
		refreshExpiry,
	)

	emailService := service.NewEmailService(cfg.ResendAPIKey, cfg.ResendFrom, cfg.AppURL)
	captchaService := service.NewCaptchaService(cfg.HCaptchaSecret)

	oauthService := service.NewOAuthService(
		userRepo,
		authService,
		cfg.GoogleClientID, cfg.GoogleClientSecret, cfg.GoogleRedirectURL,
		cfg.GitHubClientID, cfg.GitHubClientSecret, cfg.GitHubRedirectURL,
	)

	categoryService := service.NewCategoryService(categoryRepo)
	postService := service.NewPostService(postRepo, categoryRepo, userRepo)
	notifService := service.NewNotificationService(notifRepo)
	commentService := service.NewCommentService(commentRepo, postRepo, notifService)
	likeService := service.NewLikeService(likeRepo)
	userService := service.NewUserService(userRepo, postRepo)

	// ─── Handlers ─────────────────────────────────────────────────
	authHandler := handler.NewAuthHandler(authService, emailService, captchaService)
	oauthHandler := handler.NewOAuthHandler(oauthService)
	categoryHandler := handler.NewCategoryHandler(categoryService)
	postHandler := handler.NewPostHandler(postService)
	commentHandler := handler.NewCommentHandler(commentService)
	likeHandler := handler.NewLikeHandler(likeService)
	userHandler := handler.NewUserHandler(userService)
	adminHandler := handler.NewAdminHandler(userService, postService)
	notificationHandler := handler.NewNotificationHandler(notifService)

	// ─── Router ───────────────────────────────────────────────────
	r := router.New(&router.Handlers{
		Auth:      authHandler,
		OAuth:     oauthHandler,
		Category:  categoryHandler,
		Post:      postHandler,
		Comment:   commentHandler,
		Like:      likeHandler,
		User:         userHandler,
		Admin:        adminHandler,
		Notification: notificationHandler,
		JWTSecret:    cfg.JWTAccessSecret,
	})

	log.Printf("DevHelp API starting on :%s (env: %s)", cfg.Port, cfg.Env)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
