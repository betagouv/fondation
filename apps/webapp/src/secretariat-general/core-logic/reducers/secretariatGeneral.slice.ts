import { createSlice } from "@reduxjs/toolkit";
import { AppState } from "../../../store/appState";

export const createSecretariatGeneralSlice = <IsTest extends boolean>() => {
  const initialState: AppState<IsTest>["secretariatGeneral"] = {
    nouvelleTransparence: {
      acceptedMimeTypes: {
        sourceDeDonnées: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
      },
    },
  };

  return createSlice({
    name: "secretariatGeneral",
    initialState,
    reducers: {},
  });
};
