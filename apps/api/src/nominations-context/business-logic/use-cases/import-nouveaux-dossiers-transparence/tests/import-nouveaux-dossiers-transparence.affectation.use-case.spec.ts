import { AffectationSnapshot } from '../../../models/affectation';
import { getDependencies } from '../../transparence.use-case.tests-dependencies';
import {
  aAffectationId,
  aDossierDeNominationId,
  aFormation,
  aTransparencyName,
  givenSomeUuids,
  givenUneSession,
  importNouveauxDossiersUseCase,
  lucLoïcReporterId,
  lucLoïcUser,
} from './import-nouveaux-dossiers-transparence.tests-setup';

describe('Affectation des rapporteurs de transparence au format tsv', () => {
  let dependencies: ReturnType<typeof getDependencies>;

  beforeEach(() => {
    dependencies = getDependencies();

    givenSomeUuids(dependencies.uuidGenerator);
    givenUneSession(dependencies.sessionRepository);
    dependencies.userService.addUsers(lucLoïcUser);
  });

  it('crée une affectation des rapporteurs aux dossiers de nominations', async () => {
    await créerAffectationRapporteurs();
    expectAffectationRapporteursCréée();
  });

  const créerAffectationRapporteurs = () =>
    importNouveauxDossiersUseCase(dependencies);

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
