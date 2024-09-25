import { createSlice } from "@reduxjs/toolkit";
import { AppState } from "../../store/appState";
import { retrieveNominationCase } from "../use-cases/nomination-case-retrieval/retrieveNominationCase.use-case";

const initialState: AppState["nominationCaseRetrieval"] = { byIds: null };

const nominationCaseRetrievalSlice = createSlice({
  name: "nominationCase",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(retrieveNominationCase.fulfilled, (state, action) => {
      state.byIds = { ...state.byIds, [action.payload.id]: action.payload };
    });
  },
});

export const nominationCaseRetrievalReducer =
  nominationCaseRetrievalSlice.reducer;
