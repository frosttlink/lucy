-- name: CreateSession :one
INSERT INTO sessions (user_id, refresh_token, expires_at)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetSessionByRefreshToken :one
SELECT * FROM sessions WHERE refresh_token = $1;

-- name: DeleteSession :exec
DELETE FROM sessions WHERE id = $1;

-- name: DeleteUserSessions :exec
DELETE FROM sessions WHERE user_id = $1;
