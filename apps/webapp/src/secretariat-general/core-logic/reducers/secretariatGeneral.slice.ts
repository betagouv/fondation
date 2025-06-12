import { createSlice } from "@reduxjs/toolkit";
import { AppState } from "../../../store/appState";
import { dataAdministrationUpload } from "../use-cases/data-administration-upload/dataAdministrationUpload.use-case";
import { routeChanged } from "../../../router/core-logic/reducers/router.slice";
import { routeSegments } from "../../../router/core-logic/models/routeSegments";

export const createSecretariatGeneralSlice = <IsTest extends boolean>() => {
  const initialState: AppState<IsTest>["secretariatGeneral"] = {
    nouvelleTransparence: {
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
      builder.addCase(routeChanged, (state, action) => {
        if (action.payload.includes(routeSegments.sgNouvelleTransparence)) {
          state.nouvelleTransparence.uploadQueryStatus = "idle";
        }
      });
    },
  });
};
