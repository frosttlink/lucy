package chat

import (
	"context"
	"fmt"

	"github.com/frostz/lucy/internal/db"
	"github.com/frostz/lucy/internal/llm"
	"github.com/frostz/lucy/internal/memory"
	"github.com/frostz/lucy/internal/personality"
	"github.com/frostz/lucy/internal/tools"
)

type ContextBuilder struct {
	memorySvc  *memory.Service
	toolEngine *tools.Engine
}

func NewContextBuilder(memorySvc *memory.Service, toolEngine *tools.Engine) *ContextBuilder {
	return &ContextBuilder{
		memorySvc:  memorySvc,
		toolEngine: toolEngine,
	}
}

type BuiltContext struct {
	Messages         []llm.Message
	ToolDefs         []llm.ToolDefinition
	HasTools         bool
	RelevantMemories []db.Memory
}

func (b *ContextBuilder) BuildWithHistory(ctx context.Context, userID string, history []db.Message, userMessage string, memories []db.Memory, subject string) *BuiltContext {
	messages := make([]llm.Message, 0)

	// 1. Subject-specific system prompt
	prompt := personality.GetPrompt(subject)
	messages = append(messages, llm.Message{
		Role:    "system",
		Content: prompt,
	})

	// 2. Relevant memories as context
	if len(memories) > 0 {
		memContext := "Relevant information from past conversations:\n"
		for i, m := range memories {
			memContext += fmt.Sprintf("%d. %s\n", i+1, m.Content)
		}
		messages = append(messages, llm.Message{
			Role:    "system",
			Content: memContext,
		})
	}

	// 3. Recent conversation history (last 30 messages to stay within context)
	start := 0
	if len(history) > 30 {
		start = len(history) - 30
	}
	for _, msg := range history[start:] {
		messages = append(messages, llm.Message{
			Role:    msg.Role,
			Content: msg.Content,
		})
	}

	// 4. Current user message
	messages = append(messages, llm.Message{
		Role:    "user",
		Content: userMessage,
	})

	return &BuiltContext{
		Messages:         messages,
		ToolDefs:         b.toolEngine.DefinitionsForLLM(),
		HasTools:         true,
		RelevantMemories: memories,
	}
}
