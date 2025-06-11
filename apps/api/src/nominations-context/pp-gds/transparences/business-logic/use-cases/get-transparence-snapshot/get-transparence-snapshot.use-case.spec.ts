import { DateOnlyJson, Magistrat, TypeDeSaisine } from 'shared-models';
import { SessionSnapshot } from 'src/nominations-context/sessions/business-logic/models/session';
import { getDependencies } from 'src/nominations-context/tests-dependencies';

describe('Get Transparence Snapshot Use Case', () => {
  let deps: ReturnType<typeof getDependencies>;

  beforeEach(() => {
    deps = getDependencies();
    deps.fakeTransparenceRepository.addFakeTransparence(uneTransparence);
  });

  it('returns a transparence snapshot when transparence exists', async () => {
    const result = await deps.getTransparenceSnapshotUseCase.execute(
      uneTransparence.name,
      uneTransparence.formation,
      uneTransparence.content.dateTransparence,
    );

    expect(result).toEqual(uneTransparence);
  });

  it('returns null when transparence does not exist', async () => {
    const result = await deps.getTransparenceSnapshotUseCase.execute(
      uneTransparence.name,
      magistratFormation,
      { ...uneDateTransparence, month: 1 },
    );

    expect(result).toBeNull();
  });
});

const sessionId = 'test-transparence-id';
const magistratFormation = Magistrat.Formation.PARQUET;
const uneDateTransparence: DateOnlyJson = {
  year: 2023,
  month: 10,
  day: 15,
};
const unNomTransparence = 'Transparence GDS';

const uneTransparence = {
  id: sessionId,
  name: unNomTransparence,
  formation: magistratFormation,
  typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
  sessionImportéeId: 'session-importée-id',
  version: 1,
  content: {
    dateTransparence: uneDateTransparence,
    dateClôtureDélaiObservation: null,
  },
} satisfies SessionSnapshot<TypeDeSaisine.TRANSPARENCE_GDS>;
