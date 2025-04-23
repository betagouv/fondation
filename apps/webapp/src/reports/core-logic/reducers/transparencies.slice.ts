import { createSlice, Slice } from "@reduxjs/toolkit";
import { AppState } from "../../../store/appState";
import { getTransparencyAttachmentsFactory } from "../use-cases/transparency-attachments/get-transparency-attachments";
import { UnionToTuple } from "type-fest";
import { Magistrat, Transparency } from "shared-models";

export const createTransparenciesSlice = <
  T extends string[] = UnionToTuple<Transparency>,
>(
  gdsTransparencies: T,
) => {
  const slice = createSlice({
    name: "transparencies",
    initialState: (): AppState["transparencies"] => ({
      GDS: gdsTransparencies.reduce(
        (acc, transparency) => {
          // Cette étape intermédiaire ajoute un peu de type-safety
          const transparencyInitialState: AppState["transparencies"]["GDS"][Transparency] =
            {
              files: {
                [Magistrat.Formation.SIEGE]: [],
                [Magistrat.Formation.PARQUET]: [],
              },
            };
          return {
            ...acc,
            [transparency]: transparencyInitialState,
          };
        },
        {} as AppState["transparencies"]["GDS"],
      ),
    }),
    reducers: {},
    extraReducers: (builder) => {
      builder.addCase(
        getTransparencyAttachmentsFactory().fulfilled,
        (state, action) => {
          const { transparency, formation } = action.meta.arg;
          const files = action.payload;
          state.GDS[transparency] = {
            files: {
              ...state.GDS[transparency].files,
              [formation]: files.map((file) => ({
                name: file.name,
                signedUrl: file.signedUrl,
              })),
            },
          };
        },
      );
    },
  });

  return slice as Slice<
    AppState<boolean, T>["transparencies"],
    (typeof slice)["caseReducers"],
    (typeof slice)["name"],
    (typeof slice)["reducerPath"],
    (typeof slice)["selectors"]
  >;
};
