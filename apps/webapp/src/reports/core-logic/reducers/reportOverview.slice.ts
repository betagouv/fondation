import { createSlice } from "@reduxjs/toolkit";
import { AllRulesMap, NominationFile, allRulesMap } from "shared-models";
import { AppState } from "../../store/appState";
import { deleteReportAttachedFile } from "../use-cases/report-attached-file-deletion/delete-report-attached-file";
import { generateReportFileUrl } from "../use-cases/report-file-url-generation/generate-report-file-url";
import { retrieveReport } from "../use-cases/report-retrieval/retrieveReport.use-case";
import { updateReportRule } from "../use-cases/report-rule-update/updateReportRule.use-case";
import { updateReport } from "../use-cases/report-update/updateReport.use-case";

export const createReportOverviewSlice = (
  rulesMap: AllRulesMap = allRulesMap,
) => {
  const initialState: AppState["reportOverview"] = {
    byIds: null,
    rulesMap: rulesMap,
  };

  return createSlice({
    name: "report",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
      builder.addCase(updateReport.fulfilled, (state, action) => {
        const { reportId, data } = action.payload;
        const report = state.byIds?.[reportId];

        if (report) {
          state.byIds![reportId] = {
            ...report,
            ...data,
            comment:
              "comment" in data
                ? data.comment === ""
                  ? null
                  : data.comment || null
                : report.comment,
          };
        }
      });

      builder.addCase(updateReportRule.fulfilled, (state, action) => {
        const { reportId, ruleId, validated } = action.payload;
        const report = state.byIds?.[reportId];

        if (report) {
          Object.entries(report.rules).forEach(([ruleGroup, ruleEntry]) => {
            Object.entries(ruleEntry).forEach(([ruleName, rule]) => {
              if (rule.id === ruleId) {
                state.byIds![reportId] = {
                  ...report,
                  rules: {
                    ...report.rules,
                    [ruleGroup]: {
                      ...report.rules[ruleGroup as NominationFile.RuleGroup],
                      [ruleName]: {
                        ...(
                          report.rules[
                            ruleGroup as NominationFile.RuleGroup
                          ] as Record<
                            NominationFile.RuleName,
                            NominationFile.RuleValue
                          >
                        )[ruleName as NominationFile.RuleName],
                        validated,
                      },
                    },
                  },
                };
              }
            });
          });
        }
      });

      builder.addCase(generateReportFileUrl.fulfilled, (state, action) => {
        const { reportId, fileName } = action.meta.arg;
        const fileUri = action.payload;
        const report = state.byIds?.[reportId];

        if (report) {
          const attachedFiles = report.attachedFiles || [];
          const existingFile = attachedFiles.findIndex(
            (file) => file.name === fileName,
          );
          const otherAttachedFiles =
            existingFile === -1
              ? attachedFiles
              : attachedFiles.filter((file) => file.name !== fileName);
          report.attachedFiles = [
            ...otherAttachedFiles,
            {
              signedUrl: fileUri,
              name: fileName,
            },
          ];
        }
      });

      builder.addCase(retrieveReport.fulfilled, (state, action) => {
        if (action.payload)
          state.byIds = { ...state.byIds, [action.payload.id]: action.payload };
      });

      builder.addCase(deleteReportAttachedFile.fulfilled, (state, action) => {
        const { reportId, fileName } = action.meta.arg;
        const report = state.byIds?.[reportId];

        if (report) {
          const attachedFiles = report.attachedFiles || [];
          report.attachedFiles = attachedFiles.filter(
            (file) => file.name !== fileName,
          );
        }
      });
    },
  });
};
