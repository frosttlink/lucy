package ws

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/frostz/lucy/internal/llm"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for development
	},
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

type ClientMessage struct {
	Type           string `json:"type"`
	ConversationID string `json:"conversation_id,omitempty"`
	Content        string `json:"content,omitempty"`
	Subject        string `json:"subject,omitempty"`
}

type Hub struct {
	mu       sync.RWMutex
	clients  map[string]map[*websocket.Conn]bool // conversationID -> connections
	onMessage func(userID string, msg ClientMessage)
}

func NewHub() *Hub {
	return &Hub{
		clients: make(map[string]map[*websocket.Conn]bool),
	}
}

func (h *Hub) OnMessage(handler func(userID string, msg ClientMessage)) {
	h.onMessage = handler
}

func (h *Hub) HandleConnection(w http.ResponseWriter, r *http.Request, userID string) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}

	defer conn.Close()

	// Read messages from the client
	for {
		_, msgBytes, err := conn.ReadMessage()
		if err != nil {
			log.Printf("WebSocket read error: %v", err)
			break
		}

		var msg ClientMessage
		if err := json.Unmarshal(msgBytes, &msg); err != nil {
			log.Printf("WebSocket parse error: %v", err)
			continue
		}

		// Register client with conversation
		if msg.ConversationID != "" {
			h.mu.Lock()
			if h.clients[msg.ConversationID] == nil {
				h.clients[msg.ConversationID] = make(map[*websocket.Conn]bool)
			}
			h.clients[msg.ConversationID][conn] = true
			h.mu.Unlock()

			defer func() {
				h.mu.Lock()
				delete(h.clients[msg.ConversationID], conn)
				if len(h.clients[msg.ConversationID]) == 0 {
					delete(h.clients, msg.ConversationID)
				}
				h.mu.Unlock()
			}()
		}

		if h.onMessage != nil {
			h.onMessage(userID, msg)
		}
	}
}

func (h *Hub) SendToken(conversationID string, token string) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if conns, ok := h.clients[conversationID]; ok {
		msg, _ := json.Marshal(map[string]string{
			"type":    "token",
			"content": token,
		})
		for conn := range conns {
			conn.WriteMessage(websocket.TextMessage, msg)
		}
	}
}

func (h *Hub) SendToolCall(conversationID string, toolCalls []llm.ToolCall) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if conns, ok := h.clients[conversationID]; ok {
		msg, _ := json.Marshal(map[string]interface{}{
			"type":       "tool_call",
			"tool_calls": toolCalls,
		})
		for conn := range conns {
			conn.WriteMessage(websocket.TextMessage, msg)
		}
	}
}

func (h *Hub) SendDone(conversationID string) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if conns, ok := h.clients[conversationID]; ok {
		msg, _ := json.Marshal(map[string]string{
			"type": "done",
		})
		for conn := range conns {
			conn.WriteMessage(websocket.TextMessage, msg)
		}
	}
}

func (h *Hub) SendError(conversationID string, errMsg string) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if conns, ok := h.clients[conversationID]; ok {
		msg, _ := json.Marshal(map[string]string{
			"type":  "error",
			"error": errMsg,
		})
		for conn := range conns {
			conn.WriteMessage(websocket.TextMessage, msg)
		}
	}
}
