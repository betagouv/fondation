import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import { FC } from "react";
import { NominationFileVM } from "../../selectors/selectNominationFile";
import { Card } from "./Card";

export type MagistratIdentityProps = Pick<
  NominationFileVM,
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
        {`${NominationFileVM.magistratIdentityLabels.currentPosition} : ${currentPosition}`}
      </div>
      <div>{`${NominationFileVM.magistratIdentityLabels.grade} : ${grade}`}</div>
      <div
        className={cx("fr-text--bold")}
      >{`${NominationFileVM.magistratIdentityLabels.targettedPosition} : ${targettedPosition}`}</div>
      <div>{`${NominationFileVM.magistratIdentityLabels.rank} : ${rank}`}</div>
      <div>{`${NominationFileVM.magistratIdentityLabels.birthDate} : ${birthDate}`}</div>
    </Card>
  );
};
