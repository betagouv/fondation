import { createSlice } from "@reduxjs/toolkit";
import { AppState } from "../../store/appState";
import { listNominationCase } from "../use-cases/nomination-cases-listing/listNominationCase.use-case";

const initialState: AppState["nominationCaseList"] = { data: null };

const nominationCaseListSlice = createSlice({
  name: "nominationCaseList",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(listNominationCase.fulfilled, (state, action) => {
      state.data = action.payload;
    });
  },
});

export const nominationCaseListReducer = nominationCaseListSlice.reducer;
