import { Role } from "shared-models";
import { authenticationStateInitFromStore } from "../../../authentication/core-logic/reducers/authentication.slice";
import { Listener } from "../../../store/listeners";
import { routeChanged } from "../reducers/router.slice";
import { routeSegments } from "../models/routeSegments";
import { AppState } from "../../../store/appState";
import { UnknownAction } from "@reduxjs/toolkit";

export const redirectOnRouteChange: Listener = (startAppListening) => {
  return startAppListening({
    predicate: (action) =>
      action.type === routeChanged.type ||
      action.type === authenticationStateInitFromStore.type,
    effect: async (
      action,
      {
        getState,
        extra: {
          providers: { routerProvider },
        },
      },
    ) => {
      if (!routerProvider) throw new Error("routerProvider is not defined");
      const state = getState();
      if (!state.authentication.initializedFromPersistence) return;

      // We use the stored authentication state because it could
      // have changed in another tab or window.
      const authenticated = state.authentication.authenticated;
      const isAdjointSecrétaireGénéral = isSecrétariatGénéral(state, action);
      const isMembreDuConseil = getIsMembreDuConseil(state, action);

      const gotToDefaultAuthPage = isAdjointSecrétaireGénéral
        ? routerProvider.goToSgDashboard
        : routerProvider.goToTransparencies;

      if (action.type === authenticationStateInitFromStore.type) {
        const { current: currentHref } = state.router.hrefs;

        if (authenticated) {
          if (isAdjointSecrétaireGénéral && isPageMembre(currentHref)) {
            routerProvider.goToSgDashboard();
          } else if (
            isMembreDuConseil &&
            isPageSecrétariatGénéral(currentHref)
          ) {
            routerProvider.goToTransparencies();
          }

          const userOnLoginPage = currentHref === routerProvider.getLoginHref();
          if (userOnLoginPage) gotToDefaultAuthPage();

          const rootPage = currentHref === "/";
          if (rootPage) gotToDefaultAuthPage();

          return;
        } else {
          routerProvider.goToLogin();
          return;
        }
      }

      if (action.type === routeChanged.type) {
        if (
          isAdjointSecrétaireGénéral &&
          isPageMembre((action as ReturnType<typeof routeChanged>).payload)
        ) {
          routerProvider.goToSgDashboard();
        } else if (
          isMembreDuConseil &&
          isPageSecrétariatGénéral(
            (action as ReturnType<typeof routeChanged>).payload,
          )
        ) {
          routerProvider.goToTransparencies();
        }

        switch (action.payload) {
          case "/":
            if (authenticated) gotToDefaultAuthPage();
            else routerProvider.goToLogin();
            break;
          case routerProvider.getLoginHref():
            if (authenticated) gotToDefaultAuthPage();
            break;
          default:
            if (!authenticated) routerProvider.goToLogin();
        }
        return;
      }
    },
  });
};

const isSecrétariatGénéral = (
  state: AppState,
  action: UnknownAction,
): boolean => {
  return isRole(state, action, Role.ADJOINT_SECRETAIRE_GENERAL);
};

const getIsMembreDuConseil = (
  state: AppState,
  action: UnknownAction,
): boolean => {
  return (
    isRole(state, action, Role.MEMBRE_COMMUN) ||
    isRole(state, action, Role.MEMBRE_DU_PARQUET) ||
    isRole(state, action, Role.MEMBRE_DU_SIEGE)
  );
};

const isRole = (
  state: AppState,
  action: UnknownAction,
  role: Role,
): boolean => {
  switch (action.type) {
    case authenticationStateInitFromStore.type:
      return (
        (action as ReturnType<typeof authenticationStateInitFromStore>).payload
          .user?.role === role
      );

    case routeChanged.type:
      return state.authentication.user?.role === role;

    default:
      return false;
  }
};

const isPageMembre = (href: string): boolean =>
  href.startsWith("/" + routeSegments.transparences);

const isPageSecrétariatGénéral = (href: string): boolean =>
  href.startsWith("/" + routeSegments.secretariatGeneral);
