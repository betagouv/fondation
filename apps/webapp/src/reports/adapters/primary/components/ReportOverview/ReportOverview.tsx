import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import clsx from "clsx";
import { useEffect } from "react";
import { NominationFile } from "shared-models";
import { attachReportFile } from "../../../../core-logic/use-cases/report-attach-file/attach-report-file";
import { deleteReportAttachedFile } from "../../../../core-logic/use-cases/report-attached-file-deletion/delete-report-attached-file";
import { retrieveReport } from "../../../../core-logic/use-cases/report-retrieval/retrieveReport.use-case";
import { updateReportRule } from "../../../../core-logic/use-cases/report-rule-update/updateReportRule.use-case";
import {
  ReportStateUpdateParam,
  updateReport,
  UpdateReportParams,
} from "../../../../core-logic/use-cases/report-update/updateReport.use-case";
import { VMReportRuleValue } from "../../../../core-logic/view-models/ReportVM";
import { useAppDispatch, useAppSelector } from "../../hooks/react-redux";
import { selectReport } from "../../selectors/selectReport";
import { AttachedFileUpload } from "./AttachedFileUpload";
import { AutoSaveNotice } from "./AutoSaveNotice";
import { Biography } from "./Biography";
import { ReportEditor } from "./ReportEditor";
import { MagistratIdentity } from "./MagistratIdentity";
import { Observers } from "./Observers";
import { ReportOverviewState } from "./ReportOverviewState";
import { ReportRules } from "./ReportRules";
import { Summary } from "./Summary";
import {
  BreadcrumCurrentPage,
  selectBreadcrumb,
} from "../../../../../router/adapters/selectors/selectBreadcrumb";
import { Breadcrumb } from "../../../../../shared-kernel/adapters/primary/react/Breadcrumb";

export type ReportOverviewProps = {
  id: string;
};

export const ReportOverview: React.FC<ReportOverviewProps> = ({ id }) => {
  const report = useAppSelector((state) => selectReport(state, id));
  const currentPage = {
    name: BreadcrumCurrentPage.gdsReport,
    reportId: id,
  } as const;
  const breadcrumb = useAppSelector((state) =>
    selectBreadcrumb(state, currentPage),
  );
  const dispatch = useAppDispatch();

  const onUpdateReport = <T extends keyof UpdateReportParams["data"]>(data: {
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
    return onUpdateReport<"comment">({ comment });
  };

  const onUpdateState = (state: ReportStateUpdateParam) => {
    return onUpdateReport<"state">({ state });
  };

  const onUpdateReportRule =
    (ruleGroup: NominationFile.RuleGroup, ruleName: NominationFile.RuleName) =>
    () => {
      if (!report) return;

      const rule = {
        ...report.rulesChecked[ruleGroup].selected,
        ...report.rulesChecked[ruleGroup].others,
      } as Record<NominationFile.RuleName, VMReportRuleValue>;
      dispatch(
        updateReportRule({
          reportId: id,
          ruleId: rule[ruleName].id,
          validated: rule[ruleName].checked,
        }),
      );
    };

  const onFileAttached = (file: File) => {
    dispatch(attachReportFile({ reportId: id, file }));
  };

  const onAttachedFileDeleted = (fileName: string) => {
    dispatch(deleteReportAttachedFile({ reportId: id, fileName }));
  };

  useEffect(() => {
    dispatch(retrieveReport(id));
  }, [dispatch, id]);

  if (!report)
    return (
      <div>
        <Breadcrumb
          id="report-breadcrumb"
          ariaLabel="Fil d'Ariane du rapport"
          breadcrumb={breadcrumb}
        />
        Rapport non trouvé.
      </div>
    );
  return (
    <div className={clsx("flex-col items-center", cx("fr-grid-row"))}>
      <div className="w-full">
        <Breadcrumb
          id="report-breadcrumb"
          ariaLabel="Fil d'Ariane du rapport"
          breadcrumb={breadcrumb}
        />
      </div>
      <AutoSaveNotice />
      <div
        className={clsx(
          "scroll-smooth",
          cx("fr-grid-row", "fr-grid-row--center", "fr-py-12v"),
        )}
      >
        <div
          className={clsx(
            "hidden md:block",
            cx("fr-col-md-5", "fr-col-lg-4", "fr-col-xl-3"),
          )}
        >
          <Summary summary={report.summary} />
        </div>
        <div
          className={clsx(
            "flex-col gap-2",
            cx(
              "fr-grid-row",
              "fr-col-10",
              "fr-col-md-5",
              "fr-col-lg-6",
              "fr-col-xl-8",
            ),
          )}
        >
          <ReportOverviewState
            state={report.state}
            onUpdateState={onUpdateState}
          />
          <MagistratIdentity
            name={report.name}
            birthDate={report.birthDate}
            grade={report.grade}
            currentPosition={report.currentPosition}
            targettedPosition={report.targettedPosition}
            rank={report.rank}
          />
          <Biography biography={report.biography} />
          <ReportEditor comment={report.comment} onUpdate={onUpdateComment} />
          <Observers observers={report.observers} />
          <ReportRules
            rulesChecked={report.rulesChecked}
            onUpdateReportRule={onUpdateReportRule}
          />
          <AttachedFileUpload
            attachedFiles={report.attachedFiles}
            onFileAttached={onFileAttached}
            onAttachedFileDeleted={onAttachedFileDeleted}
          />
        </div>
      </div>
    </div>
  );
};

export default ReportOverview;
