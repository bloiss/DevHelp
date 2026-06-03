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

	oauthService := service.NewOAuthService(
		userRepo,
		authService,
		cfg.GoogleClientID, cfg.GoogleClientSecret, cfg.GoogleRedirectURL,
		cfg.GitHubClientID, cfg.GitHubClientSecret, cfg.GitHubRedirectURL,
	)

	postService := service.NewPostService(postRepo)

	// ─── Handlers ─────────────────────────────────────────────────
	authHandler := handler.NewAuthHandler(authService)
	oauthHandler := handler.NewOAuthHandler(oauthService)
	postHandler := handler.NewPostHandler(postService)

	// ─── Router ───────────────────────────────────────────────────
	r := router.New(&router.Handlers{
		Auth:      authHandler,
		OAuth:     oauthHandler,
		JWTSecret: cfg.JWTAccessSecret,
		Post: postHandler,

	})

	log.Printf("DevHelp API starting on :%s (env: %s)", cfg.Port, cfg.Env)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
