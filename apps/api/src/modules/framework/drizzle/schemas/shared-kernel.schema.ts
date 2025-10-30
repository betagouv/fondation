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

export const transparencyEnum = pgEnum('transparency', [
  'AUTOMNE_2024',
  'PROCUREURS_GENERAUX_8_NOVEMBRE_2024',
  'PROCUREURS_GENERAUX_25_NOVEMBRE_2024',
  'TABLEAU_GENERAL_T_DU_25_NOVEMBRE_2024',
  'CABINET_DU_MINISTRE_DU_21_JANVIER_2025',
  'SIEGE_DU_06_FEVRIER_2025',
  'PARQUET_DU_06_FEVRIER_2025',
  'PARQUET_DU_20_FEVRIER_2025',
  'DU_03_MARS_2025',
  'GRANDE_TRANSPA_DU_21_MARS_2025',
  'DU_30_AVRIL_2025',
  'MARCH_2026',
]);

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
