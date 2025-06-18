import { Magistrat } from "shared-models";
import { createAppSelector } from "../../../../store/createAppSelector";
import { DateOnlyStoreModel } from "../../../../shared-kernel/core-logic/models/date-only";
import { getTransparenceCompositeId } from "../../../core-logic/models/transparence.model";
import { TransparenceSM } from "../../../../store/appState";

export const selectTransparenceByCompositeId = createAppSelector(
  [
    (state) => state.secretariatGeneral.sessions.transparences,
    (
      _,
      args: {
        name: string;
        formation: Magistrat.Formation;
        date: DateOnlyStoreModel;
      },
    ) => args,
  ],
  (transparences, { name, formation, date }): TransparenceSM | undefined => {
    const compositeId = getTransparenceCompositeId(name, formation, date);
    return transparences[compositeId];
  },
);
