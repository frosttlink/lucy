package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type RegisterRequest struct {
	Email    string `json:"email"`
	Name     string `json:"name"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
	User         UserResponse `json:"user"`
}

type UserResponse struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

type UserStore interface {
	CreateUser(ctx context.Context, email, name, passwordHash string) (string, error)
	GetUserByEmail(ctx context.Context, email string) (string, string, string, string, error)
	GetUserByID(ctx context.Context, id string) (email, name string, err error)
}

type SessionStore interface {
	CreateSession(ctx context.Context, userID, refreshToken string, expiresAt time.Time) error
	GetSessionByRefreshToken(ctx context.Context, refreshToken string) (sessionID, userID string, err error)
	DeleteSession(ctx context.Context, id string) error
}

type Handler struct {
	jwtManager *JWTManager
	users      UserStore
	sessions   SessionStore
}

func NewHandler(jwtManager *JWTManager, users UserStore, sessions SessionStore) *Handler {
	return &Handler{
		jwtManager: jwtManager,
		users:      users,
		sessions:   sessions,
	}
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.Password == "" || req.Name == "" {
		http.Error(w, `{"error":"email, name, and password are required"}`, http.StatusBadRequest)
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, `{"error":"failed to process password"}`, http.StatusInternalServerError)
		return
	}

	userID, err := h.users.CreateUser(r.Context(), req.Email, req.Name, string(hash))
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") {
			http.Error(w, `{"error":"email already registered"}`, http.StatusConflict)
			return
		}
		http.Error(w, `{"error":"failed to create user"}`, http.StatusInternalServerError)
		return
	}

	accessToken, err := h.jwtManager.GenerateAccessToken(userID)
	if err != nil {
		http.Error(w, `{"error":"failed to generate token"}`, http.StatusInternalServerError)
		return
	}

	refreshToken, err := h.jwtManager.GenerateRefreshToken(userID)
	if err != nil {
		http.Error(w, `{"error":"failed to generate refresh token"}`, http.StatusInternalServerError)
		return
	}

	if err := h.sessions.CreateSession(r.Context(), userID, refreshToken, time.Now().Add(7*24*time.Hour)); err != nil {
		http.Error(w, `{"error":"failed to create session"}`, http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User: UserResponse{
			ID:    userID,
			Email: req.Email,
			Name:  req.Name,
		},
	})
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	userID, email, name, passwordHash, err := h.users.GetUserByEmail(r.Context(), req.Email)
	if err != nil {
		http.Error(w, `{"error":"invalid email or password"}`, http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		http.Error(w, `{"error":"invalid email or password"}`, http.StatusUnauthorized)
		return
	}

	accessToken, err := h.jwtManager.GenerateAccessToken(userID)
	if err != nil {
		http.Error(w, `{"error":"failed to generate token"}`, http.StatusInternalServerError)
		return
	}

	refreshToken, err := h.jwtManager.GenerateRefreshToken(userID)
	if err != nil {
		http.Error(w, `{"error":"failed to generate refresh token"}`, http.StatusInternalServerError)
		return
	}

	if err := h.sessions.CreateSession(r.Context(), userID, refreshToken, time.Now().Add(7*24*time.Hour)); err != nil {
		http.Error(w, `{"error":"failed to create session"}`, http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User: UserResponse{
			ID:    userID,
			Email: email,
			Name:  name,
		},
	})
}

func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	var req RefreshRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	_, err := h.jwtManager.ValidateToken(req.RefreshToken)
	if err != nil {
		http.Error(w, `{"error":"invalid refresh token"}`, http.StatusUnauthorized)
		return
	}

	sessionID, userID, err := h.sessions.GetSessionByRefreshToken(r.Context(), req.RefreshToken)
	if err != nil {
		http.Error(w, `{"error":"session not found"}`, http.StatusUnauthorized)
		return
	}

	_ = h.sessions.DeleteSession(r.Context(), sessionID)

	accessToken, err := h.jwtManager.GenerateAccessToken(userID)
	if err != nil {
		http.Error(w, `{"error":"failed to generate token"}`, http.StatusInternalServerError)
		return
	}

	newRefreshToken, err := h.jwtManager.GenerateRefreshToken(userID)
	if err != nil {
		http.Error(w, `{"error":"failed to generate refresh token"}`, http.StatusInternalServerError)
		return
	}

	if err := h.sessions.CreateSession(r.Context(), userID, newRefreshToken, time.Now().Add(7*24*time.Hour)); err != nil {
		http.Error(w, `{"error":"failed to create session"}`, http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"access_token":  accessToken,
		"refresh_token": newRefreshToken,
	})
}

type contextKey string

const UserIDKey contextKey = "user_id"

func Middleware(jwtManager *JWTManager) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := ""

			// Try Authorization header first
			authHeader := r.Header.Get("Authorization")
			if authHeader != "" {
				parts := strings.Split(authHeader, " ")
				if len(parts) == 2 && parts[0] == "Bearer" {
					token = parts[1]
				}
			}

			// Fallback to query param (for WebSocket connections)
			if token == "" {
				token = r.URL.Query().Get("token")
			}

			if token == "" {
				http.Error(w, `{"error":"missing authorization token"}`, http.StatusUnauthorized)
				return
			}

			claims, err := jwtManager.ValidateToken(token)
			if err != nil {
				if strings.Contains(err.Error(), "expired") {
					http.Error(w, `{"error":"token expired"}`, http.StatusUnauthorized)
					return
				}
				http.Error(w, fmt.Sprintf(`{"error":"%s"}`, err.Error()), http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), UserIDKey, claims.UserID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func GetUserID(r *http.Request) (string, bool) {
	userID, ok := r.Context().Value(UserIDKey).(string)
	return userID, ok
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
