import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import clsx from "clsx";
import { useEffect } from "react";
import { NominationFile } from "shared-models";
import { retrieveReport } from "../../../../core-logic/use-cases/report-retrieval/retrieveReport.use-case";
import {
  updateReport,
  UpdateReportParams,
} from "../../../../core-logic/use-cases/report-update/updateReport.use-case";
import { updateReportRule } from "../../../../core-logic/use-cases/report-rule-update/updateReportRule.use-case";
import { useAppDispatch, useAppSelector } from "../../hooks/react-redux";
import { selectReport } from "../../selectors/selectReport";
import { AutoSaveNotice } from "./AutoSaveNotice";
import { Biography } from "./Biography";
import { Comment } from "./Comment";
import { MagistratIdentity } from "./MagistratIdentity";
import { ReportRules } from "./ReportRules";
import { VMReportRuleValue } from "../../../../core-logic/view-models/ReportVM";
import { Observers } from "./Observers";

export type ReportOverviewProps = {
  id: string;
};

export const ReportOverview: React.FC<ReportOverviewProps> = ({ id }) => {
  const report = useAppSelector((state) => selectReport(state, id));
  const dispatch = useAppDispatch();

  const onUpdateNomination = <
    T extends keyof UpdateReportParams["data"],
  >(data: {
    [key in keyof UpdateReportParams["data"]]: T extends key
      ? UpdateReportParams["data"][key]
      : undefined;
  }) => {
    dispatch(
      updateReport({
        reportId: id,
        data,
      }),
    );
  };
  const onUpdateComment = (comment: string) => {
    return onUpdateNomination<"comment">({ comment });
  };

  const onUpdateReportRule =
    (ruleGroup: NominationFile.RuleGroup, ruleName: NominationFile.RuleName) =>
    () => {
      if (!report) return;

      const rule = report.rulesChecked[ruleGroup] as Record<
        NominationFile.RuleName,
        VMReportRuleValue
      >;
      dispatch(
        updateReportRule({
          reportId: id,
          ruleId: rule[ruleName].id,
          validated: rule[ruleName].checked,
        }),
      );
    };

  useEffect(() => {
    dispatch(retrieveReport(id));
  }, [dispatch, id]);

  if (!report) return <div>Dossier de nomination non trouvé.</div>;
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
        name={report.name}
        birthDate={report.birthDate}
        grade={report.grade}
        currentPosition={report.currentPosition}
        targettedPosition={report.targettedPosition}
        rank={report.rank}
      />
      <Biography biography={report.biography} />
      <Observers observers={report.observers} />
      <ReportRules
        rulesChecked={report.rulesChecked}
        onUpdateReportRule={onUpdateReportRule}
      />
      <Comment comment={report.comment} onUpdate={onUpdateComment} />
    </div>
  );
};
export default ReportOverview;
