import { createSlice } from "@reduxjs/toolkit";
import { AppState } from "../../store/appState";
import { listNominationFile } from "../use-cases/nomination-file-listing/listNominationFile.use-case";

const initialState: AppState["nominationCaseList"] = { data: null };

const nominationCaseListSlice = createSlice({
  name: "nominationCaseList",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(listNominationFile.fulfilled, (state, action) => {
      state.data = action.payload;
    });
  },
});

export const nominationCaseListReducer = nominationCaseListSlice.reducer;
