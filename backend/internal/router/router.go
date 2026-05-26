package router

import (
	"time"

	"github.com/bloiss/devhelp/backend/internal/handler"
	"github.com/bloiss/devhelp/backend/internal/middleware"
	"github.com/gin-gonic/gin"
)

type Handlers struct {
	Auth      *handler.AuthHandler
	OAuth     *handler.OAuthHandler
	Category  *handler.CategoryHandler
	Post      *handler.PostHandler
	JWTSecret string
}

func New(h *Handlers) *gin.Engine {
	r := gin.Default()

	// ─── Middlewares globaux ──────────────────
	r.Use(middleware.CORS())

	// ─── Health check ─────────────────────────
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// ─── API v1 ───────────────────────────────
	api := r.Group("/api/v1")

	// Routes publiques avec rate limiting strict
	auth := api.Group("/auth")
	auth.Use(middleware.RateLimit(20, time.Minute))
	{
		// Email / mot de passe
		auth.POST("/register", h.Auth.Register)
		auth.POST("/login", h.Auth.Login)
		auth.POST("/refresh", h.Auth.Refresh)
		auth.POST("/forgot-password", h.Auth.ForgotPassword)
		auth.POST("/reset-password", h.Auth.ResetPassword)
		auth.POST("/logout", h.Auth.Logout)

		// OAuth
		auth.GET("/google", h.OAuth.GoogleLogin)
		auth.GET("/google/callback", h.OAuth.GoogleCallback)
		auth.GET("/github", h.OAuth.GitHubLogin)
		auth.GET("/github/callback", h.OAuth.GitHubCallback)
	}

	// Routes protégées (JWT requis)
	protected := api.Group("/")
	protected.Use(middleware.AuthRequired(h.JWTSecret))
	{
		// Auth (nécessite JWT)
		protected.POST("/auth/set-password", h.Auth.SetPassword)

		// Posts
		protected.POST("/posts", h.Post.Create)
		protected.PUT("/posts/:id", h.Post.Update)
		protected.DELETE("/posts/:id", h.Post.Delete)

		// Comments
		// protected.POST("/posts/:id/comments", h.Comment.Create)

		// Likes
		// protected.POST("/posts/:id/like", h.Like.Toggle)

		// Upload
		// protected.POST("/upload", middleware.RateLimit(10, time.Minute), h.Upload.Image)

		// Profile
		// protected.GET("/users/:id", h.User.Profile)
		// protected.PATCH("/users/me", h.User.UpdateMe)

		// Notifications
		// protected.GET("/notifications", h.Notification.List)
		// protected.PATCH("/notifications/read", h.Notification.MarkRead)

		// Messages
		// protected.GET("/conversations", h.Message.ListConversations)
		// protected.POST("/conversations", h.Message.CreateConversation)
		// protected.GET("/conversations/:id/messages", h.Message.GetMessages)

		// Search
		// protected.GET("/search", h.Search.Semantic)

		// AI
		// protected.POST("/ai/assist", middleware.RateLimit(10, time.Minute), h.AI.Assist)
	}

	// Routes admin/modérateur
	admin := protected.Group("/admin")
	admin.Use(middleware.RequireRole("admin", "moderator"))
	{
		// admin.GET("/users", h.Admin.ListUsers)
		// admin.PATCH("/users/:id/role", h.Admin.UpdateRole)
		// admin.GET("/reports", h.Admin.ListReports)
		// admin.PATCH("/reports/:id", h.Admin.ResolveReport)
		// admin.GET("/moderation", h.Admin.ListModerationLogs)
		// admin.PATCH("/moderation/:id", h.Admin.OverrideVerdict)
	}

	// Catégories (lecture publique)
	api.GET("/categories", h.Category.List)
	api.GET("/categories/:slug", h.Category.GetBySlug)

	// Posts (lecture publique)
	api.GET("/posts", h.Post.List)
	api.GET("/posts/:id", h.Post.Get)

	// Routes admin seul
	adminOnly := protected.Group("/admin")
	adminOnly.Use(middleware.RequireRole("admin"))
	{
		adminOnly.POST("/categories", h.Category.Create)
		adminOnly.PUT("/categories/:id", h.Category.Update)
		adminOnly.DELETE("/categories/:id", h.Category.Delete)
		adminOnly.PATCH("/posts/:id/status", h.Post.SetStatus)
	}

	return r
}
