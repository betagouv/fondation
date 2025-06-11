import { createSlice } from "@reduxjs/toolkit";
import { AppState } from "../../../store/appState";
import { dataAdministrationUpload } from "../use-cases/data-administration-upload/dataAdministrationUpload.use-case";

export const createSecretariatGeneralSlice = <IsTest extends boolean>() => {
  const initialState: AppState<IsTest>["secretariatGeneral"] = {
    nouvelleTransparence: {
      acceptedMimeTypes: {
        sourceDeDonnées: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
      },
      uploadQueryStatus: "idle",
    },
  };

  return createSlice({
    name: "secretariatGeneral",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
      builder.addCase(dataAdministrationUpload.rejected, (state) => {
        state.nouvelleTransparence.uploadQueryStatus = "rejected";
      });
      builder.addCase(dataAdministrationUpload.pending, (state) => {
        state.nouvelleTransparence.uploadQueryStatus = "pending";
      });
      builder.addCase(dataAdministrationUpload.fulfilled, (state) => {
        state.nouvelleTransparence.uploadQueryStatus = "fulfilled";
      });
    },
  });
};
