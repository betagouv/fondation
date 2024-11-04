import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import clsx from "clsx";
import { useEffect } from "react";
import { NominationFile } from "shared-models";
import { retrieveNominationFile } from "../../../../core-logic/use-cases/nomination-file-retrieval/retrieveNominationFile.use-case";
import {
  updateNominationFile,
  UpdateNominationFileParams,
} from "../../../../core-logic/use-cases/nomination-file-update/updateNominationFile.use-case";
import { updateNominationRule } from "../../../../core-logic/use-cases/nomination-rule-update/updateNominationRule.use-case";
import { useAppDispatch, useAppSelector } from "../../hooks/react-redux";
import { selectNominationFile } from "../../selectors/selectNominationFile";
import { AutoSaveNotice } from "./AutoSaveNotice";
import { Biography } from "./Biography";
import { Comment } from "./Comment";
import { MagistratIdentity } from "./MagistratIdentity";
import { NominationRules } from "./NominationRules";
import { VMNominationFileRuleValue } from "../../../../core-logic/view-models/NominationFileVM";

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

  const onUpdateNomination = <
    T extends keyof UpdateNominationFileParams["data"],
  >(data: {
    [key in keyof UpdateNominationFileParams["data"]]: T extends key
      ? UpdateNominationFileParams["data"][key]
      : undefined;
  }) => {
    dispatch(
      updateNominationFile({
        reportId: id,
        data,
      }),
    );
  };
  const onUpdateComment = (comment: string) => {
    return onUpdateNomination<"comment">({ comment });
  };

  const onUpdateNominationRule =
    (ruleGroup: NominationFile.RuleGroup, ruleName: NominationFile.RuleName) =>
    () => {
      if (!nominationFile) return;

      const rule = nominationFile.rulesChecked[ruleGroup] as Record<
        NominationFile.RuleName,
        VMNominationFileRuleValue
      >;
      dispatch(
        updateNominationRule({
          reportId: id,
          ruleId: rule[ruleName].id,
          validated: rule[ruleName].checked,
        }),
      );
    };

  useEffect(() => {
    dispatch(retrieveNominationFile(id));
  }, [dispatch, id]);

  if (!nominationFile) return <div>Dossier de nomination non trouvé.</div>;
  return (
    <div
      className={clsx(
        "bg-light-orange",
        "gap-2",
        "justify-center",
        cx("fr-py-5v", "fr-grid-row"),
      )}
    >
      <AutoSaveNotice />
      <MagistratIdentity
        name={nominationFile.name}
        birthDate={nominationFile.birthDate}
        grade={nominationFile.grade}
        currentPosition={nominationFile.currentPosition}
        targettedPosition={nominationFile.targettedPosition}
        rank={nominationFile.rank}
      />
      <Biography biography={nominationFile.biography} />
      <NominationRules
        rulesChecked={nominationFile.rulesChecked}
        onUpdateNominationRule={onUpdateNominationRule}
      />
      <Comment comment={nominationFile.comment} onUpdate={onUpdateComment} />
    </div>
  );
};
export default NominationFileOverview;
