// @title           DevHelp API
// @version         1.0
// @description     API REST du forum DevHelp — entraide Dev & IA.
// @termsOfService  http://swagger.io/terms/

// @contact.name   DevHelp Team
// @contact.url    https://github.com/bloiss/DevHelp

// @license.name  MIT
// @license.url   https://opensource.org/licenses/MIT

// @host      localhost:8080
// @BasePath  /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Entrez "Bearer <token>"

package main

import (
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/bloiss/devhelp/backend/internal/config"
	"github.com/bloiss/devhelp/backend/internal/database"
	"github.com/bloiss/devhelp/backend/internal/handler"
	"github.com/bloiss/devhelp/backend/internal/hub"
	"github.com/bloiss/devhelp/backend/internal/repository"
	"github.com/bloiss/devhelp/backend/internal/router"
	"github.com/bloiss/devhelp/backend/internal/service"
	"github.com/getsentry/sentry-go"
	"github.com/joho/godotenv"
)

// loadEnv remonte l'arborescence depuis le répertoire courant jusqu'à trouver un .env.
func loadEnv() {
	dir, _ := os.Getwd()
	for {
		path := filepath.Join(dir, ".env")
		if err := godotenv.Load(path); err == nil {
			return
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	log.Println("No .env file found, using environment variables")
}

func main() {
	if os.Getenv("ENV") != "production" {
		loadEnv()
	}

	cfg := config.Load()

	// ─── Sentry ───────────────────────────────────────────────────
	if cfg.SentryDSN != "" {
		if err := sentry.Init(sentry.ClientOptions{
			Dsn:              cfg.SentryDSN,
			Environment:      cfg.Env,
			TracesSampleRate: 0.2,
			EnableTracing:    true,
		}); err != nil {
			log.Printf("sentry init failed: %v", err)
		} else {
			log.Println("Sentry initialized")
		}
	}

	db := database.Connect(cfg.DatabaseURL)

	if err := database.Migrate(db); err != nil {
		log.Fatalf("migration failed: %v", err)
	}

	// ─── WebSocket Hub ────────────────────────────────────────────
	wsHub := hub.New()
	go wsHub.Run()

	// ─── Repositories ─────────────────────────────────────────────
	userRepo    := repository.NewUserRepository(db)
	categoryRepo := repository.NewCategoryRepository(db)
	postRepo    := repository.NewPostRepository(db)
	commentRepo := repository.NewCommentRepository(db)
	likeRepo    := repository.NewLikeRepository(db)
	notifRepo   := repository.NewNotificationRepository(db)
	pushRepo    := repository.NewPushRepository(db)
	followRepo  := repository.NewFollowRepository(db)
	messageRepo := repository.NewMessageRepository(db)
	reportRepo  := repository.NewReportRepository(db)

	moderationPub, err := service.NewModerationPublisher(cfg.RabbitMQURL, cfg.RabbitMQModerationQueue)
	if err != nil {
		log.Printf("warning: moderation publisher unavailable (RabbitMQ not connected): %v", err)
	} else {
		defer moderationPub.Close()
	}

	// ─── Services ─────────────────────────────────────────────────
	accessExpiry, _  := time.ParseDuration(cfg.JWTAccessExpiry)
	refreshExpiry, _ := time.ParseDuration(cfg.JWTRefreshExpiry)

	uploadService, err := service.NewUploadService(cfg)
	if err != nil {
		log.Printf("warning: upload service unavailable: %v", err)
	}

	authService    := service.NewAuthService(userRepo, cfg.JWTAccessSecret, cfg.JWTRefreshSecret, accessExpiry, refreshExpiry)
	emailService   := service.NewEmailService(cfg.ResendAPIKey, cfg.ResendFrom, cfg.AppURL)
	captchaService := service.NewCaptchaService(cfg.HCaptchaSecret)
	oauthService   := service.NewOAuthService(userRepo, authService,
		cfg.GoogleClientID, cfg.GoogleClientSecret, cfg.GoogleRedirectURL,
		cfg.GitHubClientID, cfg.GitHubClientSecret, cfg.GitHubRedirectURL,
	)
	categoryService := service.NewCategoryService(categoryRepo)
	postService     := service.NewPostService(postRepo, categoryRepo, userRepo, moderationPub)
	notifService    := service.NewNotificationService(notifRepo)
	pushService     := service.NewPushService(pushRepo, cfg.VAPIDPublicKey, cfg.VAPIDPrivateKey, cfg.VAPIDSubject)
	notifService.SetPushService(pushService)
	commentService  := service.NewCommentService(commentRepo, postRepo, notifService, wsHub, moderationPub)
	likeService     := service.NewLikeService(likeRepo, postRepo, userRepo, notifService, wsHub)
	followService   := service.NewFollowService(followRepo, userRepo, notifService, wsHub)
	messageService  := service.NewMessageService(messageRepo, wsHub, notifService, userRepo, followRepo)
	userService     := service.NewUserService(userRepo, postRepo, followRepo)
	reportService      := service.NewReportService(reportRepo)
	moderationService  := service.NewModerationService(postRepo, commentRepo)
	aiService          := service.NewAIService(os.Getenv("OLLAMA_BASE_URL"), os.Getenv("OLLAMA_MODEL"))

	// ─── Handlers ─────────────────────────────────────────────────
	reportHandler       := handler.NewReportHandler(reportService)
	moderationHandler   := handler.NewModerationHandler(moderationService)

	var uploadHandler *handler.UploadHandler
	if uploadService != nil {
		uploadHandler = handler.NewUploadHandler(uploadService)
	}

	authHandler         := handler.NewAuthHandler(authService, emailService, captchaService)
	oauthHandler        := handler.NewOAuthHandler(oauthService)
	categoryHandler     := handler.NewCategoryHandler(categoryService)
	postHandler         := handler.NewPostHandler(postService)
	commentHandler      := handler.NewCommentHandler(commentService)
	likeHandler         := handler.NewLikeHandler(likeService)
	userHandler         := handler.NewUserHandler(userService)
	adminHandler        := handler.NewAdminHandler(userService, postService)
	notificationHandler := handler.NewNotificationHandler(notifService, pushService)
	followHandler       := handler.NewFollowHandler(followService, userRepo)
	messageHandler      := handler.NewMessageHandler(messageService)
	wsHandler           := handler.NewWSHandler(wsHub, cfg.JWTAccessSecret, messageService)
	aiHandler           := handler.NewAIHandler(aiService)

	// ─── Router ───────────────────────────────────────────────────
	r := router.New(&router.Handlers{
		Auth:         authHandler,
		OAuth:        oauthHandler,
		Category:     categoryHandler,
		Post:         postHandler,
		Comment:      commentHandler,
		Like:         likeHandler,
		User:         userHandler,
		Admin:        adminHandler,
		Notification: notificationHandler,
		Follow:       followHandler,
		Message:      messageHandler,
		WS:           wsHandler,
		Upload:       uploadHandler,
		AI:           aiHandler,
		Report:       reportHandler,
		Moderation:   moderationHandler,
		JWTSecret:    cfg.JWTAccessSecret,
	})

	log.Printf("DevHelp API starting on :%s (env: %s)", cfg.Port, cfg.Env)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
