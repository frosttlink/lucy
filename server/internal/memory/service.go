package memory

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/frostz/lucy/internal/db"
	"github.com/frostz/lucy/internal/llm"
	"github.com/pgvector/pgvector-go"
)

type Service struct {
	database  *db.DB
	llmClient *llm.Client
}

func NewService(database *db.DB, llmClient *llm.Client) *Service {
	return &Service{
		database:  database,
		llmClient: llmClient,
	}
}

func (s *Service) SaveMemory(ctx context.Context, userID, content, memType string, metadata map[string]interface{}) error {
	embedding, err := s.llmClient.CreateEmbedding(ctx, content)
	if err != nil {
		return fmt.Errorf("failed to create embedding: %w", err)
	}

	metaJSON, _ := json.Marshal(metadata)

	userUUID, err := db.ParseUUID(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID: %w", err)
	}

	_, err = s.database.CreateMemory(ctx, db.CreateMemoryParams{
		UserID:    userUUID,
		Content:   content,
		Type:      memType,
		Embedding: pgvector.NewVector(embedding),
		Metadata:  metaJSON,
	})
	return err
}

func (s *Service) SearchMemories(ctx context.Context, userID, query string, limit int) ([]db.SearchMemoriesByEmbeddingRow, error) {
	if limit <= 0 {
		limit = 5
	}

	embedding, err := s.llmClient.CreateEmbedding(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to create embedding: %w", err)
	}

	userUUID, err := db.ParseUUID(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	results, err := s.database.SearchMemoriesByEmbedding(ctx, db.SearchMemoriesByEmbeddingParams{
		UserID:    userUUID,
		Embedding: pgvector.NewVector(embedding),
		Limit:     int32(limit),
	})
	if err != nil {
		return nil, err
	}

	return results, nil
}

func (s *Service) ListMemories(ctx context.Context, userID string) ([]db.Memory, error) {
	userUUID, err := db.ParseUUID(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}
	return s.database.ListMemoriesByUser(ctx, userUUID)
}

func (s *Service) DeleteMemory(ctx context.Context, userID, memoryID string) error {
	userUUID, err := db.ParseUUID(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID: %w", err)
	}
	memoryUUID, err := db.ParseUUID(memoryID)
	if err != nil {
		return fmt.Errorf("invalid memory ID: %w", err)
	}
	return s.database.DeleteMemory(ctx, db.DeleteMemoryParams{
		ID:     memoryUUID,
		UserID: userUUID,
	})
}

func (s *Service) DecideAndSave(ctx context.Context, userID, userMessage, assistantMessage string) error {
	content := userMessage + " " + assistantMessage
	if len(strings.Fields(content)) < 10 {
		return nil
	}

	metadata := map[string]interface{}{
		"saved_at": time.Now().UTC().Format(time.RFC3339),
	}

	return s.SaveMemory(ctx, userID, content, "short", metadata)
}
