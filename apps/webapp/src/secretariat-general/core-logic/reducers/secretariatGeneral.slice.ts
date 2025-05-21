import { createSlice } from "@reduxjs/toolkit";
import { AppState } from "../../../store/appState";

export const createSecretariatGeneralSlice = <IsTest extends boolean>() => {
  const initialState: AppState<IsTest>["secretariatGeneral"] = {
    nouvelleTransparence: {
      acceptedMimeTypes: {
        attachedFiles: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
      },
    },
  };

  return createSlice({
    name: "secretariatGeneral",
    initialState,
    reducers: {},
    // extraReducers: (builder) => {
    //   builder.addCase(dataAdministrationUpload.fulfilled, (state, action) => {
    //   });
    // },
  });
};
