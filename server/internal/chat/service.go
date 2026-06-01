package chat

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"

	"github.com/frostz/lucy/internal/db"
	"github.com/frostz/lucy/internal/llm"
	"github.com/frostz/lucy/internal/memory"
	"github.com/frostz/lucy/internal/tools"
	"github.com/frostz/lucy/internal/ws"
	"github.com/jackc/pgx/v5/pgtype"
)

type Service struct {
	db             *db.DB
	llmClient      *llm.Client
	memorySvc      *memory.Service
	toolEngine     *tools.Engine
	wsHub          *ws.Hub
	contextBuilder *ContextBuilder
}

func NewService(database *db.DB, llmClient *llm.Client, memorySvc *memory.Service, toolEngine *tools.Engine, wsHub *ws.Hub) *Service {
	return &Service{
		db:             database,
		llmClient:      llmClient,
		memorySvc:      memorySvc,
		toolEngine:     toolEngine,
		wsHub:          wsHub,
		contextBuilder: NewContextBuilder(memorySvc, toolEngine),
	}
}

func (s *Service) HandleMessage(ctx context.Context, userID string, msg ws.ClientMessage) {
	conversationID := msg.ConversationID
	userMessage := msg.Content
	subject := msg.Subject

	if subject == "" {
		subject = "general"
	}

	if conversationID == "" || userMessage == "" {
		return
	}

	convUUID, err := db.ParseUUID(conversationID)
	if err != nil {
		log.Printf("invalid conversation id: %v", err)
		s.wsHub.SendError(conversationID, "Invalid conversation ID")
		return
	}

	// 1. Save user message
	_, err = s.db.CreateMessage(ctx, db.CreateMessageParams{
		ConversationID: convUUID,
		Role:           "user",
		Content:        userMessage,
		Tokens:         pgtype.Int4{},
	})
	if err != nil {
		log.Printf("failed to save user message: %v", err)
		s.wsHub.SendError(conversationID, "Failed to save message")
		return
	}

	// 2. Get conversation history
	history, err := s.db.ListMessagesByConversation(ctx, convUUID)
	if err != nil {
		log.Printf("failed to load history: %v", err)
		s.wsHub.SendError(conversationID, "Failed to load conversation")
		return
	}

	// 3. Search relevant memories
	memories, err := s.memorySvc.SearchMemories(ctx, userID, userMessage, 5)
	if err != nil {
		log.Printf("memory search error (non-fatal): %v", err)
	}

	// 4. Convert memories for context
	var memList []db.Memory
	for _, m := range memories {
		memList = append(memList, db.Memory{
			ID:        m.ID,
			UserID:    m.UserID,
			Content:   m.Content,
			Type:      m.Type,
			Embedding: m.Embedding,
			Metadata:  m.Metadata,
			CreatedAt: m.CreatedAt,
		})
	}

	// 5. Build context with subject
	context := s.contextBuilder.BuildWithHistory(ctx, userID, history, userMessage, memList, subject)

	// 6. Run LLM with tool loop
	assistantContent, err := s.runLLMWithTools(ctx, conversationID, context)
	if err != nil {
		log.Printf("llm error: %v", err)
		s.wsHub.SendError(conversationID, fmt.Sprintf("AI error: %v", err))
		return
	}

	// 6. Save assistant message
	_, err = s.db.CreateMessage(ctx, db.CreateMessageParams{
		ConversationID: convUUID,
		Role:           "assistant",
		Content:        assistantContent,
		Tokens:         pgtype.Int4{},
	})
	if err != nil {
		log.Printf("failed to save assistant message: %v", err)
	}

	// 7. Save to memory
	if err := s.memorySvc.DecideAndSave(ctx, userID, userMessage, assistantContent); err != nil {
		log.Printf("memory save error: %v", err)
	}

	// 8. Send done signal
	s.wsHub.SendDone(conversationID)
}

func (s *Service) runLLMWithTools(ctx context.Context, conversationID string, context *BuiltContext) (string, error) {
	messages := context.Messages
	toolDefs := context.ToolDefs
	maxIterations := 5

	for i := 0; i < maxIterations; i++ {
		resp, err := s.llmClient.Chat(ctx, messages, toolDefs)
		if err != nil {
			return "", fmt.Errorf("llm chat failed: %w", err)
		}

		if len(resp.ToolCalls) > 0 {
			tcJSON, _ := json.Marshal(resp.ToolCalls)
			messages = append(messages, llm.Message{
				Role:    "assistant",
				Content: fmt.Sprintf("I'll use the following tools: %s", string(tcJSON)),
			})

			for _, tc := range resp.ToolCalls {
				result := s.toolEngine.Execute(ctx, tc.Name, tc.Input)

				resultJSON, _ := json.Marshal(result)

				s.wsHub.SendToolCall(conversationID, []llm.ToolCall{tc})

				messages = append(messages, llm.Message{
					Role:    "user",
					Content: fmt.Sprintf("Tool '%s' result: %s", tc.Name, string(resultJSON)),
				})
			}

			continue
		}

		if resp.Content != "" {
			words := strings.Fields(resp.Content)
			for _, word := range words {
				s.wsHub.SendToken(conversationID, word+" ")
			}
		}

		return resp.Content, nil
	}

	return "", fmt.Errorf("too many tool call iterations")
}

func (s *Service) CreateConversation(ctx context.Context, userID, title, subject string) (db.Conversation, error) {
	userUUID, err := db.ParseUUID(userID)
	if err != nil {
		return db.Conversation{}, fmt.Errorf("invalid user id: %w", err)
	}
	if title == "" {
		title = "New Conversation"
	}
	if subject == "" {
		subject = "general"
	}
	result, err := s.db.CreateConversation(ctx, db.CreateConversationParams{
		UserID:  userUUID,
		Title:   title,
		Subject: subject,
	})
	if err != nil {
		return db.Conversation{}, err
	}
	return result, nil
}

func (s *Service) ListConversations(ctx context.Context, userID string) ([]db.Conversation, error) {
	userUUID, err := db.ParseUUID(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user id: %w", err)
	}
	return s.db.ListConversationsByUser(ctx, userUUID)
}

func (s *Service) ListConversationsBySubject(ctx context.Context, userID, subject string) ([]db.Conversation, error) {
	userUUID, err := db.ParseUUID(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user id: %w", err)
	}
	return s.db.ListConversationsByUserAndSubject(ctx, db.ListConversationsByUserAndSubjectParams{
		UserID:  userUUID,
		Subject: subject,
	})
}

func (s *Service) GetMessages(ctx context.Context, conversationID string) ([]db.Message, error) {
	convUUID, err := db.ParseUUID(conversationID)
	if err != nil {
		return nil, fmt.Errorf("invalid conversation id: %w", err)
	}
	return s.db.ListMessagesByConversation(ctx, convUUID)
}
