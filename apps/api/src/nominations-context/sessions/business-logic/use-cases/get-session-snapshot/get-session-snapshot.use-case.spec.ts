import { Magistrat, TypeDeSaisine } from 'shared-models';
import { getDependencies } from 'src/nominations-context/tests-dependencies';
import { SessionSnapshot } from '../../models/session';

describe('Get Session Snapshot Use Case', () => {
  let deps: ReturnType<typeof getDependencies>;

  beforeEach(() => {
    deps = getDependencies();

    deps.sessionRepository.fakeSessions = {
      [sessionId]: sessionSnapshot,
    };
  });

  it('returns a session snapshot when session exists', async () => {
    const result = await deps.getSessionSnapshotUseCase.execute(sessionId);
    expect(result).toEqual(sessionSnapshot);
  });

  it('returns null when session does not exist', async () => {
    const result =
      await deps.getSessionSnapshotUseCase.execute(sessionImportéeId);
    expect(result).toBeNull();
  });
});

const sessionId = 'test-session-id';
const sessionImportéeId = 'test-data-administration-import-id';
const sessionName = 'Test Session';
const typeDeSaisine = TypeDeSaisine.TRANSPARENCE_GDS;
const formation = Magistrat.Formation.PARQUET;

const sessionSnapshot: SessionSnapshot = {
  id: sessionId,
  sessionImportéeId,
  name: sessionName,
  formation,
  typeDeSaisine,
  version: 1,
  content: {},
};
