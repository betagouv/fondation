import { createSlice } from "@reduxjs/toolkit";
import { AppState } from "../../store/appState";
import { retrieveNominationFile } from "../use-cases/nomination-file-retrieval/retrieveNominationFile.use-case";
import { updateNominationRule } from "../use-cases/nomination-rule-update/updateNominationRule.use-case";
import { NominationFile } from "shared-models";
import { updateNominationFile } from "../use-cases/nomination-file-update/updateNominationFile.use-case";

const initialState: AppState["nominationFileOverview"] = { byIds: null };

const nominationCaseOverviewSlice = createSlice({
  name: "nominationFile",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(retrieveNominationFile.fulfilled, (state, action) => {
      if (action.payload)
        state.byIds = { ...state.byIds, [action.payload.id]: action.payload };
    });

    builder.addCase(updateNominationFile.fulfilled, (state, action) => {
      const { reportId, data } = action.payload;
      const nominationFile = state.byIds?.[reportId];

      if (nominationFile) {
        state.byIds![reportId] = { ...nominationFile, ...data };
      }
    });

    builder.addCase(updateNominationRule.fulfilled, (state, action) => {
      const { reportId, ruleId, validated } = action.payload;
      const nominationFile = state.byIds?.[reportId];

      if (nominationFile) {
        Object.entries(nominationFile.rules).forEach(
          ([ruleGroup, ruleEntry]) => {
            Object.entries(ruleEntry).forEach(([ruleName, rule]) => {
              if (rule.id === ruleId) {
                state.byIds![reportId] = {
                  ...nominationFile,
                  rules: {
                    ...nominationFile.rules,
                    [ruleGroup]: {
                      ...nominationFile.rules[
                        ruleGroup as NominationFile.RuleGroup
                      ],
                      [ruleName]: {
                        ...(
                          nominationFile.rules[
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
          },
        );
      }
    });
  },
});

export const nominationCaseRetrievalReducer =
  nominationCaseOverviewSlice.reducer;
