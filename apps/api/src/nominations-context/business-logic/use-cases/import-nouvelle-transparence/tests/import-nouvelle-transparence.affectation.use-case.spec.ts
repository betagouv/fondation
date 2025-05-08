import { AffectationSnapshot } from '../../../models/affectation';
import { getDependencies } from '../../../../tests-dependencies';
import {
  aAffectationId,
  aDossierDeNominationId,
  aFormation,
  aTransparencyName,
  givenSomeUuids,
  importNouvelleTransparenceUseCase,
  lucLoïcReporterId,
  lucLoïcUser,
} from './import-nouvelle-transparence.tests-setup';

describe('Affectation des rapporteurs de transparence au format tsv', () => {
  let dependencies: ReturnType<typeof getDependencies>;

  beforeEach(() => {
    dependencies = getDependencies();
    givenSomeUuids(dependencies.uuidGenerator);
    dependencies.userService.addUsers(lucLoïcUser);
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
