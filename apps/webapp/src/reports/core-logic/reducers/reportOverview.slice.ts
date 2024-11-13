import { createSlice } from "@reduxjs/toolkit";
import { NominationFile } from "shared-models";
import { AppState } from "../../store/appState";
import { retrieveReport } from "../use-cases/report-retrieval/retrieveReport.use-case";
import { updateReportRule } from "../use-cases/report-rule-update/updateReportRule.use-case";
import { updateReport } from "../use-cases/report-update/updateReport.use-case";

const initialState: AppState["reportOverview"] = { byIds: null };

const reportOverviewSlice = createSlice({
  name: "report",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(retrieveReport.fulfilled, (state, action) => {
      if (action.payload)
        state.byIds = { ...state.byIds, [action.payload.id]: action.payload };
    });

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
  },
});

export const reportRetrievalReducer = reportOverviewSlice.reducer;
