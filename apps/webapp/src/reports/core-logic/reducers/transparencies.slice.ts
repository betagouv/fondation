import { createSlice } from "@reduxjs/toolkit";
import { AppState } from "../../../store/appState";
import { getTransparencyAttachments } from "../use-cases/transparency-attachments/get-transparency-attachments";

export const createTransparenciesSlice = () => {
  const slice = createSlice({
    name: "transparencies",
    initialState: (): AppState["transparencies"] => ({
      GDS: {},
    }),
    reducers: {},
    extraReducers: (builder) => {
      builder.addCase(getTransparencyAttachments.fulfilled, (state, action) => {
        const { transparency, formation } = action.meta.arg;
        const files = action.payload;
        state.GDS[transparency] = {
          [formation]: {
            files: files.map((file) => ({
              name: file.name,
              signedUrl: file.signedUrl,
            })),
          },
        };
      });
    },
  });

  return slice;
};
