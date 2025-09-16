import { Magistrat, TypeDeSaisine } from 'shared-models';
import { ContenuPropositionDeNominationTransparenceV2 } from 'shared-models/models/session/contenu-transparence-par-version/proposition-content';
import { DossierDeNominationSnapshot } from 'shared-models/models/session/dossier-de-nomination-content';
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

export const aDossierDeNomination: DossierDeNominationSnapshot<
  TypeDeSaisine.TRANSPARENCE_GDS,
  ContenuPropositionDeNominationTransparenceV2
> = {
  id: existingDossierDeNominationId,
  nominationFileImportedId: dossierDeNominationImportedId,
  sessionId: 'un-id-de-session',
  content: {
    version: 2,
    numeroDeDossier: 1,
    observants: [],
    historique: 'Nominee biography',
    dateDeNaissance: { day: 1, month: 1, year: 1980 },
    posteActuel: 'Current position',
    posteCible: 'Target position',
    dateEchéance: { day: 1, month: 6, year: 2023 },
    grade: Magistrat.Grade.I,
    nomMagistrat: 'Nominee Name',
    rang: 'A',
    datePassageAuGrade: null,
    datePriseDeFonctionPosteActuel: null,
    informationCarrière: null,
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
        observants: ['observer-1', 'observer-2'],
      },
    });
  }

  function expectDossierWith(
    dossierDeNomination: DossierDeNominationSnapshot<TypeDeSaisine.TRANSPARENCE_GDS>,
  ) {
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
