package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/frostz/lucy/internal/api"
	"github.com/frostz/lucy/internal/auth"
	"github.com/frostz/lucy/internal/chat"
	"github.com/frostz/lucy/internal/config"
	"github.com/frostz/lucy/internal/db"
	"github.com/frostz/lucy/internal/llm"
	"github.com/frostz/lucy/internal/memory"
	"github.com/frostz/lucy/internal/tools"
	"github.com/frostz/lucy/internal/tools/calculator"
	"github.com/frostz/lucy/internal/tools/notes"
	"github.com/frostz/lucy/internal/tools/tasks"
	"github.com/frostz/lucy/internal/tools/weather"
	"github.com/frostz/lucy/internal/tools/websearch"
	"github.com/frostz/lucy/internal/ws"
	"github.com/jackc/pgx/v5/pgtype"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	database, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()
	log.Println("Connected to PostgreSQL")

	rdb, err := db.ConnectRedis(ctx, cfg.RedisURL)
	if err != nil {
		log.Printf("Warning: Redis not available: %v (continuing without cache)", err)
		rdb = nil
	} else {
		defer rdb.Close()
		log.Println("Connected to Redis")
	}
	_ = rdb

	llmClient := llm.NewClient(cfg.OpenAIKey)
	log.Println("LLM client initialized")

	jwtManager := auth.NewJWTManager(cfg.JWTSecret)

	toolEngine := tools.NewEngine()
	toolEngine.Register(websearch.New())
	toolEngine.Register(notes.New(notes.NewInMemoryStore()))
	toolEngine.Register(tasks.New(tasks.NewInMemoryStore()))
	toolEngine.Register(calculator.New())
	toolEngine.Register(weather.New())
	log.Println("Registered 5 tools")

	wsHub := ws.NewHub()
	memorySvc := memory.NewService(database, llmClient)
	chatService := chat.NewService(database, llmClient, memorySvc, toolEngine, wsHub)

	wsHub.OnMessage(func(userID string, msg ws.ClientMessage) {
		ctx := context.Background()
		chatService.HandleMessage(ctx, userID, msg)
	})

	userStore := &userStoreAdapter{db: database}
	sessionStore := &sessionStoreAdapter{db: database}
	authHandler := auth.NewHandler(jwtManager, userStore, sessionStore)

	deps := &api.AppDependencies{
		DB:          database,
		JWTManager:  jwtManager,
		AuthHandler: authHandler,
		ChatService: chatService,
		MemorySvc:   memorySvc,
		WSHub:       wsHub,
	}

	router := api.NewRouter(deps)

	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 120 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("Lucy AI server starting on port %s", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("Server forced shutdown: %v", err)
	}

	log.Println("Server stopped")
}

type userStoreAdapter struct {
	db *db.DB
}

func (a *userStoreAdapter) CreateUser(ctx context.Context, email, name, passwordHash string) (string, error) {
	user, err := a.db.CreateUser(ctx, db.CreateUserParams{
		Email:        email,
		Name:         name,
		PasswordHash: passwordHash,
	})
	if err != nil {
		return "", err
	}
	return db.UUIDToString(user.ID), nil
}

func (a *userStoreAdapter) GetUserByEmail(ctx context.Context, email string) (string, string, string, string, error) {
	user, err := a.db.GetUserByEmail(ctx, email)
	if err != nil {
		return "", "", "", "", err
	}
	return db.UUIDToString(user.ID), user.Email, user.Name, user.PasswordHash, nil
}

func (a *userStoreAdapter) GetUserByID(ctx context.Context, id string) (string, string, error) {
	userUUID, err := db.ParseUUID(id)
	if err != nil {
		return "", "", err
	}
	user, err := a.db.GetUserByID(ctx, userUUID)
	if err != nil {
		return "", "", err
	}
	return user.Email, user.Name, nil
}

type sessionStoreAdapter struct {
	db *db.DB
}

func (a *sessionStoreAdapter) CreateSession(ctx context.Context, userID, refreshToken string, expiresAt time.Time) error {
	userUUID, err := db.ParseUUID(userID)
	if err != nil {
		return err
	}
	_, err = a.db.CreateSession(ctx, db.CreateSessionParams{
		UserID:       userUUID,
		RefreshToken: refreshToken,
		ExpiresAt:    pgtype.Timestamptz{Time: expiresAt, Valid: true},
	})
	return err
}

func (a *sessionStoreAdapter) GetSessionByRefreshToken(ctx context.Context, refreshToken string) (string, string, error) {
	session, err := a.db.GetSessionByRefreshToken(ctx, refreshToken)
	if err != nil {
		return "", "", err
	}
	return db.UUIDToString(session.ID), db.UUIDToString(session.UserID), nil
}

func (a *sessionStoreAdapter) DeleteSession(ctx context.Context, id string) error {
	sessionUUID, err := db.ParseUUID(id)
	if err != nil {
		return err
	}
	return a.db.DeleteSession(ctx, sessionUUID)
}
