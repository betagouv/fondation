import { createListenerMiddleware } from "@reduxjs/toolkit";
import { AppState } from "../appState";
import { Listener } from "../listeners";
import { AppDependencies, AppDispatch } from "../reduxStore";

export const createAppListenerMiddleware = (
  appDependencies: AppDependencies,
  listeners?: Listener[],
) => {
  const listenerMiddleware = createListenerMiddleware({
    extra: appDependencies,
  });
  const startAppListening = listenerMiddleware.startListening.withTypes<
    AppState,
    AppDispatch,
    AppDependencies
  >();

  listeners?.forEach((listener) => listener(startAppListening));

  return listenerMiddleware;
};
