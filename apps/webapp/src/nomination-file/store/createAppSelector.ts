import { createSelector } from "@reduxjs/toolkit";
import { AppState } from "./appState";

export const createAppSelector = createSelector.withTypes<AppState>();
