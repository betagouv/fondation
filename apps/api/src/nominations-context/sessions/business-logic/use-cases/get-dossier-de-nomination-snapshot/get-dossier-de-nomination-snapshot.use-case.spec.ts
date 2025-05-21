import { getDependencies } from 'src/nominations-context/tests-dependencies';
import { DossierDeNominationSnapshot } from '../../models/dossier-de-nomination';

const dossierDeNominationId = 'dossier-id';
const sessionId = 'session-id';
const nominationFileImportedId = 'nomination-file-imported-id';
const dossierSnapshot: DossierDeNominationSnapshot = {
  id: dossierDeNominationId,
  sessionId,
  nominationFileImportedId,
  content: {
    folderNumber: 123,
  },
};

describe('Get Dossier De Nomination Snapshot Use Case', () => {
  let deps: ReturnType<typeof getDependencies>;

  beforeEach(() => {
    deps = getDependencies();

    deps.dossierDeNominationRepository.ajouterDossiers(dossierSnapshot);
  });

  it('returns a dossier de nomination snapshot when found', async () => {
    const snapshot = await getDossier(dossierSnapshot.id);
    expect(snapshot).toEqual(dossierSnapshot);
  });

  it('returns null when dossier is not found', async () => {
    expect(await getDossier('faux-id')).toBeNull();
  });

  const getDossier = (id: string) =>
    deps.getDossierDeNominationSnapshotUseCase.execute(id);
});
