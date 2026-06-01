-- name: CreateMessage :one
INSERT INTO messages (conversation_id, role, content, tokens)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: ListMessagesByConversation :many
SELECT * FROM messages WHERE conversation_id = $1
ORDER BY created_at ASC;

-- name: GetRecentMessages :many
SELECT * FROM messages WHERE conversation_id = $1
ORDER BY created_at DESC
LIMIT $2;
