import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';
import { DomainEventPublisher } from 'src/shared-kernel/business-logic/gateways/providers/domain-event-publisher';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { UuidGenerator } from 'src/shared-kernel/business-logic/gateways/providers/uuid-generator';
import { DomainEventRepository } from 'src/shared-kernel/business-logic/gateways/repositories/domain-event.repository';
import { DrizzleDb } from '../../secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { ApiConfig } from '../zod/api-config-schema';
import { DomainEventsPoller } from './domain-event-poller';

export const API_CONFIG = 'API_CONFIG';
export const DRIZZLE_DB = 'DRIZZLE_DB';
export const UUID_GENERATOR = 'UUID_GENERATOR';
export const DATE_TIME_PROVIDER = 'DATE_TIME_PROVIDER';
export const DOMAIN_EVENTS_POLLER = 'DOMAIN_EVENTS_POLLER';
export const TRANSACTION_PERFORMER = 'TRANSACTION_PERFORMER';
export const DOMAIN_EVENT_PUBLISHER = 'DOMAIN_EVENT_PUBLISHER';
export const DOMAIN_EVENT_REPOSITORY = 'DOMAIN_EVENT_REPOSITORY';

export const sharedKernelTokens = [
  API_CONFIG,
  DRIZZLE_DB,
  UUID_GENERATOR,
  DATE_TIME_PROVIDER,
  DOMAIN_EVENTS_POLLER,
  TRANSACTION_PERFORMER,
  DOMAIN_EVENT_PUBLISHER,
  DOMAIN_EVENT_REPOSITORY,
] as const;

export interface SharedKernelInjectionTokenMap {
  [API_CONFIG]: ApiConfig;
  [DRIZZLE_DB]: DrizzleDb;
  [UUID_GENERATOR]: UuidGenerator;
  [DATE_TIME_PROVIDER]: DateTimeProvider;
  [DOMAIN_EVENTS_POLLER]: DomainEventsPoller;
  [TRANSACTION_PERFORMER]: TransactionPerformer;
  [DOMAIN_EVENT_PUBLISHER]: DomainEventPublisher;
  [DOMAIN_EVENT_REPOSITORY]: DomainEventRepository;
}
