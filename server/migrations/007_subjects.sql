ALTER TABLE conversations ADD COLUMN subject VARCHAR(50) NOT NULL DEFAULT 'general';
CREATE INDEX idx_conversations_subject ON conversations(subject);
