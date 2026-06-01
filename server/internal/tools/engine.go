package tools

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"

	"github.com/frostz/lucy/internal/llm"
)

type Result struct {
	ToolName string `json:"tool_name"`
	Success  bool   `json:"success"`
	Output   string `json:"output"`
	Error    string `json:"error,omitempty"`
}

type Params map[string]interface{}

type Tool interface {
	Name() string
	Description() string
	Parameters() map[string]interface{}
	Execute(ctx context.Context, params Params) (string, error)
}

type Engine struct {
	mu    sync.RWMutex
	tools map[string]Tool
}

func NewEngine() *Engine {
	return &Engine{
		tools: make(map[string]Tool),
	}
}

func (e *Engine) Register(tool Tool) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.tools[tool.Name()] = tool
}

func (e *Engine) Get(name string) (Tool, bool) {
	e.mu.RLock()
	defer e.mu.RUnlock()
	t, ok := e.tools[name]
	return t, ok
}

func (e *Engine) Definitions() []interface{} {
	e.mu.RLock()
	defer e.mu.RUnlock()

	defs := make([]interface{}, 0, len(e.tools))
	for _, tool := range e.tools {
		defs = append(defs, map[string]interface{}{
			"type": "function",
			"function": map[string]interface{}{
				"name":        tool.Name(),
				"description": tool.Description(),
				"parameters": map[string]interface{}{
					"type":       "object",
					"properties": tool.Parameters(),
					"required":   e.requiredParams(tool.Parameters()),
				},
			},
		})
	}
	return defs
}

func (e *Engine) DefinitionsForLLM() []llm.ToolDefinition {
	e.mu.RLock()
	defer e.mu.RUnlock()

	defs := make([]llm.ToolDefinition, 0, len(e.tools))
	for _, tool := range e.tools {
		defs = append(defs, llm.ToolDefinition{
			Name:        tool.Name(),
			Description: tool.Description(),
			Parameters: map[string]interface{}{
				"type":       "object",
				"properties": tool.Parameters(),
			},
		})
	}
	return defs
}

func (e *Engine) Execute(ctx context.Context, name string, inputJSON string) Result {
	e.mu.RLock()
	tool, ok := e.tools[name]
	e.mu.RUnlock()

	if !ok {
		return Result{
			ToolName: name,
			Success:  false,
			Error:    fmt.Sprintf("tool '%s' not found", name),
		}
	}

	var params Params
	if err := json.Unmarshal([]byte(inputJSON), &params); err != nil {
		return Result{
			ToolName: name,
			Success:  false,
			Error:    fmt.Sprintf("invalid params: %v", err),
		}
	}

	output, err := tool.Execute(ctx, params)
	if err != nil {
		return Result{
			ToolName: name,
			Success:  false,
			Error:    err.Error(),
		}
	}

	return Result{
		ToolName: name,
		Success:  true,
		Output:   output,
	}
}

func (e *Engine) requiredParams(params map[string]interface{}) []string {
	var required []string
	for k, v := range params {
		if p, ok := v.(map[string]interface{}); ok {
			if requiredField, ok := p["required"]; ok {
				if requiredBool, ok := requiredField.(bool); ok && requiredBool {
					required = append(required, k)
				}
			}
		}
	}
	return required
}
