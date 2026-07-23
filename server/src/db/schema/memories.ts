import { integer, jsonb, pgTable, text, timestamp, vector } from 'drizzle-orm/pg-core'
import { uuidv7 } from 'uuidv7'
import { users } from './users'

export const memories = pgTable('memories', {
  id: text()
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text().notNull(),
  type: text().notNull().default('short'),
  embedding: vector({ dimensions: 3072 }),
  metadata: jsonb().$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
