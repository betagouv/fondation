import { NominationFile } from "@/shared-models";
import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import clsx from "clsx";
import { useEffect } from "react";
import { retrieveNominationFile } from "../../../../core-logic/use-cases/nomination-file-retrieval/retrieveNominationFile.use-case";
import { updateNominationRule } from "../../../../core-logic/use-cases/nomination-rule-update/updateNominationRule.use-case";
import { useAppDispatch, useAppSelector } from "../../hooks/react-redux";
import { selectNominationFile } from "../../selectors/selectNominationFile";
import { Biography } from "./Biography";
import { Card } from "./Card";
import { NominationRules } from "./NominationRules";

export type NominationFileOverviewProps = {
  id: string;
};

export const NominationFileOverview: React.FC<NominationFileOverviewProps> = ({
  id,
}) => {
  const nominationFile = useAppSelector((state) =>
    selectNominationFile(state, id),
  );
  const dispatch = useAppDispatch();

  const onUpdateNominationRule =
    (
      ruleGroup: NominationFile.RuleGroup.MANAGEMENT,
      ruleName: NominationFile.RuleName,
    ) =>
    () => {
      if (!nominationFile) return;
      console.log(
        "ruleGroup",
        ruleGroup,
        "ruleName",
        ruleName,
        nominationFile.rulesChecked[ruleGroup][ruleName],
      );
      dispatch(
        updateNominationRule({
          reportId: id,
          ruleId: nominationFile.rulesChecked[ruleGroup][ruleName].id,
          validated: nominationFile.rulesChecked[ruleGroup][ruleName].checked,
        }),
      );
    };

  useEffect(() => {
    dispatch(retrieveNominationFile(id));
  }, [dispatch, id]);

  if (!nominationFile) return <div>Nomination case not found</div>;
  return (
    <div
      className={clsx(
        "bg-light-orange",
        "gap-2",
        "justify-center",
        cx("fr-py-5v", "fr-grid-row"),
      )}
    >
      <Card>
        <div className={cx("fr-h1")}>{nominationFile.name}</div>
      </Card>
      <Biography biography={nominationFile.biography} />
      <Card>
        <NominationRules
          rulesChecked={nominationFile.rulesChecked}
          onUpdateNominationRule={onUpdateNominationRule}
        />
      </Card>
    </div>
  );
};
export default NominationFileOverview;
