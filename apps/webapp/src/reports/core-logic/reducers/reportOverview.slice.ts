import { createSlice } from "@reduxjs/toolkit";
import { AllRulesMapV2, NominationFile, ReportFileUsage } from "shared-models";
import { logout } from "../../../authentication/core-logic/use-cases/logout/logout";
import { AppState, ReportScreenshotSM } from "../../../store/appState";
import { RulesLabelsMap } from "../../adapters/primary/labels/rules-labels";
import { SummarySection } from "../../adapters/primary/labels/summary-labels";
import { attachReportFile } from "../use-cases/report-attach-file/attach-report-file";
import { deleteReportFile } from "../use-cases/report-attached-file-deletion/delete-report-attached-file";
import { deleteReportContentScreenshots } from "../use-cases/report-content-screenshots-deletion/delete-report-content-screenshots";
import { reportEmbedScreenshot } from "../use-cases/report-embed-screenshot/report-embed-screenshot";
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
    acceptedMimeTypes: {
      attachedFiles: ["application/pdf", "image/jpeg", "image/png"],
      embeddedScreenshots: [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ],
    },
  };

  return createSlice({
    name: "report",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
      builder.addCase(updateReport.fulfilled, (state, action) => {
        const { reportId, data } = action.meta.arg;
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

      builder.addCase(attachReportFile.fulfilled, (state, action) => {
        const { reportId, file } = action.meta.arg;
        const report = state.byIds?.[reportId];

        if (report) {
          const attachedFiles = (report.attachedFiles || []).concat({
            usage: ReportFileUsage.ATTACHMENT,
            name: file.name,
          });
          report.attachedFiles = attachedFiles;
        }
      });

      builder.addCase(reportEmbedScreenshot.pending, (state, action) => {
        const { reportId } = action.meta.arg;
        const report = state.byIds?.[reportId];

        if (report) {
          report.contentScreenshots = {
            files: report.contentScreenshots?.files || [],
            isUploading: true,
          };
        }
      });

      builder.addCase(reportEmbedScreenshot.fulfilled, (state, action) => {
        const { reportId } = action.meta.arg;
        const { file, signedUrl } = action.payload;
        const report = state.byIds?.[reportId];

        if (report) {
          const screenshot: ReportScreenshotSM = {
            name: file.name,
            signedUrl,
          };

          const currentFiles = report.contentScreenshots?.files || [];
          report.contentScreenshots = {
            files: [...currentFiles, screenshot],
            isUploading: false,
          };
        }
      });

      builder.addCase(reportEmbedScreenshot.rejected, (state, action) => {
        const { reportId } = action.meta.arg;
        const report = state.byIds?.[reportId];

        if (report) {
          report.contentScreenshots = {
            files: report.contentScreenshots?.files || [],
            isUploading: false,
          };
        }
      });

      builder.addCase(generateReportFileUrl.fulfilled, (state, action) => {
        const { reportId, fileName } = action.meta.arg;
        const fileUri = action.payload;
        const report = state.byIds?.[reportId];

        if (report) {
          const attachedFiles = report.attachedFiles || [];
          const existingFile = attachedFiles.find(
            (file) => file.name === fileName,
          );
          if (!existingFile) {
            console.error(`File ${fileName} not found in report ${reportId}`);
            return;
          }
          existingFile.signedUrl = fileUri;
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

      builder.addCase(deleteReportFile.fulfilled, (state, action) => {
        const { reportId, fileName } = action.meta.arg;
        const report = state.byIds?.[reportId];

        if (report) {
          const attachedFiles = report.attachedFiles || [];
          report.attachedFiles = attachedFiles.filter(
            (file) => file.name !== fileName,
          );
        }
      });

      builder.addCase(
        deleteReportContentScreenshots.fulfilled,
        (state, action) => {
          const { reportId, fileNames } = action.meta.arg;
          const report = state.byIds?.[reportId];

          if (report) {
            const newFiles = report.contentScreenshots?.files.filter(
              (file) => !fileNames.includes(file.name),
            );

            report.contentScreenshots = newFiles?.length
              ? {
                  files: newFiles,
                  isUploading: report.contentScreenshots?.isUploading ?? false,
                }
              : null;
          }
        },
      );

      builder.addCase(logout.fulfilled, (state) => {
        state.byIds = null;
        state.queryStatus = {};
      });
    },
  });
};
