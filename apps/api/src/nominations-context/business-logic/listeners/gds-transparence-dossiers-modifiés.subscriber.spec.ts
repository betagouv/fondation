import { Transparency } from 'shared-models';
import { GdsTransparenceNominationFilesModifiedEventPayload } from 'src/data-administration-context/business-logic/models/events/gds-transparence-nomination-files-modified.event';
import { getDependencies } from 'src/nominations-context/tests-dependencies';
import { UpdateDossierDeNominationCommand } from '../use-cases/update-dossier-de-nomination/update-dossier-de-nomination.command';
import { GdsTransparenceDossiersModifiésSubscriber } from './gds-transparence-dossiers-modifiés.subscriber';

describe('GDS transparence dossiers modifiés subscriber', () => {
  let dependencies: ReturnType<typeof getDependencies>;

  beforeEach(() => {
    dependencies = getDependencies();
    dependencies.updateDossierDeNominationUseCase.execute = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('appelle le use case', async () => {
    await listenEvent();
    expectUpdateDossierDeNominationUseCaseCalled();
  });

  const listenEvent = () =>
    new GdsTransparenceDossiersModifiésSubscriber(
      dependencies.updateDossierDeNominationUseCase,
    ).handle(payload);

  const expectUpdateDossierDeNominationUseCaseCalled = () => {
    expect(
      dependencies.updateDossierDeNominationUseCase.execute,
    ).toHaveBeenCalledExactlyOnceWith(
      UpdateDossierDeNominationCommand.create(payload),
    );
  };
});

const payload: GdsTransparenceNominationFilesModifiedEventPayload = {
  transparenceId: 'transparence-id',
  transparenceName: Transparency.AUTOMNE_2024,
  nominationFiles: [
    {
      nominationFileId: 'dossier-id-123',
      content: {
        folderNumber: 42,
      },
    },
  ],
};
