import { Magistrat } from "shared-models";
import { TransparenceSM } from "../../../../store/appState";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import { getTransparence } from "../../../core-logic/use-cases/get-transparence/get-transparence.use-case";
import { selectTransparenceByCompositeId } from "./selectTransparenceByCompositeId";
import { DateOnlyStoreModel } from "../../../../shared-kernel/core-logic/models/date-only";

const mockTransparence: TransparenceSM = {
  id: "trans1",
  nom: "AUTOMNE",
  formation: Magistrat.Formation.SIEGE,
  dateTransparence: { year: 2025, month: 10, day: 15 },
  dateClotureDelaiObservation: { year: 2025, month: 11, day: 15 },
};

describe("Select Transparence By Composite Id", () => {
  let store: ReduxStore;

  beforeEach(() => {
    store = initReduxStore({}, {}, {});
    store.dispatch(
      getTransparence.fulfilled(mockTransparence, "", {
        nom: mockTransparence.nom,
        formation: mockTransparence.formation,
        year: mockTransparence.dateTransparence.year,
        month: mockTransparence.dateTransparence.month,
        day: mockTransparence.dateTransparence.day,
      }),
    );
  });

  it("should find a transparence by name, formation and date", () => {
    const result = selectTransparence();
    expect(result).toEqual(mockTransparence);
  });

  it("should return undefined when no matching transparence is found", () => {
    const name = "PRINTEMPS";
    const result = selectTransparence({ name });
    expect(result).toBeUndefined();
  });

  it("should return undefined when formation doesn't match", () => {
    const formation = Magistrat.Formation.PARQUET;
    const result = selectTransparence({ formation });
    expect(result).toBeUndefined();
  });

  const selectTransparence = (
    args?: Partial<{
      name: string;
      formation: Magistrat.Formation;
      date: DateOnlyStoreModel;
    }>,
  ) =>
    selectTransparenceByCompositeId(store.getState(), {
      name: args?.name || mockTransparence.nom,
      formation: args?.formation || mockTransparence.formation,
      date: args?.date || mockTransparence.dateTransparence,
    });
});
