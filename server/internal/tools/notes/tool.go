package notes

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/frostz/lucy/internal/tools"
)

type Note struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Store interface {
	SaveNote(note Note) error
	GetNote(id string) (Note, error)
	ListNotes() ([]Note, error)
	DeleteNote(id string) error
}

type InMemoryStore struct {
	mu    sync.RWMutex
	notes map[string]Note
}

func NewInMemoryStore() *InMemoryStore {
	return &InMemoryStore{
		notes: make(map[string]Note),
	}
}

func (s *InMemoryStore) SaveNote(note Note) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.notes[note.ID] = note
	return nil
}

func (s *InMemoryStore) GetNote(id string) (Note, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	note, ok := s.notes[id]
	if !ok {
		return Note{}, fmt.Errorf("note not found")
	}
	return note, nil
}

func (s *InMemoryStore) ListNotes() ([]Note, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]Note, 0, len(s.notes))
	for _, note := range s.notes {
		result = append(result, note)
	}
	return result, nil
}

func (s *InMemoryStore) DeleteNote(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.notes, id)
	return nil
}

type Tool struct {
	store Store
}

func New(store Store) *Tool {
	return &Tool{store: store}
}

func generateID() string {
	return fmt.Sprintf("note_%d", time.Now().UnixNano())
}

func (t *Tool) Name() string {
	return "notes"
}

func (t *Tool) Description() string {
	return "Create, read, list, and delete notes. Use this to save information the user wants to remember."
}

func (t *Tool) Parameters() map[string]interface{} {
	return map[string]interface{}{
		"action": map[string]interface{}{
			"type":        "string",
			"description": "Action to perform: 'create', 'read', 'list', 'delete'",
		},
		"id": map[string]interface{}{
			"type":        "string",
			"description": "Note ID (required for read, delete)",
		},
		"title": map[string]interface{}{
			"type":        "string",
			"description": "Note title (required for create)",
		},
		"content": map[string]interface{}{
			"type":        "string",
			"description": "Note content (required for create)",
		},
	}
}

func (t *Tool) Execute(ctx context.Context, params tools.Params) (string, error) {
	action, _ := params["action"].(string)

	switch strings.ToLower(action) {
	case "create":
		title, _ := params["title"].(string)
		content, _ := params["content"].(string)
		if title == "" || content == "" {
			return "", fmt.Errorf("title and content are required")
		}
		note := Note{
			ID:        generateID(),
			Title:     title,
			Content:   content,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		if err := t.store.SaveNote(note); err != nil {
			return "", err
		}
		b, _ := json.Marshal(note)
		return fmt.Sprintf("Note created: %s", string(b)), nil

	case "read":
		id, _ := params["id"].(string)
		if id == "" {
			return "", fmt.Errorf("id is required")
		}
		note, err := t.store.GetNote(id)
		if err != nil {
			return "", err
		}
		b, _ := json.Marshal(note)
		return string(b), nil

	case "list":
		notes, err := t.store.ListNotes()
		if err != nil {
			return "", err
		}
		b, _ := json.Marshal(notes)
		return string(b), nil

	case "delete":
		id, _ := params["id"].(string)
		if id == "" {
			return "", fmt.Errorf("id is required")
		}
		if err := t.store.DeleteNote(id); err != nil {
			return "", err
		}
		return "Note deleted successfully", nil

	default:
		return "", fmt.Errorf("unknown action: %s", action)
	}
}
