import { createSlice } from "@reduxjs/toolkit";
import { Editor, EditorEvents } from "@tiptap/react";
import { debounce } from "lodash";
import { AllRulesMapV2, NominationFile } from "shared-models";
import { logout } from "../../../authentication/core-logic/use-cases/logout/logout";
import { AppState } from "../../../store/appState";
import { PartialAppDependencies } from "../../../store/reduxStore";
import { extensions } from "../../adapters/primary/components/ReportOverview/TipTapEditor/extensions";
import { reportHtmlIds } from "../../adapters/primary/dom/html-ids";
import { RulesLabelsMap } from "../../adapters/primary/labels/rules-labels";
import { SummarySection } from "../../adapters/primary/labels/summary-labels";
import { attachReportFile } from "../use-cases/report-attach-file/attach-report-file";
import { deleteReportAttachedFile } from "../use-cases/report-attached-file-deletion/delete-report-attached-file";
import { generateReportFileUrl } from "../use-cases/report-file-url-generation/generate-report-file-url";
import { retrieveReport } from "../use-cases/report-retrieval/retrieveReport.use-case";
import { updateReportRule } from "../use-cases/report-rule-update/updateReportRule.use-case";
import { updateReport } from "../use-cases/report-update/updateReport.use-case";

const EDITOR_CONTENT_DEBOUNCE_TIME = 400;

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
  { reportGateway }: Pick<PartialAppDependencies["gateways"], "reportGateway">,
) => {
  const initialState: AppState<IsTest>["reportOverview"] = {
    queryStatus: {},
    byIds: null,
    editorsByIds: null,
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

          const editor = state.editorsByIds?.[reportId];
          if (!editor) return;

          if ("comment" in data) {
            if (!data.comment) {
              editor.commands.clearContent();
            } else {
              editor.commands.setContent(data.comment);
            }
          }
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
        const { reportId, file, usage } = action.meta.arg;
        const report = state.byIds?.[reportId];

        if (report) {
          const attachedFiles = (report.attachedFiles || []).concat({
            usage,
            name: file.name,
          });
          report.attachedFiles = attachedFiles;
        }
      });

      builder.addCase(attachReportFile.rejected, (state, action) => {
        const { reportId, file } = action.meta.arg;
        const report = state.byIds?.[reportId];

        if (report) {
          const attachedFiles = (report.attachedFiles || []).filter(
            (attachedFile) => attachedFile.name !== file.name,
          );
          report.attachedFiles = attachedFiles;
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

          const editor = state.editorsByIds?.[reportId];
          if (!editor) return;
          const success = editor
            .chain()
            .focus()
            .setImage({
              src: fileUri,
              alt: "capture d'écran",
              title: "capture d'écran",
            })
            .run();
          if (success) {
            report.comment = editor.getHTML();
          }
        }
      });

      builder.addCase(retrieveReport.pending, (state, action) => {
        state.queryStatus[action.meta.arg] = action.meta.requestStatus;
      });
      builder.addCase(retrieveReport.fulfilled, (state, action) => {
        if (action.payload) {
          state.byIds = { ...state.byIds, [action.payload.id]: action.payload };
          state.queryStatus[action.payload.id] = action.meta.requestStatus;

          const editorElement = document.createElement("div");
          const reportId = action.payload.id;
          editorElement.id = reportId;

          const onUpdate = async (content: EditorEvents["update"]) => {
            if (!reportGateway) return;
            await reportGateway.updateReport(reportId, {
              comment: content.editor.getHTML(),
            });
          };
          const debouncedOnUpdate = debounce(
            onUpdate,
            EDITOR_CONTENT_DEBOUNCE_TIME,
          );

          const editor = new Editor({
            element: editorElement,
            extensions,
            editable: true,
            content: action.payload.comment,
            // L'idéal serait d'utiliser editor.setOptions({ onUpdate, etc. }) dans un composant React,
            // cependant cette méthode ne fonctionne pas.
            onUpdate: debouncedOnUpdate,
            editorProps: {
              attributes: {
                "aria-labelledby": reportHtmlIds.overview.comment,
              },
            },
          });

          state.editorsByIds = {
            ...state.editorsByIds,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            [action.payload.id]: editor as any,
          };
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
