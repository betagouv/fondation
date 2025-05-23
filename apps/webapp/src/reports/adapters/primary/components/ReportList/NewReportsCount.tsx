import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import { colorDecisions } from "@codegouvfr/react-dsfr/fr/generatedFromCss/colorDecisions";
import { FC } from "react";

export type NewReportsCountProps = {
  newReportsCount: number;
};

export const NewReportsCount: FC<NewReportsCountProps> = ({
  newReportsCount,
}) => (
  <p>
    Vous avez{" "}
    <span
      className={cx("fr-text--bold")}
      style={{
        color: colorDecisions.text.active.blueFrance.default,
      }}
    >
      {newReportsCount === 1
        ? "1 nouveau rapport"
        : `${newReportsCount} nouveaux rapports`}
    </span>{" "}
    sur cette transparence.
  </p>
);
