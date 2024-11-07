import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import { Card } from "./Card";
import { NominationFileVM } from "../../../../core-logic/view-models/NominationFileVM";
import clsx from "clsx";

export const Observers = ({
  observers,
}: Pick<NominationFileVM, "observers">) => {
  if (!observers) return null;

  return (
    <Card>
      <label className={cx("fr-h2")} id="observers">
        Observants
      </label>
      <div
        aria-labelledby="observers"
        className={clsx(
          "whitespace-pre-line leading-10 w-full flex flex-col gap-4",
        )}
      >
        {observers.map(([observerName, ...observerInformation]) => (
          <div key={observerName}>
            <div key={observerName} className={cx("fr-text--bold")}>
              {observerName}
            </div>
            <ObserverInformation observerInformation={observerInformation} />
          </div>
        ))}
      </div>
    </Card>
  );
};

const ObserverInformation = ({
  observerInformation,
}: {
  observerInformation: string[];
}) => {
  return (
    <div aria-labelledby="observers" className="whitespace-pre-line  w-full">
      {observerInformation.map((info) => (
        <div key={info}>{info}</div>
      ))}
    </div>
  );
};
