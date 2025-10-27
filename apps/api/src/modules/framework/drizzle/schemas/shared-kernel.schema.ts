import { sql } from 'drizzle-orm';
import {
  pgEnum,
  pgSchema,
  jsonb,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const sharedKernelContextSchema = pgSchema('shared_kernel_context');

export const domainEventStatusEnum = sharedKernelContextSchema.enum(
  'domain_event_status',
  ['NEW', 'PENDING', 'CONSUMED'],
);

export const formationEnum = pgEnum('formation', ['PARQUET', 'SIEGE']);

export const domainEvents = sharedKernelContextSchema.table('domain_events', {
  id: uuid()
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  type: text().notNull(),
  payload: jsonb().notNull(),
  occurredOn: timestamp().notNull(),
  status: domainEventStatusEnum().notNull(),
});
