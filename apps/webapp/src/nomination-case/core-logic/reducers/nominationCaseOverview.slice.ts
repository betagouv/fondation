import { createSlice } from "@reduxjs/toolkit";
import { AppState } from "../../store/appState";
import { retrieveNominationCase } from "../use-cases/nomination-case-retrieval/retrieveNominationCase.use-case";
import { updateNominationRule } from "../use-cases/nomination-rule-update/updateNominationRule.use-case";

const initialState: AppState["nominationCaseRetrieval"] = { byIds: null };

const nominationCaseOverviewSlice = createSlice({
  name: "nominationCase",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(retrieveNominationCase.fulfilled, (state, action) => {
      state.byIds = { ...state.byIds, [action.payload.id]: action.payload };
    });

    builder.addCase(updateNominationRule.fulfilled, (state, action) => {
      const nominationCase = state.byIds?.[action.payload.id];

      if (nominationCase)
        state.byIds = {
          ...state.byIds,
          [action.payload.id]: {
            ...nominationCase,
            preValidatedRules: {
              ...nominationCase.preValidatedRules,
              [action.payload.ruleGroup]: {
                ...nominationCase.preValidatedRules[action.payload.ruleGroup],
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
