import { NominationFile } from 'shared-models';
import { PréAnalyseSnapshot } from 'src/nominations-context/business-logic/models/pré-analyse';
import { DossierDeNominationSnapshot } from '../../../models/dossier-de-nomination';
import { getDependencies } from '../../../../tests-dependencies';
import { UpdateDossierDeNominationCommand } from '../update-dossier-de-nomination.command';
import { UpdateDossierDeNominationUseCase } from '../update-dossier-de-nomination.use-case';
import {
  aDossierDeNomination,
  commandWithModifiedRules,
  commandWithNewFolderNumber,
  commandWithNewObservers,
  existingDossierDeNominationId,
  existingPréAnalyseId,
  initialRules,
} from './update-dossier-de-nomination.tests-setup';

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

  const setupExistingDossierDeNomination = () => {
    dependencies.dossierDeNominationRepository.ajouterDossiers(
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
      dependencies.dossierDeNominationRepository,
      dependencies.préAnalyseRepository,
    ).execute(command);
  };

  function expectDossierWithNewObservers() {
    const dossiers = dependencies.dossierDeNominationRepository.getDossiers();
    expect(dossiers).toHaveLength(1);
    expect(dossiers[0]).toEqual<DossierDeNominationSnapshot>({
      ...aDossierDeNomination,
      content: {
        ...aDossierDeNomination.content,
        observers: ['observer-1', 'observer-2'],
      },
    });
  }

  function expectDossierWithNewFolderNumber() {
    const dossiers = dependencies.dossierDeNominationRepository.getDossiers();
    expect(dossiers).toHaveLength(1);
    expect(dossiers[0]).toEqual<DossierDeNominationSnapshot>({
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
});
