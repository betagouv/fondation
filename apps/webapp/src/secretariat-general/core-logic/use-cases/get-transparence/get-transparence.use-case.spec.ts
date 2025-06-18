import {
  Magistrat,
  TransparenceSnapshotResponse,
  TypeDeSaisine,
} from "shared-models";
import { TestDependencies } from "./get-transparence.test-setup";
import { GetTransparenceParams } from "./get-transparence.use-case";

describe("Get Transparence", () => {
  let deps: TestDependencies;

  beforeEach(() => {
    deps = new TestDependencies();
  });

  it("should return transparence when client returns data", async () => {
    const key = `${params.nom}-${params.formation}-${params.year}-${params.month}-${params.day}`;
    deps.fakeTransparenceClient.fakeTransparences[key] = uneTransparence;

    await deps.getTransparence(params);

    deps.expectStoreTransparences({
      id: uneTransparence.id,
      nom: uneTransparence.name,
      formation: uneTransparence.formation,
      dateTransparence: uneTransparence.content.dateTransparence,
      dateClotureDelaiObservation:
        uneTransparence.content.dateClôtureDélaiObservation,
    });
  });

  it("should return error when client throws", async () => {
    const testError = new Error("Test error");
    deps.fakeTransparenceClient.stubError = testError;

    expect(await deps.getTransparence(params)).toMatchObject({
      type: "secretariatGeneral/getTransparence/rejected",
    });
    deps.expectStoreTransparences();
  });

  it("should return nothing when transparence not found", async () => {
    expect(await deps.getTransparence(params)).toMatchObject({
      type: "secretariatGeneral/getTransparence/rejected",
    });
    deps.expectStoreTransparences();
  });
});

const params: GetTransparenceParams = {
  nom: "AUTOMNE",
  formation: Magistrat.Formation.PARQUET,
  year: 2025,
  month: 10,
  day: 15,
};

const uneTransparence: TransparenceSnapshotResponse = {
  id: "test-id",
  sessionImportéeId: "imported-id",
  name: "AUTOMNE",
  formation: Magistrat.Formation.PARQUET,
  typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
  version: 1,
  content: {
    dateTransparence: { year: 2025, month: 10, day: 15 },
    dateClôtureDélaiObservation: { year: 2025, month: 11, day: 15 },
  },
};
