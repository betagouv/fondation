import { authenticationStateInitFromStore } from "../../../authentication/core-logic/reducers/authentication.slice";
import { Listener } from "../../../store/listeners";
import { routeChanged } from "../reducers/router.slice";

export const redirectOnRouteChange: Listener = (startAppListening) =>
  startAppListening({
    predicate: (action) =>
      action.type === routeChanged.type ||
      action.type === authenticationStateInitFromStore.type,
    effect: (
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
      const { authenticated } = state.authentication;
      const { current: currentHref } = state.router.hrefs;

      if (action.type === authenticationStateInitFromStore.type) {
        const userOnLoginPage = currentHref === routerProvider.getLoginHref();
        if (authenticated && userOnLoginPage) routerProvider.goToReportList();
        return;
      }

      if (action.type === routeChanged.type) {
        switch (action.payload) {
          case "/":
            if (authenticated) routerProvider.goToReportList();
            else routerProvider.goToLogin();
            break;
          case routerProvider.getLoginHref():
            if (authenticated) routerProvider.goToReportList();
            break;
          default:
            if (!authenticated) routerProvider.goToLogin();
        }
        return;
      }
    },
  });
