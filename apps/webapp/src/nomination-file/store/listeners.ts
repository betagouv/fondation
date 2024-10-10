import { TypedStartListening } from "@reduxjs/toolkit";
import { AppState } from "./appState";
import { AppDispatch, PartialAppDependencies } from "./reduxStore";

export type Listener = (startAppListening: StartAppListening) => void;

export type StartAppListening = TypedStartListening<
  AppState,
  AppDispatch,
  PartialAppDependencies
>;
