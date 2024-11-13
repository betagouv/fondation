import { Listener } from "../../../reports/store/listeners";
import { routeChanged } from "../reducers/router.slice";

export const redirectOnRouteChange: Listener = (startAppListening) =>
  startAppListening({
    actionCreator: routeChanged,
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
      const { authenticated } = getState().authentication;

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
    },
  });
