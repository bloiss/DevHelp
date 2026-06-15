package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type StatsHandler struct {
	db *gorm.DB
}

func NewStatsHandler(db *gorm.DB) *StatsHandler {
	return &StatsHandler{db: db}
}

func (h *StatsHandler) Get(c *gin.Context) {
	var users, posts, comments, categories int64

	h.db.Raw("SELECT COUNT(*) FROM users").Scan(&users)
	h.db.Raw("SELECT COUNT(*) FROM posts WHERE deleted_at IS NULL OR deleted_at > NOW()").Scan(&posts)
	h.db.Raw("SELECT COUNT(*) FROM comments").Scan(&comments)
	h.db.Raw("SELECT COUNT(*) FROM categories").Scan(&categories)

	c.JSON(http.StatusOK, gin.H{
		"users":      users,
		"posts":      posts,
		"comments":   comments,
		"categories": categories,
	})
}
