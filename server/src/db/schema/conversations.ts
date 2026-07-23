import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { uuidv7 } from 'uuidv7'
import { users } from './users'

export const conversations = pgTable('conversations', {
  id: text()
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text().notNull().default('New Conversation'),
  subject: text().notNull().default('general'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
