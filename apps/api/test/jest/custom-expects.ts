import type { MatcherFunction } from 'expect';
import { FakeDomainEventRepository } from 'src/shared-kernel/adapters/secondary/gateways/repositories/fake-domain-event-repository';
import { DomainEvent } from 'src/shared-kernel/business-logic/models/domain-event';
import * as jestExtendedMatchers from 'jest-extended';

import { validate as validateUUID, version as getUUIDVersion } from 'uuid';

const toBeUuidV4: MatcherFunction = (received: unknown) => {
  if (typeof received !== 'string') {
    return {
      message: () => `expected ${received} to be a string`,
      pass: false,
    };
  }

  const isValidUUID = validateUUID(received);
  const isVersion4 = isValidUUID && getUUIDVersion(received) === 4;

  if (isVersion4) {
    return {
      message: () => `expected ${received} not to be a valid UUID v4`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected ${received} to be a valid UUID v4`,
      pass: false,
    };
  }
};

const toHaveDomainEvents: MatcherFunction = function (
  this: jest.MatcherContext,
  domainEventRepository: FakeDomainEventRepository,
  ...expectedEvents: DomainEvent[]
) {
  if (!(domainEventRepository instanceof FakeDomainEventRepository)) {
    return {
      message: () =>
        `Expected an instance of FakeDomainEventRepository, but got ${typeof domainEventRepository}`,
      pass: false,
    };
  }

  const pass = this.equals(domainEventRepository.events, expectedEvents);

  if (pass) {
    return {
      message: () =>
        `Expected repository not to have the provided domain events, but they were found.`,
      pass: true,
    };
  } else {
    return {
      message: () =>
        `Expected repository to have domain events ${this.utils.printExpected(expectedEvents)}, but got ${this.utils.printReceived(domainEventRepository.events)}`,
      pass: false,
    };
  }
};
expect.extend({
  ...jestExtendedMatchers,
  toBeUuidV4,
  toHaveDomainEvents,
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toBeUuidV4(): R;
      toHaveDomainEvents<D extends DomainEvent = DomainEvent>(
        ...expectedEvents: D[]
      ): R;
    }
  }
}
