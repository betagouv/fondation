import { sql } from 'drizzle-orm';
import { jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { domainEventStatusEnum } from './enums.drizzle';
import { sharedKernelContextSchema } from './shared-kernel-context-schema.drizzle';

export const domainEvents = sharedKernelContextSchema.table('domain_events', {
  id: uuid()
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  type: text().notNull(),
  payload: jsonb().notNull(),
  occurredOn: timestamp().notNull(),
  status: domainEventStatusEnum().notNull(),
});
