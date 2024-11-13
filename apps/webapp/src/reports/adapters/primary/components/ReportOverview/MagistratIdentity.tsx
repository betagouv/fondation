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
>;

export const MagistratIdentity: FC<MagistratIdentityProps> = ({
  name,
  birthDate,
  grade,
  currentPosition,
  targettedPosition,
  rank,
}) => {
  return (
    <Card>
      <div className={cx("fr-h1")}>{name}</div>
      <div className={cx("fr-text--bold")}>
        {`${ReportVM.magistratIdentityLabels.currentPosition} : ${currentPosition}`}
      </div>
      <div>{`${ReportVM.magistratIdentityLabels.grade} : ${grade}`}</div>
      <div
        className={cx("fr-text--bold")}
      >{`${ReportVM.magistratIdentityLabels.targettedPosition} : ${targettedPosition}`}</div>
      <div>{`${ReportVM.magistratIdentityLabels.rank} : ${rank}`}</div>
      <div>{`${ReportVM.magistratIdentityLabels.birthDate} : ${birthDate}`}</div>
    </Card>
  );
};
