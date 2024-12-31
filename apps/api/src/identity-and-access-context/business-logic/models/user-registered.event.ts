import { DomainEvent } from 'src/shared-kernel/business-logic/models/domain-event';
import { Role } from './roles';

export type UserRegisteredEventPayload = {
  userId: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
};

export class UserRegisteredEvent extends DomainEvent<UserRegisteredEventPayload> {
  readonly name = 'USER_REGISTERED';

  constructor(
    id: string,
    payload: UserRegisteredEventPayload,
    currentDate: Date,
  ) {
    super(id, UserRegisteredEvent.name, payload, currentDate);
  }
}
