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
	Comment   *handler.CommentHandler
	Like      *handler.LikeHandler
	User      *handler.UserHandler
	JWTSecret string
}

func New(h *Handlers) *gin.Engine {
	r := gin.Default()

	r.Use(middleware.CORS())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	api := r.Group("/api/v1")

	// ─── Auth (public, rate limited) ──────────────
	auth := api.Group("/auth")
	auth.Use(middleware.RateLimit(20, time.Minute))
	{
		auth.POST("/register", h.Auth.Register)
		auth.POST("/login", h.Auth.Login)
		auth.POST("/refresh", h.Auth.Refresh)
		auth.POST("/forgot-password", h.Auth.ForgotPassword)
		auth.POST("/reset-password", h.Auth.ResetPassword)
		auth.POST("/logout", h.Auth.Logout)
		auth.GET("/google", h.OAuth.GoogleLogin)
		auth.GET("/google/callback", h.OAuth.GoogleCallback)
		auth.GET("/github", h.OAuth.GitHubLogin)
		auth.GET("/github/callback", h.OAuth.GitHubCallback)
	}

	// ─── Lecture publique ──────────────────────────
	api.GET("/categories", h.Category.List)
	api.GET("/categories/:slug", h.Category.GetBySlug)
	api.GET("/posts", h.Post.List)
	api.GET("/posts/:id", h.Post.Get)
	api.GET("/posts/:id/comments", h.Comment.List)
	api.GET("/users/:username", h.User.GetProfile)

	// ─── Routes protégées (JWT requis) ────────────
	protected := api.Group("/")
	protected.Use(middleware.AuthRequired(h.JWTSecret))
	{
		// Auth
		protected.GET("/auth/me", h.Auth.Me)
		protected.POST("/auth/set-password", h.Auth.SetPassword)

		// Posts
		protected.POST("/posts", h.Post.Create)
		protected.PUT("/posts/:id", h.Post.Update)
		protected.DELETE("/posts/:id", h.Post.Delete)

		// Comments
		protected.POST("/posts/:id/comments", h.Comment.Create)
		protected.DELETE("/posts/:id/comments/:commentId", h.Comment.Delete)

		// Likes
		protected.POST("/posts/:id/like", h.Like.VotePost)
		protected.POST("/posts/:id/comments/:commentId/like", h.Like.VoteComment)

		// Profil utilisateur
		protected.PATCH("/users/me", h.User.UpdateMe)
	}

	// ─── Admin + modérateur ───────────────────────
	admin := protected.Group("/admin")
	admin.Use(middleware.RequireRole("admin", "moderator"))
	{
		// (routes modération à venir)
	}

	// ─── Admin seul ───────────────────────────────
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
