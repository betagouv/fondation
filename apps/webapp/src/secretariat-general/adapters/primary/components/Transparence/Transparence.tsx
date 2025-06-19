import { colors } from "@codegouvfr/react-dsfr";
import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import clsx from "clsx";
import { FC, useEffect } from "react";
import {
  useAppDispatch,
  useAppSelector,
} from "../../../../../reports/adapters/primary/hooks/react-redux";
import { DateOnly } from "../../../../../shared-kernel/core-logic/models/date-only";
import { parseTransparenceCompositeId } from "../../../../core-logic/models/transparence.model";
import { getTransparence } from "../../../../core-logic/use-cases/get-transparence/get-transparence.use-case";
import { selectTransparenceByCompositeId } from "../../selectors/selectTransparenceByCompositeId";
import { ImportObservantsModal } from "./ImportObservantsModal";

export interface TransparenceProps {
  id: string;
}

export const Transparence: FC<TransparenceProps> = ({ id }) => {
  const dispatch = useAppDispatch();
  const args = parseTransparenceCompositeId(id);
  const transparence = useAppSelector((state) =>
    args ? selectTransparenceByCompositeId(state, args) : undefined,
  );

  useEffect(() => {
    const args = parseTransparenceCompositeId(id);
    if (args)
      dispatch(
        getTransparence({
          nom: args.name,
          formation: args.formation,
          year: args.date.year,
          month: args.date.month,
          day: args.date.day,
        }),
      );
  }, [id, dispatch]);

  if (!args || !transparence) {
    return <div>Session de type Transparence non trouvée.</div>;
  }

  return (
    <div className={clsx(cx("fr-container"))}>
      <div className={clsx("gap-4", cx("fr-grid-row", "fr-py-8v"))}>
        <div
          className={clsx(
            "mt-4 flex flex-col justify-start gap-y-6",
            cx("fr-col-3", "fr-text--bold"),
          )}
        >
          <div>TABLEAU DE BORD</div>

          <ImportObservantsModal
            nomTransparence={transparence.nom}
            formation={args.formation}
            dateTransparence={
              new DateOnly(args.date.year, args.date.month, args.date.day)
            }
          />
        </div>

        <div
          className={clsx(
            "border-2 border-solid",
            cx("fr-px-12v", "fr-py-8v", "fr-col"),
          )}
        >
          <h1>Gérer une session</h1>

          <div
            className={clsx(
              "grid grid-flow-row grid-cols-[max-content_1fr] gap-x-8 gap-y-4",
            )}
          >
            <Label nom="Type de session" />
            <div>Transparence</div>

            <Label nom="Nom de la session" />
            <div>{transparence.nom}</div>

            <Label nom="Formation" />
            <div>{transparence.formation}</div>

            <Label nom="Date de la session" />
            <div>{transparence.dateTransparence}</div>

            <Label nom="Clôture du délai d'observation" />
            <div>{transparence.dateClôtureDélaiObservation}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Label = ({ nom }: { nom: string }) => (
  <div style={{ color: colors.options.grey._625_425.default }}>{nom}</div>
);

export default Transparence;
