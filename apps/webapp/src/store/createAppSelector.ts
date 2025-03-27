import { createSelector } from "@reduxjs/toolkit";
import { AppState } from "./appState";
import { Transparency } from "shared-models";

export const createAppSelector = createSelector.withTypes<AppState<boolean>>();
export const createAppSelectorFactory = <T extends string = Transparency>() =>
  createSelector.withTypes<AppState<boolean, T[]>>();
