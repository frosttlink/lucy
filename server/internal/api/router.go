package api

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/frostz/lucy/internal/auth"
	"github.com/frostz/lucy/internal/chat"
	"github.com/frostz/lucy/internal/db"
	"github.com/frostz/lucy/internal/memory"
	"github.com/frostz/lucy/internal/ws"
)

type AppDependencies struct {
	DB          *db.DB
	JWTManager  *auth.JWTManager
	AuthHandler *auth.Handler
	ChatService *chat.Service
	MemorySvc   *memory.Service
	WSHub       *ws.Hub
}

func NewRouter(deps *AppDependencies) http.Handler {
	r := chi.NewRouter()

	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(chimw.Timeout(120 * time.Second))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok", "service": "lucy"})
	})

	r.Route("/auth", func(r chi.Router) {
		r.Post("/register", deps.AuthHandler.Register)
		r.Post("/login", deps.AuthHandler.Login)
		r.Post("/refresh", deps.AuthHandler.Refresh)
	})

	r.Route("/api", func(r chi.Router) {
		r.Use(auth.Middleware(deps.JWTManager))

		r.Get("/me", handleGetMe(deps.DB))
		r.Patch("/me", handleUpdateMe(deps.DB))

		r.Route("/chat", func(r chi.Router) {
			r.Get("/conversations", handleListConversations(deps.ChatService))
			r.Post("/conversations", handleCreateConversation(deps.ChatService))
			r.Get("/conversations/{id}/messages", handleGetMessages(deps.ChatService))
		})

		r.Get("/chat/conversations/{id}/stream", func(w http.ResponseWriter, r *http.Request) {
			userID, _ := auth.GetUserID(r)
			deps.WSHub.HandleConnection(w, r, userID)
		})

		r.Get("/memory", handleListMemories(deps.MemorySvc))
		r.Delete("/memory/{id}", handleDeleteMemory(deps.MemorySvc))
	})

	return r
}

func handleGetMe(database *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
			return
		}

		userUUID, err := db.ParseUUID(userID)
		if err != nil {
			http.Error(w, `{"error":"invalid user id"}`, http.StatusBadRequest)
			return
		}

		user, err := database.GetUserByID(r.Context(), userUUID)
		if err != nil {
			http.Error(w, `{"error":"user not found"}`, http.StatusNotFound)
			return
		}

		writeJSON(w, http.StatusOK, auth.UserResponse{
			ID:    db.UUIDToString(user.ID),
			Email: user.Email,
			Name:  user.Name,
		})
	}
}

func handleUpdateMe(database *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
			return
		}

		var req struct {
			Name string `json:"name"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, `{"error":"invalid request"}`, http.StatusBadRequest)
			return
		}

		userUUID, err := db.ParseUUID(userID)
		if err != nil {
			http.Error(w, `{"error":"invalid user id"}`, http.StatusBadRequest)
			return
		}

		user, err := database.UpdateUser(r.Context(), db.UpdateUserParams{
			ID:   userUUID,
			Name: req.Name,
		})
		if err != nil {
			http.Error(w, `{"error":"update failed"}`, http.StatusInternalServerError)
			return
		}

		writeJSON(w, http.StatusOK, auth.UserResponse{
			ID:    db.UUIDToString(user.ID),
			Email: user.Email,
			Name:  user.Name,
		})
	}
}

func handleListConversations(svc *chat.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
			return
		}

		convs, err := svc.ListConversations(r.Context(), userID)
		if err != nil {
			http.Error(w, `{"error":"failed to list conversations"}`, http.StatusInternalServerError)
			return
		}

		if convs == nil {
			convs = []db.Conversation{}
		}
		writeJSON(w, http.StatusOK, convs)
	}
}

func handleCreateConversation(svc *chat.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
			return
		}

		var req struct {
			Title string `json:"title"`
		}
		json.NewDecoder(r.Body).Decode(&req)

		conv, err := svc.CreateConversation(r.Context(), userID, req.Title)
		if err != nil {
			http.Error(w, `{"error":"failed to create conversation"}`, http.StatusInternalServerError)
			return
		}

		writeJSON(w, http.StatusCreated, conv)
	}
}

func handleGetMessages(svc *chat.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conversationID := chi.URLParam(r, "id")

		msgs, err := svc.GetMessages(r.Context(), conversationID)
		if err != nil {
			http.Error(w, `{"error":"failed to get messages"}`, http.StatusInternalServerError)
			return
		}

		if msgs == nil {
			msgs = []db.Message{}
		}
		writeJSON(w, http.StatusOK, msgs)
	}
}

func handleListMemories(svc *memory.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
			return
		}

		mems, err := svc.ListMemories(r.Context(), userID)
		if err != nil {
			http.Error(w, `{"error":"failed to list memories"}`, http.StatusInternalServerError)
			return
		}

		if mems == nil {
			mems = []db.Memory{}
		}
		writeJSON(w, http.StatusOK, mems)
	}
}

func handleDeleteMemory(svc *memory.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
			return
		}

		memoryID := chi.URLParam(r, "id")
		if err := svc.DeleteMemory(r.Context(), userID, memoryID); err != nil {
			http.Error(w, `{"error":"delete failed"}`, http.StatusInternalServerError)
			return
		}

		writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
	}
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
