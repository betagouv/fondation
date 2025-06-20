import { TransparenceXlsxObservantsImportésEventPayload } from 'src/data-administration-context/transparence-xlsx/business-logic/models/events/transparence-xlsx-observants-importés.event';
import { getDependencies } from 'src/nominations-context/tests-dependencies';
import { UpdateObservantsCommand } from '../use-cases/update-observants/update-observants.command';
import { TransparenceXlsxObservantsImportésSubscriber } from './transparence-xlsx-observants-importés.subscriber';

describe('Transparence XLSX observants importés subscriber', () => {
  let dependencies: ReturnType<typeof getDependencies>;

  beforeEach(() => {
    dependencies = getDependencies();
    dependencies.updateObservantsUseCase.execute = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('appelle le use case', async () => {
    await listenEvent();
    expectUpdateObservantsUseCaseCalled();
  });

  const listenEvent = () =>
    new TransparenceXlsxObservantsImportésSubscriber(
      dependencies.updateObservantsUseCase,
    ).handle(payload);

  const expectUpdateObservantsUseCaseCalled = () => {
    expect(
      dependencies.updateObservantsUseCase.execute,
    ).toHaveBeenCalledExactlyOnceWith(UpdateObservantsCommand.create(payload));
  };
});

const payload: TransparenceXlsxObservantsImportésEventPayload = {
  transparenceId: 'transparence-id',
  dossiersDeNominations: [
    {
      dossierId: 'dossier-id-123',
      observants: ['un observant'],
    },
  ],
};
