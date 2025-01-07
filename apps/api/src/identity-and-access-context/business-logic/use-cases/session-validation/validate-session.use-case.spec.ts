import { UserSession } from 'src/identity-and-access-context/business-logic/models/session';
import { ValidateSessionUseCase } from './validate-session.use-case';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { FakeSessionRepository } from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/fake-session.repository';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-date-provider';
import { DomainRegistry } from '../../models/domain-registry';

const currentDate = new Date(2030, 0, 10);

describe('Validate Session Use Case', () => {
  let sessionRepository: FakeSessionRepository;
  let validateSessionUseCase: ValidateSessionUseCase;

  beforeEach(() => {
    sessionRepository = new FakeSessionRepository();
    validateSessionUseCase = new ValidateSessionUseCase(
      sessionRepository,
      new NullTransactionPerformer(),
    );

    const dateTimeProvider = new DeterministicDateProvider();
    dateTimeProvider.currentDate = currentDate;
    DomainRegistry.setDateTimeProvider(dateTimeProvider);
  });

  it('returns true for a valid session id', async () => {
    const session = UserSession.create(30, 'valid-session-id', 'user-id');
    sessionRepository.sessions = {
      [session.sessionId]: session,
    };

    const result = await validateSessionUseCase.execute('valid-session-id');
    expect(result).toBe(true);
  });

  it('returns false for an invalid session id', async () => {
    const result = await validateSessionUseCase.execute('invalid-session-id');
    expect(result).toBe(false);
  });
});
