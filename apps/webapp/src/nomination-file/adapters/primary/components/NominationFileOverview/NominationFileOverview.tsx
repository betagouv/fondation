import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/react-redux";
import { selectNominationFile } from "../../selectors/selectNominationFile";
import { retrieveNominationFile } from "../../../../core-logic/use-cases/nomination-file-retrieval/retrieveNominationFile.use-case";
import { NominationRules } from "./NominationRules";
import { updateNominationRule } from "../../../../core-logic/use-cases/nomination-rule-update/updateNominationRule.use-case";
import { RuleGroup, RuleName } from "../../../../store/appState";
import { Card } from "./Card";
import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import clsx from "clsx";
import { Biography } from "./Biography";

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
    (ruleGroup: RuleGroup, ruleName: RuleName) => () => {
      if (!nominationFile) return;
      dispatch(
        updateNominationRule({
          id,
          ruleGroup,
          ruleName,
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
