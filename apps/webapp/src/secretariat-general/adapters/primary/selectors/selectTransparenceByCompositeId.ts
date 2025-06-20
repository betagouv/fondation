import { Magistrat } from "shared-models";
import { formationToLabel } from "../../../../reports/adapters/primary/labels/labels-mappers";
import {
  DateOnly,
  DateOnlyStoreModel,
} from "../../../../shared-kernel/core-logic/models/date-only";
import { createAppSelector } from "../../../../store/createAppSelector";
import { getTransparenceCompositeId } from "../../../core-logic/models/transparence.model";

export type TransparenceVM = {
  nom: string;
  formation: string;
  dateTransparence: string;
  dateClôtureDélaiObservation: string;
};

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
  (transparences, { name, formation, date }): TransparenceVM | undefined => {
    const compositeId = getTransparenceCompositeId(name, formation, date);
    const transparence = transparences[compositeId];

    if (!transparence) return;

    return {
      nom: transparence.nom,
      formation: formationToLabel(transparence.formation),
      dateTransparence: dateJsonToLabel(transparence.dateTransparence),
      dateClôtureDélaiObservation: dateJsonToLabel(
        transparence.dateClotureDelaiObservation,
      ),
    };
  },
);

const dateJsonToLabel = (date: DateOnlyStoreModel): string => {
  return DateOnly.fromStoreModel(date).toFormattedString("dd/MM/yyyy");
};
