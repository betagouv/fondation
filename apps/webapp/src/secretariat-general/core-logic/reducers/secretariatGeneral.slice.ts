import { createAction, createSlice } from "@reduxjs/toolkit";
import { routeChanged } from "../../../router/core-logic/reducers/router.slice";
import { AppState } from "../../../store/appState";
import { dataAdministrationUpload } from "../use-cases/data-administration-upload/dataAdministrationUpload.use-case";
import { getTransparence } from "../use-cases/get-transparence/get-transparence.use-case";
import { importObservantsXlsx } from "../use-cases/import-observants-xlsx/importObservantsXlsx.use-case";

export const createSecretariatGeneralSlice = <IsTest extends boolean>() => {
  const initialState: AppState<IsTest>["secretariatGeneral"] = {
    sessions: {
      transparences: {},
    },
    nouvelleTransparence: {
      acceptedMimeTypes: {
        sourceDeDonnées: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
      },
      uploadQueryStatus: "idle",
      validationError: null,
    },
    importObservants: {
      acceptedMimeTypes: {
        sourceDeDonnées: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
      },
      uploadQueryStatus: "idle",
      validationError: null,
    },
  };

  return createSlice({
    name: "secretariatGeneral",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
      builder.addCase(dataAdministrationUpload.rejected, (state) => {
        state.nouvelleTransparence.uploadQueryStatus = "rejected";
        state.nouvelleTransparence.validationError = null;
      });
      builder.addCase(dataAdministrationUpload.pending, (state) => {
        state.nouvelleTransparence.uploadQueryStatus = "pending";
        state.nouvelleTransparence.validationError = null;
      });
      builder.addCase(dataAdministrationUpload.fulfilled, (state, action) => {
        state.nouvelleTransparence.uploadQueryStatus = action.payload
          ?.validationError
          ? "rejected"
          : "fulfilled";
        state.nouvelleTransparence.validationError =
          action.payload?.validationError || null;
      });

      builder.addCase(importObservantsXlsx.rejected, (state) => {
        state.importObservants.uploadQueryStatus = "rejected";
        state.importObservants.validationError = null;
      });
      builder.addCase(importObservantsXlsx.pending, (state) => {
        state.importObservants.uploadQueryStatus = "pending";
        state.importObservants.validationError = null;
      });
      builder.addCase(importObservantsXlsx.fulfilled, (state, action) => {
        state.importObservants.uploadQueryStatus = action.payload
          ?.validationError
          ? "rejected"
          : "fulfilled";
        state.importObservants.validationError =
          action.payload?.validationError || null;
      });

      builder.addCase(routeChanged, (state) => {
        state.nouvelleTransparence.uploadQueryStatus = "idle";
        state.importObservants.uploadQueryStatus = "idle";
      });

      builder.addCase(getTransparence.fulfilled, (state, action) => {
        state.sessions.transparences[
          `${action.payload.nom}-${action.payload.formation}-${action.payload.dateTransparence.year}-${action.payload.dateTransparence.month}-${action.payload.dateTransparence.day}`
        ] = action.payload;
      });

      builder.addCase(clearImportObservants, (state) => {
        state.importObservants.uploadQueryStatus = "idle";
        state.importObservants.validationError = null;
      });
    },
  });
};

export const clearImportObservants = createAction(
  "secretariatGeneral/clearImportObservants",
);
