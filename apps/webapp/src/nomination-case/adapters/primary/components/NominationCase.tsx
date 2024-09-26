import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../hooks/react-redux";
import { selectNominationCase } from "../presenters/selectNominationCase";
import { retrieveNominationCase } from "../../../core-logic/use-cases/nomination-case-retrieval/retrieveNominationCase.use-case";
import { NominationRules } from "./NominationRules";
import { updateNominationRule } from "../../../core-logic/use-cases/nomination-rule-update/updateNominationRule.use-case";
import { RuleGroup, RuleName } from "../../../store/appState";

export type NominationCaseOverviewProps = {
  id: string;
};

export const NominationCaseOverview: React.FC<NominationCaseOverviewProps> = ({
  id,
}) => {
  const nominationCase = useAppSelector((state) =>
    selectNominationCase(state, id)
  );
  const dispatch = useAppDispatch();

  const onUpdateNominationRule =
    (ruleGroup: RuleGroup, ruleName: RuleName) => () => {
      if (!nominationCase) return;
      dispatch(
        updateNominationRule({
          id,
          ruleGroup,
          ruleName,
          validated: nominationCase.rulesChecked[ruleGroup][ruleName].checked,
        })
      );
    };

  useEffect(() => {
    dispatch(retrieveNominationCase(id));
  }, [dispatch, id]);

  if (!nominationCase) return <div>Nomination case not found</div>;
  return (
    <div>
      <h1>{nominationCase.name}</h1>
      <p>{nominationCase.biography}</p>
      <div>
        <NominationRules
          rulesChecked={nominationCase.rulesChecked}
          onUpdateNominationRule={onUpdateNominationRule}
        />
      </div>
    </div>
  );
};
