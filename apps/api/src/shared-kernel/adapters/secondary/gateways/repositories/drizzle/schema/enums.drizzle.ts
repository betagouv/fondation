import { DomainEventStatus } from '../../../../../../business-logic/models/domainEvent';
import { sharedKernelContextSchema } from './shared-kernel-context-schema.drizzle';

export const domainEventStatusEnum = sharedKernelContextSchema.enum(
  'domain_event_status',
  Object.values(DomainEventStatus) as [
    DomainEventStatus,
    ...DomainEventStatus[],
  ],
);
