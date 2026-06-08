package middleware

import (
	"os"

	"github.com/gin-gonic/gin"
)

func CORS() gin.HandlerFunc {
	// Origines autorisées : APP_URL en prod, localhost dev en fallback
	appURL := os.Getenv("APP_URL")
	if appURL == "" {
		appURL = "http://localhost:5173"
	}

	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")

		// Autoriser l'origine de la requête si elle correspond à l'app ou localhost dev
		allowed := ""
		if origin == appURL ||
			origin == "http://localhost:5173" ||
			origin == "http://localhost:3000" ||
			origin == "http://127.0.0.1:5173" {
			allowed = origin
		}

		if allowed != "" {
			c.Header("Access-Control-Allow-Origin", allowed)
			c.Header("Access-Control-Allow-Credentials", "true")
		}

		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")
		c.Header("Access-Control-Expose-Headers", "Content-Length")
		c.Header("Vary", "Origin")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}
