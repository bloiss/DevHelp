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
		if err := godotenv.Load("../../.env"); err != nil {
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
	postService := service.NewPostService(postRepo, categoryRepo)

	// ─── Handlers ─────────────────────────────────────────────────
	authHandler := handler.NewAuthHandler(authService, emailService, captchaService)
	oauthHandler := handler.NewOAuthHandler(oauthService)
	categoryHandler := handler.NewCategoryHandler(categoryService)
	postHandler := handler.NewPostHandler(postService)

	// ─── Router ───────────────────────────────────────────────────
	r := router.New(&router.Handlers{
		Auth:      authHandler,
		OAuth:     oauthHandler,
		Category:  categoryHandler,
		Post:      postHandler,
		JWTSecret: cfg.JWTAccessSecret,
	})

	log.Printf("DevHelp API starting on :%s (env: %s)", cfg.Port, cfg.Env)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
