import { AffectationSnapshot } from 'src/nominations-context/sessions/business-logic/models/affectation';
import { getDependencies } from 'src/nominations-context/tests-dependencies';
import {
  aAffectationId,
  aDossierDeNominationId,
  aFormation,
  aTransparencyName,
  givenSomeUuids,
  importNouvelleTransparenceUseCase,
  lucLoïcReporterId,
} from './import-nouvelle-transparence.tests-setup';

describe('Affectation des rapporteurs de transparence au format tsv', () => {
  let dependencies: ReturnType<typeof getDependencies>;

  beforeEach(() => {
    dependencies = getDependencies();
    givenSomeUuids(dependencies.uuidGenerator);
  });

  it('crée une affectation des rapporteurs aux dossiers de nominations', async () => {
    await créerAffectationRapporteurs();
    expectAffectationRapporteursCréée();
  });

  const créerAffectationRapporteurs = () =>
    importNouvelleTransparenceUseCase(dependencies);

  const expectAffectationRapporteursCréée = () =>
    expect(dependencies.affectationRepository.getAffectations()).toEqual<
      AffectationSnapshot[]
    >([
      {
        id: aAffectationId,
        sessionId: aTransparencyName,
        formation: aFormation,
        affectationsDossiersDeNominations: [
          {
            dossierDeNominationId: aDossierDeNominationId,
            rapporteurIds: [lucLoïcReporterId],
          },
        ],
      },
    ]);
});
