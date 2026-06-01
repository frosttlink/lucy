package llm

import (
	"context"
	"fmt"

	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
	"github.com/openai/openai-go/packages/ssestream"
	"github.com/openai/openai-go/shared"
)

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ToolCall struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Input string `json:"input"`
}

type CompletionResponse struct {
	Content   string
	ToolCalls []ToolCall
	Usage     struct {
		PromptTokens     int
		CompletionTokens int
	}
}

type ToolDefinition struct {
	Name        string
	Description string
	Parameters  shared.FunctionParameters
}

type Client struct {
	client openai.Client
	model  string
}

func NewClient(apiKey string) *Client {
	return &Client{
		client: openai.NewClient(
			option.WithAPIKey(apiKey),
		),
		model: openai.ChatModelGPT4o,
	}
}

func (c *Client) Chat(ctx context.Context, messages []Message, tools []ToolDefinition) (*CompletionResponse, error) {
	req := openai.ChatCompletionNewParams{
		Model:    c.model,
		Messages: c.toOpenAIMessages(messages),
	}

	if len(tools) > 0 {
		req.Tools = c.toOpenAITools(tools)
	}

	resp, err := c.client.Chat.Completions.New(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("llm chat error: %w", err)
	}

	result := &CompletionResponse{}

	if len(resp.Choices) > 0 {
		choice := resp.Choices[0]
		if choice.Message.Content != "" {
			result.Content = choice.Message.Content
		}
		for _, tc := range choice.Message.ToolCalls {
			result.ToolCalls = append(result.ToolCalls, ToolCall{
				ID:    tc.ID,
				Name:  tc.Function.Name,
				Input: tc.Function.Arguments,
			})
		}
	}

	result.Usage.PromptTokens = int(resp.Usage.PromptTokens)
	result.Usage.CompletionTokens = int(resp.Usage.CompletionTokens)

	return result, nil
}

func (c *Client) ChatStream(ctx context.Context, messages []Message, tools []ToolDefinition) *Stream {
	req := openai.ChatCompletionNewParams{
		Model:    c.model,
		Messages: c.toOpenAIMessages(messages),
	}

	if len(tools) > 0 {
		req.Tools = c.toOpenAITools(tools)
	}

	stream := &Stream{
		client: c,
		ctx:    ctx,
		msgCh:  make(chan StreamEvent, 64),
		errCh:  make(chan error, 1),
		doneCh: make(chan struct{}),
	}

	go stream.run(req)
	return stream
}

type StreamEvent struct {
	Type      string     `json:"type"`
	Content   string     `json:"content,omitempty"`
	ToolCalls []ToolCall `json:"tool_calls,omitempty"`
	Error     string     `json:"error,omitempty"`
}

type Stream struct {
	client *Client
	ctx    context.Context
	msgCh  chan StreamEvent
	errCh  chan error
	doneCh chan struct{}
}

func (s *Stream) run(req openai.ChatCompletionNewParams) {
	defer close(s.doneCh)

	stream := s.client.client.Chat.Completions.NewStreaming(s.ctx, req)
	defer stream.Close()

	var partialToolCalls []ToolCall

	for stream.Next() {
		chunk := stream.Current()
		if len(chunk.Choices) == 0 {
			continue
		}

		delta := chunk.Choices[0].Delta

		if delta.Content != "" {
			s.msgCh <- StreamEvent{
				Type:    "token",
				Content: delta.Content,
			}
		}

		for _, tc := range delta.ToolCalls {
			if tc.Function.Name != "" && tc.Function.Arguments != "" {
				partialToolCalls = append(partialToolCalls, ToolCall{
					ID:    tc.ID,
					Name:  tc.Function.Name,
					Input: tc.Function.Arguments,
				})
			}
		}
	}

	if err := stream.Err(); err != nil {
		s.errCh <- fmt.Errorf("stream error: %w", err)
		return
	}

	if len(partialToolCalls) > 0 {
		s.msgCh <- StreamEvent{
			Type:      "tool_call",
			ToolCalls: partialToolCalls,
		}
	}

	s.msgCh <- StreamEvent{Type: "done"}
}

func (s *Stream) Events() <-chan StreamEvent {
	return s.msgCh
}

func (s *Stream) Done() <-chan struct{} {
	return s.doneCh
}

func (s *Stream) Wait() {
	<-s.doneCh
}

func (c *Client) CreateEmbedding(ctx context.Context, text string) ([]float32, error) {
	resp, err := c.client.Embeddings.New(ctx, openai.EmbeddingNewParams{
		Model: openai.EmbeddingModelTextEmbedding3Small,
		Input: openai.EmbeddingNewParamsInputUnion{
			OfString: openai.String(text),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("embedding error: %w", err)
	}

	if len(resp.Data) == 0 {
		return nil, fmt.Errorf("no embedding data returned")
	}

	f64 := resp.Data[0].Embedding
	f32 := make([]float32, len(f64))
	for i, v := range f64 {
		f32[i] = float32(v)
	}
	return f32, nil
}

func (c *Client) toOpenAIMessages(messages []Message) []openai.ChatCompletionMessageParamUnion {
	result := make([]openai.ChatCompletionMessageParamUnion, 0, len(messages))
	for _, msg := range messages {
		switch msg.Role {
		case "system":
			result = append(result, openai.SystemMessage(msg.Content))
		case "user":
			result = append(result, openai.UserMessage(msg.Content))
		case "assistant":
			result = append(result, openai.AssistantMessage(msg.Content))
		case "tool":
			result = append(result, openai.ToolMessage(msg.Content, ""))
		default:
			result = append(result, openai.UserMessage(msg.Content))
		}
	}
	return result
}

func (c *Client) toOpenAITools(tools []ToolDefinition) []openai.ChatCompletionToolParam {
	result := make([]openai.ChatCompletionToolParam, len(tools))
	for i, t := range tools {
		result[i] = openai.ChatCompletionToolParam{
			Function: shared.FunctionDefinitionParam{
				Name:        t.Name,
				Description: openai.String(t.Description),
				Parameters:  t.Parameters,
			},
		}
	}
	return result
}

var _ *ssestream.Stream[openai.ChatCompletionChunk]
