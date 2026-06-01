-- name: CreateMemory :one
INSERT INTO memories (user_id, content, type, embedding, metadata)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: ListMemoriesByUser :many
SELECT * FROM memories WHERE user_id = $1
ORDER BY created_at DESC;

-- name: SearchMemoriesByEmbedding :many
SELECT *, 1 - (embedding <=> $2) AS similarity
FROM memories
WHERE user_id = $1 AND embedding IS NOT NULL
ORDER BY embedding <=> $2
LIMIT $3;

-- name: DeleteMemory :exec
DELETE FROM memories WHERE id = $1 AND user_id = $2;
