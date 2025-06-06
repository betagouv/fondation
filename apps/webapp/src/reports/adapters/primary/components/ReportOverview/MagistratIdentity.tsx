import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import { FC } from "react";
import { Card } from "./Card";
import { ReportVM } from "../../../../core-logic/view-models/ReportVM";

export type MagistratIdentityProps = Pick<
  ReportVM,
  | "name"
  | "birthDate"
  | "grade"
  | "currentPosition"
  | "targettedPosition"
  | "rank"
  | "dureeDuPoste"
>;

export const MagistratIdentity: FC<MagistratIdentityProps> = ({
  name,
  birthDate,
  grade,
  currentPosition,
  targettedPosition,
  dureeDuPoste,
  rank,
}) => {
  return (
    <Card label="Identité du magistrat">
      <h1>{name}</h1>
      <div>
        <span
          className={cx("fr-text--bold")}
        >{`${ReportVM.magistratIdentityLabels.currentPosition} : `}</span>
        <span>{`${currentPosition} - ${grade}`}</span>
      </div>
      {dureeDuPoste && (
        <div>
          <span
            className={cx("fr-text--bold")}
          >{`${ReportVM.magistratIdentityLabels.dureeDuPoste} : `}</span>
          <span>{dureeDuPoste}</span>
        </div>
      )}
      <div>
        <span
          className={cx("fr-text--bold")}
        >{`${ReportVM.magistratIdentityLabels.targettedPosition} : `}</span>
        <span>{`${targettedPosition}`}</span>
      </div>
      <div>
        <span
          className={cx("fr-text--bold")}
        >{`${ReportVM.magistratIdentityLabels.rank} : `}</span>
        <span>{`${rank}`}</span>
      </div>
      <div>
        <span
          className={cx("fr-text--bold")}
        >{`${ReportVM.magistratIdentityLabels.birthDate} : `}</span>
        <span>{`${birthDate}`}</span>
      </div>
    </Card>
  );
};
