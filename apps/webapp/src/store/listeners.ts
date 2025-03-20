import { TypedStartListening } from "@reduxjs/toolkit";
import { AppState } from "./appState";
import { AppDispatch, PartialAppDependencies } from "./reduxStore";

export type Listener = (startAppListening: StartAppListening) => void;

export type AppListeners = {
  initializeAuthenticationState: Listener;
  redirectOnRouteChange: Listener;
  redirectOnLogout: Listener;
  redirectOnLogin: Listener;
  reportFileAttached: Listener;
  preloadReportsRetrieval: Listener;
};

export type StartAppListening = TypedStartListening<
  AppState,
  AppDispatch,
  PartialAppDependencies
>;
