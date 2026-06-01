-- name: CreateConversation :one
INSERT INTO conversations (user_id, title, subject)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetConversationByID :one
SELECT * FROM conversations WHERE id = $1;

-- name: ListConversationsByUser :many
SELECT * FROM conversations WHERE user_id = $1
ORDER BY updated_at DESC;

-- name: ListConversationsByUserAndSubject :many
SELECT * FROM conversations WHERE user_id = $1 AND subject = $2
ORDER BY updated_at DESC;

-- name: UpdateConversationTitle :one
UPDATE conversations SET title = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateConversationSubject :one
UPDATE conversations SET subject = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteConversation :exec
DELETE FROM conversations WHERE id = $1;
