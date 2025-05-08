import { allRulesMapV2, NominationFile, RulesBuilder } from 'shared-models';
import { PréAnalyseSnapshot } from '../../../models/pré-analyse';
import { getDependencies } from '../../../../tests-dependencies';
import {
  aDossierDeNominationId,
  aPréAnalyseId,
  givenSomeUuids,
  givenUneSession,
  importNouveauxDossiersUseCase,
} from './import-nouveaux-dossiers-transparence.tests-setup';

describe('Import nouveaux dossiers dans une transparence - Pré-analyse', () => {
  let dependencies: ReturnType<typeof getDependencies>;

  beforeEach(() => {
    dependencies = getDependencies();
    givenSomeUuids(dependencies.uuidGenerator);
    givenUneSession(dependencies.sessionRepository);
  });

  it("crée la pré-analyse d'un dossier de nomination", async () => {
    await créerDossiersDeNomination();
    expectPréAnalyseCréée();
  });

  async function créerDossiersDeNomination() {
    await importNouveauxDossiersUseCase(dependencies);
  }

  function expectPréAnalyseCréée() {
    const préAnalyses = dependencies.préAnalyseRepository.getPréAnalyses();
    expect(préAnalyses.map(sortPréAnalyse)).toEqual<PréAnalyseSnapshot[]>([
      préAnalyseSnapshot,
    ]);
  }
});

class PréAnalyseRules extends RulesBuilder<{
  group: string;
  name: string;
  value: boolean;
}> {
  constructor() {
    super(
      ({ ruleGroup, ruleName }) => ({
        group: ruleGroup,
        name: ruleName,
        value: [
          NominationFile.StatutoryRule
            .RETOUR_AVANT_5_ANS_DANS_FONCTION_SPECIALISEE_OCCUPEE_9_ANS,
          NominationFile.StatutoryRule.NOMINATION_CA_AVANT_4_ANS,
        ].includes(ruleName as NominationFile.StatutoryRule)
          ? // Nouvelles règles pré-validées à false par défaut
            false
          : true,
      }),
      allRulesMapV2,
    );
  }
}

const sortPréAnalyse = (préAnalyse: PréAnalyseSnapshot) => ({
  ...préAnalyse,
  règles: préAnalyse.règles.sort((a, b) => a.name.localeCompare(b.name)),
});

const préAnalyseRules = new PréAnalyseRules().build();
const préAnalyseSnapshot: PréAnalyseSnapshot = sortPréAnalyse({
  dossierDeNominationId: aDossierDeNominationId,
  id: aPréAnalyseId,
  règles: Object.values(préAnalyseRules)
    .map((rule) => Object.values(rule))
    .flat(),
});
