package handler

import (
	"encoding/json"
	"net/http"

	"github.com/bloiss/devhelp/backend/internal/hub"
	"github.com/bloiss/devhelp/backend/internal/middleware"
	"github.com/bloiss/devhelp/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

// WSHandler gère les connexions WebSocket.
type WSHandler struct {
	hub    *hub.Hub
	secret string
	msgSvc *service.MessageService
}

func NewWSHandler(h *hub.Hub, secret string, msgSvc *service.MessageService) *WSHandler {
	return &WSHandler{hub: h, secret: secret, msgSvc: msgSvc}
}

// Handle — GET /ws?token=xxx
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
		return
	}

	userID := claims.UserID
	client := hub.NewClient(h.hub, userID, conn, func(uid uuid.UUID, data []byte) {
		h.handleIncoming(uid, data)
	})
	h.hub.Register(client)

	go client.WritePump()
	go client.ReadPump()
}

// incomingEvent est la structure d'un message client → serveur.
type incomingEvent struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

// handleIncoming traite les messages reçus du client via WebSocket.
func (h *WSHandler) handleIncoming(userID uuid.UUID, data []byte) {
	var ev incomingEvent
	if err := json.Unmarshal(data, &ev); err != nil {
		return
	}

	switch ev.Type {

	// ─── Indicateur de frappe ────────────────────────────────────────
	case "typing_start", "typing_stop":
		var p struct {
			ConvID string `json:"conv_id"`
		}
		if err := json.Unmarshal(ev.Payload, &p); err != nil {
			return
		}
		convID, err := uuid.Parse(p.ConvID)
		if err != nil {
			return
		}
		h.msgSvc.RelayTyping(userID, convID, ev.Type == "typing_start")

	// ─── Accusé de lecture ───────────────────────────────────────────
	case "mark_read":
		var p struct {
			ConvID string `json:"conv_id"`
		}
		if err := json.Unmarshal(ev.Payload, &p); err != nil {
			return
		}
		convID, err := uuid.Parse(p.ConvID)
		if err != nil {
			return
		}
		h.msgSvc.MarkRead(userID, convID)

	// ─── Mise à jour de présence ─────────────────────────────────────
	case "presence_update":
		var p struct {
			ConvID *string `json:"conv_id"`
		}
		if err := json.Unmarshal(ev.Payload, &p); err != nil {
			return
		}
		var convID *uuid.UUID
		if p.ConvID != nil && *p.ConvID != "" {
			id, err := uuid.Parse(*p.ConvID)
			if err == nil {
				convID = &id
			}
		}
		h.msgSvc.UpdatePresence(userID, convID)
	}
}
