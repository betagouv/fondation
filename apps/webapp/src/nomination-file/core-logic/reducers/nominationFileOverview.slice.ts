import { createSlice } from "@reduxjs/toolkit";
import { AppState } from "../../store/appState";
import { retrieveNominationFile } from "../use-cases/nomination-file-retrieval/retrieveNominationFile.use-case";
import { updateNominationRule } from "../use-cases/nomination-rule-update/updateNominationRule.use-case";

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

    builder.addCase(updateNominationRule.fulfilled, (state, action) => {
      const nominationFile = state.byIds?.[action.payload.id];

      if (nominationFile)
        state.byIds = {
          ...state.byIds,
          [action.payload.id]: {
            ...nominationFile,
            rules: {
              ...nominationFile.rules,
              [action.payload.ruleGroup]: {
                ...nominationFile.rules[action.payload.ruleGroup],
                [action.payload.ruleName]: action.payload.validated,
              },
            },
          },
        };
    });
  },
});

export const nominationCaseRetrievalReducer =
  nominationCaseOverviewSlice.reducer;
