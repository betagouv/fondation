import { createSlice } from "@reduxjs/toolkit";
import { AllRulesMapV2, NominationFile } from "shared-models";
import { logout } from "../../../authentication/core-logic/use-cases/logout/logout";
import { AppState } from "../../../store/appState";
import { RulesLabelsMap } from "../../adapters/primary/labels/rules-labels";
import { SummarySection } from "../../adapters/primary/labels/summary-labels";
import { deleteReportAttachedFile } from "../use-cases/report-attached-file-deletion/delete-report-attached-file";
import { generateReportFileUrl } from "../use-cases/report-file-url-generation/generate-report-file-url";
import { retrieveReport } from "../use-cases/report-retrieval/retrieveReport.use-case";
import { updateReportRule } from "../use-cases/report-rule-update/updateReportRule.use-case";
import { updateReport } from "../use-cases/report-update/updateReport.use-case";

export const createReportOverviewSlice = <IsTest extends boolean>(
  summarySections: SummarySection[],
  rulesMap: AllRulesMapV2,
  rulesLabelsMap: IsTest extends true
    ? RulesLabelsMap<{
        [NominationFile.RuleGroup.MANAGEMENT]: [];
        [NominationFile.RuleGroup.STATUTORY]: [];
        [NominationFile.RuleGroup.QUALITATIVE]: [];
      }>
    : RulesLabelsMap,
) => {
  const initialState: AppState<IsTest>["reportOverview"] = {
    queryStatus: {},
    byIds: null,
    rulesMap,
    rulesLabelsMap,
    summarySections,
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
                if (
                  ruleName ===
                  NominationFile.ManagementRule
                    .JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT
                ) {
                  if (!state.byIds![reportId]) return;

                  const mergedRuleValue =
                    state.byIds![reportId].rules[
                      NominationFile.RuleGroup.MANAGEMENT
                    ][
                      NominationFile.ManagementRule
                        .JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE
                    ];
                  mergedRuleValue.validated = validated;
                }

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

      builder.addCase(retrieveReport.pending, (state, action) => {
        state.queryStatus[action.meta.arg] = action.meta.requestStatus;
      });
      builder.addCase(retrieveReport.fulfilled, (state, action) => {
        if (action.payload) {
          state.byIds = { ...state.byIds, [action.payload.id]: action.payload };
          state.queryStatus[action.payload.id] = action.meta.requestStatus;
        }
      });
      builder.addCase(retrieveReport.rejected, (state, action) => {
        state.queryStatus[action.meta.arg] = action.meta.requestStatus;
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

      builder.addCase(logout.fulfilled, (state) => {
        state.byIds = null;
        state.queryStatus = {};
      });
    },
  });
};
