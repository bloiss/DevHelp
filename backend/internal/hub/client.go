package hub

import (
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 4096 // augmenté pour les événements entrants
)

// IncomingHandler est appelé à chaque message reçu du client.
type IncomingHandler func(userID uuid.UUID, data []byte)

// Client représente une connexion WebSocket d'un utilisateur.
type Client struct {
	Hub    *Hub
	UserID uuid.UUID
	conn   *websocket.Conn
	send   chan []byte
	onMsg  IncomingHandler // handler pour les messages client → serveur
}

// NewClient crée un nouveau Client.
func NewClient(h *Hub, userID uuid.UUID, conn *websocket.Conn, onMsg IncomingHandler) *Client {
	return &Client{
		Hub:    h,
		UserID: userID,
		conn:   conn,
		send:   make(chan []byte, 256),
		onMsg:  onMsg,
	}
}

// ReadPump lit les messages entrants et appelle onMsg pour chaque message valide.
func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister(c)
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	_ = c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		return c.conn.SetReadDeadline(time.Now().Add(pongWait))
	})

	for {
		_, data, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("ws read error for user %s: %v", c.UserID, err)
			}
			break
		}
		if c.onMsg != nil && len(data) > 0 {
			c.onMsg(c.UserID, data)
		}
	}
}

// WritePump écrit les messages en attente dans send vers la connexion WebSocket.
func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				_ = c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}

		case <-ticker.C:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
