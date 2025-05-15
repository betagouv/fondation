import { createSlice } from "@reduxjs/toolkit";
import { AppState } from "../../../store/appState";
import { dataAdministrationUpload } from "../use-cases/data-administration-upload/dataAdministrationUpload.use-case";

export const createSecretariatGeneralSlice = <IsTest extends boolean>() => {
  const initialState: AppState<IsTest>["secretariatGeneral"] = {
    nouvelleTransparence: {
      acceptedMimeTypes: {
        attachedFiles: ["application/pdf", "image/jpeg", "image/png"],
      },
    },
  };

  return createSlice({
    name: "secretariatGeneral",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
      builder.addCase(dataAdministrationUpload.fulfilled, (state, action) => {
        // TODO AEB IMPLEMENT
        // const { reportId } = action.meta.arg;
        // const filesUploaded = action.payload;
        // const report = state.byIds?.[reportId];
        // if (report && report.attachedFiles) {
        //   report.attachedFiles = report.attachedFiles.map((attachedFile) => ({
        //     ...attachedFile,
        //     fileId:
        //       filesUploaded.find(({ file }) => file.name === attachedFile.name)
        //         ?.fileId || null,
        //   }));
        // }
      });
    },
  });
};
