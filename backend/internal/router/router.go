package router

import (
	"time"

	_ "github.com/bloiss/devhelp/backend/docs"
	sentrygin "github.com/getsentry/sentry-go/gin"
	"github.com/bloiss/devhelp/backend/internal/handler"
	"github.com/bloiss/devhelp/backend/internal/middleware"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

type Handlers struct {
	Auth         *handler.AuthHandler
	OAuth        *handler.OAuthHandler
	Category     *handler.CategoryHandler
	Post         *handler.PostHandler
	Comment      *handler.CommentHandler
	Like         *handler.LikeHandler
	User         *handler.UserHandler
	Admin        *handler.AdminHandler
	Notification *handler.NotificationHandler
	Follow       *handler.FollowHandler
	Message      *handler.MessageHandler
	WS           *handler.WSHandler
	Upload       *handler.UploadHandler
	AI           *handler.AIHandler
	JWTSecret    string
}

func New(h *Handlers) *gin.Engine {
	r := gin.Default()

	r.Use(sentrygin.New(sentrygin.Options{Repanic: true}))
	r.Use(middleware.CORS())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// ─── Swagger UI ───────────────────────────────────────────────
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

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

	// ─── WebSocket (auth via query param) ─────────
	r.GET("/ws", h.WS.Handle)

	// ─── Lecture publique ──────────────────────────
	api.GET("/categories", h.Category.List)
	api.GET("/categories/:slug", h.Category.GetBySlug)
	api.GET("/posts", middleware.OptionalAuth(h.JWTSecret), h.Post.List)
	api.GET("/posts/:id", middleware.OptionalAuth(h.JWTSecret), h.Post.Get)
	api.GET("/posts/:id/comments", middleware.OptionalAuth(h.JWTSecret), h.Comment.List)
	api.GET("/users/search", h.User.SearchUsers)
	api.GET("/users/:username", middleware.OptionalAuth(h.JWTSecret), h.User.GetProfile)
	api.GET("/users/:username/followers", h.Follow.Followers)
	api.GET("/users/:username/following", h.Follow.Following)

	// ─── Routes protégées (JWT requis) ────────────
	protected := api.Group("/")
	protected.Use(middleware.AuthRequired(h.JWTSecret))
	{
		// Auth
		protected.GET("/auth/me", h.Auth.Me)
		protected.POST("/auth/set-password", h.Auth.SetPassword)

		// Upload
		if h.Upload != nil {
			protected.POST("/upload", h.Upload.UploadImage)
		}

		// AI
		protected.POST("/ai/assist", middleware.RateLimit(10, time.Minute), h.AI.Assist)

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

		// Follow
		protected.POST("/users/:username/follow", h.Follow.Follow)
		protected.DELETE("/users/:username/follow", h.Follow.Unfollow)

		// Conversations / Messages
		protected.GET("/conversations", h.Message.List)
		protected.POST("/conversations", h.Message.Open)
		protected.GET("/conversations/unread-count", h.Message.UnreadCount)
		protected.GET("/conversations/:id/messages", h.Message.GetMessages)
		protected.POST("/conversations/:id/messages", h.Message.Send)
		protected.POST("/conversations/:id/accept", h.Message.Accept)
		protected.POST("/conversations/:id/read", h.Message.MarkRead)
		protected.GET("/conversations/:id/presence", h.Message.GetPresence)

		// Notifications
		protected.GET("/notifications", h.Notification.List)
		protected.GET("/notifications/inbox", h.Notification.Inbox)
		protected.GET("/notifications/unread-count", h.Notification.UnreadCount)
		protected.PATCH("/notifications/read-all", h.Notification.MarkAllRead)
		protected.GET("/notifications/prefs", h.Notification.GetPrefs)
		protected.PATCH("/notifications/prefs", h.Notification.UpdatePrefs)
		protected.PATCH("/notifications/:id/read", h.Notification.MarkRead)
		protected.PATCH("/notifications/:id/unread", h.Notification.MarkUnread)
		protected.PATCH("/notifications/:id/star", h.Notification.Star)
		protected.PATCH("/notifications/:id/archive", h.Notification.Archive)
		protected.DELETE("/notifications/:id", h.Notification.Delete)

		// Push subscriptions
		protected.GET("/push/vapid-key", h.Notification.GetVAPIDKey)
		protected.POST("/push/subscriptions", h.Notification.SavePushSub)
		protected.DELETE("/push/subscriptions", h.Notification.DeletePushSub)
	}

	// ─── Admin + modérateur ───────────────────────
	admin := protected.Group("/admin")
	admin.Use(middleware.RequireRole("admin", "moderator"))
	{
		admin.GET("/users", h.Admin.ListUsers)
		admin.GET("/posts", h.Admin.ListPosts)
	}

	// ─── Admin seul ───────────────────────────────
	adminOnly := protected.Group("/admin")
	adminOnly.Use(middleware.RequireRole("admin"))
	{
		adminOnly.POST("/categories", h.Category.Create)
		adminOnly.PUT("/categories/:id", h.Category.Update)
		adminOnly.DELETE("/categories/:id", h.Category.Delete)
		adminOnly.PATCH("/posts/:id/status", h.Post.SetStatus)
		adminOnly.PATCH("/users/:id/role", h.Admin.SetUserRole)
	}

	return r
}
