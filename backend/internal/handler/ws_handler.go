package handler

import (
	"net/http"

	"github.com/bloiss/devhelp/backend/internal/hub"
	"github.com/bloiss/devhelp/backend/internal/middleware"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Autoriser toutes les origines (à restreindre en production si besoin).
		return true
	},
}

// WSHandler gère les connexions WebSocket.
type WSHandler struct {
	hub    *hub.Hub
	secret string
}

func NewWSHandler(h *hub.Hub, secret string) *WSHandler {
	return &WSHandler{hub: h, secret: secret}
}

// Handle godoc
// GET /ws?token=xxx
// Upgrade HTTP → WebSocket, authentifie via le token en query param.
func (h *WSHandler) Handle(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing token"})
		return
	}

	claims, err := middleware.ParseAccessToken(token, h.secret)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		// Upgrade écrit lui-même la réponse d'erreur.
		return
	}

	client := hub.NewClient(h.hub, claims.UserID, conn)
	h.hub.Register(client)

	go client.WritePump()
	go client.ReadPump()
}
