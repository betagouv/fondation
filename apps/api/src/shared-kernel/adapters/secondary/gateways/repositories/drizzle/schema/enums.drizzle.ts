import { DomainEventStatus } from 'src/shared-kernel/business-logic/models/domain-event';
import { sharedKernelContextSchema } from './shared-kernel-context-schema.drizzle';
import { pgEnum } from 'drizzle-orm/pg-core';
import { Magistrat, Transparency } from 'shared-models';

export const domainEventStatusEnum = sharedKernelContextSchema.enum(
  'domain_event_status',
  Object.values(DomainEventStatus) as [
    DomainEventStatus,
    ...DomainEventStatus[],
  ],
);

export const formationEnum = pgEnum(
  'formation',
  Object.values(Magistrat.Formation) as [
    Magistrat.Formation,
    ...Magistrat.Formation[],
  ],
);

export const transparencyEnum = pgEnum(
  'transparency',
  Object.values(Transparency) as [Transparency, ...Transparency[]],
);
