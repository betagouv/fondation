import { relations } from 'drizzle-orm';
import { sessions } from './session-pm';
import { users } from './user-pm';

export const sessionsUsersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
}));
