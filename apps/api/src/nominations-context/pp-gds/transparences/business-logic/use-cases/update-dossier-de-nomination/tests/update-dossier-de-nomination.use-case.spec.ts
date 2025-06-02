import { NominationFile, TypeDeSaisine } from 'shared-models';
import { PréAnalyseSnapshot } from 'src/nominations-context/sessions/business-logic/models/pré-analyse';
import { UpdateDossierDeNominationCommand } from '../update-dossier-de-nomination.command';
import { UpdateDossierDeNominationUseCase } from '../update-dossier-de-nomination.use-case';
import {
  aDossierDeNomination,
  commandWithModifiedRules,
  commandWithNewFolderNumber,
  commandWithNewObservers,
  commandWithDatePassageAuGrade,
  commandWithDatePriseDeFonctionPosteActuel,
  commandWithInformationCarriere,
  existingDossierDeNominationId,
  existingPréAnalyseId,
  initialRules,
} from './update-dossier-de-nomination.tests-setup';
import { getDependencies } from 'src/nominations-context/tests-dependencies';
import { DossierDeNominationSnapshot } from 'src/nominations-context/sessions/business-logic/models/dossier-de-nomination';

describe('Update dossier de nomination', () => {
  let dependencies: ReturnType<typeof getDependencies>;

  beforeEach(() => {
    dependencies = getDependencies();
    setupExistingDossierDeNomination();
  });

  it('updates an existing dossier de nomination with new observers', async () => {
    await updateDossierDeNomination(commandWithNewObservers);
    expectDossierWithNewObservers();
  });

  it('updates an existing dossier de nomination with new folder number', async () => {
    await updateDossierDeNomination(commandWithNewFolderNumber);
    expectDossierWithNewFolderNumber();
  });

  it('updates an existing dossier de nomination with modified rules', async () => {
    setupExistingPréAnalyse();
    await updateDossierDeNomination(commandWithModifiedRules);
    expectPréAnalyseWithModifiedRules();
  });

  it('updates an existing dossier de nomination with date passage au grade', async () => {
    await updateDossierDeNomination(commandWithDatePassageAuGrade);
    expectDossierWithDatePassageAuGrade();
  });

  it('updates an existing dossier de nomination with date prise de fonction poste actuel', async () => {
    await updateDossierDeNomination(commandWithDatePriseDeFonctionPosteActuel);
    expectDossierWithDatePriseDeFonctionPosteActuel();
  });

  it('updates an existing dossier de nomination with information carriere', async () => {
    await updateDossierDeNomination(commandWithInformationCarriere);
    expectDossierWithInformationCarrière();
  });

  const setupExistingDossierDeNomination = () => {
    dependencies.propropositionDeNominationTransparenceRepository.ajouterDossiers(
      aDossierDeNomination,
    );
  };

  const setupExistingPréAnalyse = () => {
    dependencies.préAnalyseRepository.addPréAnalyses({
      id: existingPréAnalyseId,
      dossierDeNominationId: existingDossierDeNominationId,
      règles: initialRules,
    });
  };

  const updateDossierDeNomination = async (
    command: UpdateDossierDeNominationCommand,
  ) => {
    await new UpdateDossierDeNominationUseCase(
      dependencies.nullTransactionPerformer,
      dependencies.propropositionDeNominationTransparenceRepository,
      dependencies.préAnalyseRepository,
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

  function expectDossierWithNewFolderNumber() {
    expectDossierWith({
      ...aDossierDeNomination,
      content: {
        ...aDossierDeNomination.content,
        folderNumber: 42,
      },
    });
  }

  function expectPréAnalyseWithModifiedRules() {
    const préAnalyses = dependencies.préAnalyseRepository.getPréAnalyses();
    expect(préAnalyses).toHaveLength(1);
    expect(préAnalyses[0]).toEqual<PréAnalyseSnapshot>({
      id: existingPréAnalyseId,
      dossierDeNominationId: existingDossierDeNominationId,
      règles: [
        {
          group: NominationFile.RuleGroup.STATUTORY,
          name: NominationFile.StatutoryRule.NOMINATION_CA_AVANT_4_ANS,
          value: true,
        },
        {
          group: NominationFile.RuleGroup.STATUTORY,
          name: NominationFile.StatutoryRule
            .RETOUR_AVANT_5_ANS_DANS_FONCTION_SPECIALISEE_OCCUPEE_9_ANS,
          value: false,
        },
      ],
    });
  }

  function expectDossierWithDatePassageAuGrade() {
    expectDossierWith({
      ...aDossierDeNomination,
      content: {
        ...aDossierDeNomination.content,
        datePassageAuGrade: { day: 15, month: 5, year: 2022 },
      },
    });
  }

  function expectDossierWithDatePriseDeFonctionPosteActuel() {
    expectDossierWith({
      ...aDossierDeNomination,
      content: {
        ...aDossierDeNomination.content,
        datePriseDeFonctionPosteActuel: { day: 10, month: 3, year: 2021 },
      },
    });
  }

  function expectDossierWithInformationCarrière() {
    expectDossierWith({
      ...aDossierDeNomination,
      content: {
        ...aDossierDeNomination.content,
        informationCarrière: "20 ans d'expérience dans la magistrature",
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
});
