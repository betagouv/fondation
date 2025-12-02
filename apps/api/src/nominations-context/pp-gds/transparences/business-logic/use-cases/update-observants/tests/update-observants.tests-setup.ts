import { Magistrat } from 'shared-models';
import { DossierDeNominationSnapshot } from 'shared-models/models/session/dossier-de-nomination';
import { TransparenceXlsxObservantsImportésEventPayload } from 'src/data-administration-context/transparence-xlsx/business-logic/models/events/transparence-xlsx-observants-importés.event';
import { getDependencies as getContextDependencies } from 'src/nominations-context/tests-dependencies';
import { UpdateObservantsCommand } from '../update-observants.command';
import { UpdateObservantsUseCase } from '../update-observants.use-case';

export const existingDossierDeNominationId =
  'existing-dossier-de-nomination-id';
export const dossierDeNominationImportedId =
  'dossier-de-nomination-imported-id';

export const nominationFileModificationWithObservers: TransparenceXlsxObservantsImportésEventPayload['dossiersDeNominations'][number] =
  {
    dossierId: dossierDeNominationImportedId,
    observants: ['observer-1', 'observer-2'],
  };

export const commandWithNewObservers = new UpdateObservantsCommand(
  'transparency-id',
  [nominationFileModificationWithObservers],
);

export const aDossierDeNomination: DossierDeNominationSnapshot = {
  id: existingDossierDeNominationId,
  nominationFileImportedId: dossierDeNominationImportedId,
  sessionId: 'un-id-de-session',
  content: {
    folderNumber: 1,
    formation: null,
    observers: [],
    biography: 'Nominee biography',
    birthDate: { day: 1, month: 1, year: 1980 },
    currentPosition: 'Current position',
    targetedPosition: 'Target position',
    dueDate: { day: 1, month: 6, year: 2023 },
    grade: Magistrat.Grade.I,
    name: 'Nominee Name',
    rank: 'A',
    lastRankingDate: null,
    lastPositionDate: null,
  },
};

export const getDependencies = () => {
  const dependencies = getContextDependencies();

  const setupExistingDossierDeNomination = () => {
    dependencies.propropositionDeNominationTransparenceRepository.ajouterDossiers(
      aDossierDeNomination,
    );
  };

  const updateObservants = async (command: UpdateObservantsCommand) => {
    await new UpdateObservantsUseCase(
      dependencies.nullTransactionPerformer,
      dependencies.propropositionDeNominationTransparenceRepository,
    ).execute(command);
  };

  function expectDossierWithNewObservers() {
    expectDossierWith({
      ...aDossierDeNomination,
      content: {
        ...aDossierDeNomination.content,
        observers: ['observer-1', 'observer-2'],
      },
    });
  }

  function expectDossierWith(dossierDeNomination: DossierDeNominationSnapshot) {
    const dossiers =
      dependencies.propropositionDeNominationTransparenceRepository.getDossiers();
    expect(dossiers).toHaveLength(1);
    expect(dossiers[0]).toEqual(dossierDeNomination);
  }

  return {
    setupExistingDossierDeNomination,
    updateDossierDeNomination: updateObservants,
    expectDossierWithNewObservers,
    aDossierDeNomination,
    nominationFileModificationWithObservers,
    commandWithNewObservers,
    ...dependencies,
  };
};
