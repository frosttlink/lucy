import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { uuidv7 } from 'uuidv7'
import { conversations } from './conversations'

export const messages = pgTable('messages', {
  id: text()
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  conversationId: text('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  role: text().notNull(),
  content: text().notNull(),
  tokens: integer().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
