import {
  DossierDeNominationRestContrat,
  IdentityAndAccessRestContract,
  NominationsContextSessionsRestContract,
} from 'shared-models';
import { BoundedContextHttpClient } from 'src/shared-kernel/adapters/secondary/gateways/providers/bounded-context-htttp-client';
import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';
import { DomainEventPublisher } from 'src/shared-kernel/business-logic/gateways/providers/domain-event-publisher';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { UuidGenerator } from 'src/shared-kernel/business-logic/gateways/providers/uuid-generator';
import { DomainEventRepository } from 'src/shared-kernel/business-logic/gateways/repositories/domain-event.repository';
import { DossierDeNominationService } from 'src/shared-kernel/business-logic/gateways/services/dossier-de-nomination.service';
import { SentryService } from 'src/shared-kernel/business-logic/gateways/services/sentry.service';
import { SessionService } from 'src/shared-kernel/business-logic/gateways/services/session.service';
import { UserService } from 'src/shared-kernel/business-logic/gateways/services/user.service';
import { UploadFileService } from 'src/shared-kernel/business-logic/services/upload-file.service';
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
export const SENTRY_SERVICE = 'SENTRY_SERVICE';
export const UPLOAD_FILE_SERVICE = 'UPLOAD_FILE_SERVICE';
export const NOMINATIONS_CONTEXT_HTTP_CLIENT =
  'NOMINATIONS_CONTEXT_HTTP_CLIENT';
export const IDENTITY_AND_ACCESS_CONTEXT_HTTP_CLIENT =
  'IDENTITY_AND_ACCESS_CONTEXT_HTTP_CLIENT';
export const DOSSIER_DE_NOMINATION_CONTEXT_HTTP_CLIENT =
  'DOSSIER_DE_NOMINATION_CONTEXT_HTTP_CLIENT';
export const USER_SERVICE = 'USER_SERVICE';
export const SESSION_SERVICE = 'SESSION_SERVICE';
export const DOSSIER_DE_NOMINATION_SERVICE = 'DOSSIER_DE_NOMINATION_SERVICE';

export const sharedKernelTokens = [
  API_CONFIG,
  DRIZZLE_DB,
  UUID_GENERATOR,
  DATE_TIME_PROVIDER,
  DOMAIN_EVENTS_POLLER,
  TRANSACTION_PERFORMER,
  DOMAIN_EVENT_PUBLISHER,
  DOMAIN_EVENT_REPOSITORY,
  SENTRY_SERVICE,
  UPLOAD_FILE_SERVICE,
  NOMINATIONS_CONTEXT_HTTP_CLIENT,
  DOSSIER_DE_NOMINATION_CONTEXT_HTTP_CLIENT,
  IDENTITY_AND_ACCESS_CONTEXT_HTTP_CLIENT,
  USER_SERVICE,
  SESSION_SERVICE,
  DOSSIER_DE_NOMINATION_SERVICE,
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
  [SENTRY_SERVICE]: SentryService;
  [UPLOAD_FILE_SERVICE]: UploadFileService;
  [NOMINATIONS_CONTEXT_HTTP_CLIENT]: BoundedContextHttpClient<NominationsContextSessionsRestContract>;
  [DOSSIER_DE_NOMINATION_CONTEXT_HTTP_CLIENT]: BoundedContextHttpClient<DossierDeNominationRestContrat>;
  [IDENTITY_AND_ACCESS_CONTEXT_HTTP_CLIENT]: BoundedContextHttpClient<IdentityAndAccessRestContract>;
  [USER_SERVICE]: UserService;
  [SESSION_SERVICE]: SessionService;
  [DOSSIER_DE_NOMINATION_SERVICE]: DossierDeNominationService;
}
