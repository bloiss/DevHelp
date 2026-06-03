package hub

import (
	"encoding/json"
	"sync"

	"github.com/google/uuid"
)

// Event représente un événement WebSocket envoyé à un client.
type Event struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

// Hub gère les connexions WebSocket actives.
type Hub struct {
	clients    map[uuid.UUID]*Client
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

// New crée un nouveau Hub.
func New() *Hub {
	return &Hub{
		clients:    make(map[uuid.UUID]*Client),
		register:   make(chan *Client, 32),
		unregister: make(chan *Client, 32),
	}
}

// Run démarre la boucle principale du hub (à lancer en goroutine).
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.UserID] = client
			h.mu.Unlock()

		case client := <-h.unregister:
			h.mu.Lock()
			if existing, ok := h.clients[client.UserID]; ok && existing == client {
				delete(h.clients, client.UserID)
				close(client.send)
			}
			h.mu.Unlock()
		}
	}
}

// Send envoie un événement à un utilisateur connecté.
// Silencieux si l'utilisateur n'est pas connecté.
func (h *Hub) Send(userID uuid.UUID, event Event) {
	h.mu.RLock()
	client, ok := h.clients[userID]
	h.mu.RUnlock()
	if !ok {
		return
	}

	data, err := json.Marshal(event)
	if err != nil {
		return
	}

	select {
	case client.send <- data:
	default:
		// Le buffer est plein, on abandonne silencieusement.
	}
}

// Register enregistre un client dans le hub.
func (h *Hub) Register(c *Client) {
	h.register <- c
}

// Unregister désenregistre un client du hub.
func (h *Hub) Unregister(c *Client) {
	h.unregister <- c
}
