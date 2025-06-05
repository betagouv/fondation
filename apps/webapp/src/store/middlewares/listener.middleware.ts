import { createListenerMiddleware } from "@reduxjs/toolkit";
import { AppState } from "../appState";
import { Listener } from "../listeners";
import { AppDispatch, PartialAppDependencies } from "../reduxStore";

export const createAppListenerMiddleware = (
  appDependencies: PartialAppDependencies,
  listeners?: Listener[],
) => {
  const listenerMiddleware = createListenerMiddleware({
    extra: appDependencies,
  });
  const startAppListening = listenerMiddleware.startListening.withTypes<
    AppState,
    AppDispatch,
    PartialAppDependencies
  >();

  listeners?.forEach((listener) => listener(startAppListening));

  return listenerMiddleware;
};
