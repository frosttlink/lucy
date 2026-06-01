package tasks

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/frostz/lucy/internal/tools"
)

type Task struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Completed bool      `json:"completed"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Store interface {
	SaveTask(task Task) error
	GetTask(id string) (Task, error)
	ListTasks() ([]Task, error)
	UpdateTask(id string, completed bool) (Task, error)
	DeleteTask(id string) error
}

type InMemoryStore struct {
	mu    sync.RWMutex
	tasks map[string]Task
}

func NewInMemoryStore() *InMemoryStore {
	return &InMemoryStore{
		tasks: make(map[string]Task),
	}
}

func (s *InMemoryStore) SaveTask(task Task) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.tasks[task.ID] = task
	return nil
}

func (s *InMemoryStore) GetTask(id string) (Task, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	task, ok := s.tasks[id]
	if !ok {
		return Task{}, fmt.Errorf("task not found")
	}
	return task, nil
}

func (s *InMemoryStore) ListTasks() ([]Task, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]Task, 0, len(s.tasks))
	for _, task := range s.tasks {
		result = append(result, task)
	}
	return result, nil
}

func (s *InMemoryStore) UpdateTask(id string, completed bool) (Task, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	task, ok := s.tasks[id]
	if !ok {
		return Task{}, fmt.Errorf("task not found")
	}
	task.Completed = completed
	task.UpdatedAt = time.Now()
	s.tasks[id] = task
	return task, nil
}

func (s *InMemoryStore) DeleteTask(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.tasks, id)
	return nil
}

type Tool struct {
	store Store
}

func New(store Store) *Tool {
	return &Tool{store: store}
}

func (t *Tool) Name() string {
	return "tasks"
}

func (t *Tool) Description() string {
	return "Create, list, update, and delete tasks. Use this to manage the user's to-do list."
}

func (t *Tool) Parameters() map[string]interface{} {
	return map[string]interface{}{
		"action": map[string]interface{}{
			"type":        "string",
			"description": "Action: 'create', 'list', 'complete', 'delete'",
		},
		"id": map[string]interface{}{
			"type":        "string",
			"description": "Task ID (required for complete, delete)",
		},
		"title": map[string]interface{}{
			"type":        "string",
			"description": "Task title (required for create)",
		},
	}
}

func (t *Tool) Execute(ctx context.Context, params tools.Params) (string, error) {
	action, _ := params["action"].(string)

	switch strings.ToLower(action) {
	case "create":
		title, _ := params["title"].(string)
		if title == "" {
			return "", fmt.Errorf("title is required")
		}
		task := Task{
			ID:        fmt.Sprintf("task_%d", time.Now().UnixNano()),
			Title:     title,
			Completed: false,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		if err := t.store.SaveTask(task); err != nil {
			return "", err
		}
		b, _ := json.Marshal(task)
		return fmt.Sprintf("Task created: %s", string(b)), nil

	case "list":
		tasks, err := t.store.ListTasks()
		if err != nil {
			return "", err
		}
		b, _ := json.Marshal(tasks)
		return string(b), nil

	case "complete":
		id, _ := params["id"].(string)
		if id == "" {
			return "", fmt.Errorf("id is required")
		}
		task, err := t.store.UpdateTask(id, true)
		if err != nil {
			return "", err
		}
		b, _ := json.Marshal(task)
		return fmt.Sprintf("Task completed: %s", string(b)), nil

	case "delete":
		id, _ := params["id"].(string)
		if id == "" {
			return "", fmt.Errorf("id is required")
		}
		if err := t.store.DeleteTask(id); err != nil {
			return "", err
		}
		return "Task deleted", nil

	default:
		return "", fmt.Errorf("unknown action: %s", action)
	}
}
