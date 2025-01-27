import { Action, configureStore, ThunkDispatch } from "@reduxjs/toolkit";
import { allRulesMap, AllRulesMap, NominationFile } from "shared-models";
import { AuthenticationGateway } from "../authentication/core-logic/gateways/Authentication.gateway";
import { logoutNotifierMiddlewareFactory } from "../authentication/core-logic/middlewares/logoutNotifier.middleware";
import { AuthenticationStorageProvider } from "../authentication/core-logic/providers/authenticationStorage.provider";
import { LogoutNotifierProvider } from "../authentication/core-logic/providers/logoutNotifier.provider";
import { createAuthenticationSlice } from "../authentication/core-logic/reducers/authentication.slice";
import { reportHtmlIds } from "../reports/adapters/primary/dom/html-ids";
import {
  summaryLabels,
  SummarySection,
} from "../reports/adapters/primary/labels/summary-labels";
import { ReportGateway } from "../reports/core-logic/gateways/Report.gateway";
import { reportListReducer as reportList } from "../reports/core-logic/reducers/reportList.slice";
import { createReportOverviewSlice } from "../reports/core-logic/reducers/reportOverview.slice";
import {
  RouteToComponentMap,
  routeToReactComponentMap,
} from "../router/adapters/routeToReactComponentMap";
import { RouteChangedHandler } from "../router/core-logic/components/routeChangedHandler";
import { RouteToComponentFactory } from "../router/core-logic/components/routeToComponent";
import { RouterProvider } from "../router/core-logic/providers/router";
import { createRouterSlice } from "../router/core-logic/reducers/router.slice";
import { createSharedKernelSlice } from "../shared-kernel/core-logic/reducers/shared-kernel.slice";
import { AppState } from "./appState";
import { AppListeners } from "./listeners";
import { createAppListenerMiddleware } from "./middlewares/listener.middleware";
import { LoginNotifierProvider } from "../authentication/core-logic/providers/loginNotifier.provider";
import { loginNotifierMiddlewareFactory } from "../authentication/core-logic/middlewares/loginNotifier.middleware";

export interface Gateways {
  reportGateway: ReportGateway;
  authenticationGateway: AuthenticationGateway;
}

export interface Providers {
  authenticationStorageProvider: AuthenticationStorageProvider;
  routerProvider: RouterProvider;
  logoutNotifierProvider: LogoutNotifierProvider;
  loginNotifierProvider: LoginNotifierProvider;
}

export interface NestedPrimaryAdapters {
  routeToComponentFactory: RouteToComponentFactory;
  routeChangedHandler: RouteChangedHandler;
}

export type AppDependencies = {
  gateways: Gateways;
  providers: Providers;
};

export type PartialAppDependencies = {
  [K in keyof AppDependencies]: Partial<AppDependencies[K]>;
};

const isProduction = process.env.NODE_ENV === "production";

const defaultReportSummarySections: SummarySection[] = [
  {
    anchorId: reportHtmlIds.overview.biographySection,
    label: summaryLabels.biography,
  },
  {
    anchorId: reportHtmlIds.overview.commentSection,
    label: summaryLabels.comment,
  },
  {
    anchorId: reportHtmlIds.overview.observersSection,
    label: summaryLabels.observers,
  },
  {
    anchorId: reportHtmlIds.overview.managementSection,
    label: summaryLabels.rules.management,
  },
  {
    anchorId: reportHtmlIds.overview.statutorySection,
    label: summaryLabels.rules.statutory,
  },
  {
    anchorId: reportHtmlIds.overview.qualitativeSection,
    label: summaryLabels.rules.qualitative,
  },
  {
    anchorId: reportHtmlIds.overview.attachedFilesSection,
    label: summaryLabels.attachedFiles,
  },
];

export const initReduxStore = <IsTest extends boolean = true>(
  gateways: IsTest extends true ? Partial<Gateways> : Gateways,
  providers: IsTest extends true ? Partial<Providers> : Providers,
  nestedPrimaryAdapters: IsTest extends true
    ? Partial<NestedPrimaryAdapters>
    : NestedPrimaryAdapters,
  listeners?: IsTest extends true ? Partial<AppListeners> : AppListeners,
  routeToComponentMap: RouteToComponentMap = routeToReactComponentMap,
  rulesTuple: AllRulesMap = isProduction
    ? allRulesMap
    : {
        [NominationFile.RuleGroup.MANAGEMENT]: [],
        [NominationFile.RuleGroup.STATUTORY]: [],
        [NominationFile.RuleGroup.QUALITATIVE]: [],
      },
  reportSummarySections: SummarySection[] = defaultReportSummarySections,
  currentDate = new Date(),
) => {
  const loginNotifierMiddleware = loginNotifierMiddlewareFactory(
    providers.loginNotifierProvider,
  );

  const logoutNotifierMiddleware = logoutNotifierMiddlewareFactory(
    providers.logoutNotifierProvider,
  );
  return configureStore({
    reducer: {
      sharedKernel: createSharedKernelSlice(currentDate).reducer,
      reportOverview: createReportOverviewSlice(
        reportSummarySections,
        rulesTuple,
      ).reducer,
      reportList,
      authentication: createAuthenticationSlice().reducer,
      router: createRouterSlice({
        routerProvider: providers.routerProvider,
        routeToComponent:
          nestedPrimaryAdapters.routeToComponentFactory?.(routeToComponentMap),
        routeChangedHandler: nestedPrimaryAdapters.routeChangedHandler,
      }).reducer,
    },
    middleware: (getDefaultMiddleware) => {
      const appDependencies: PartialAppDependencies = {
        gateways: gateways ?? {},
        providers: providers ?? {},
      };

      const middleware = getDefaultMiddleware({
        thunk: {
          extraArgument: appDependencies,
        },
        serializableCheck: false,
      });
      if (!listeners) {
        return middleware;
      }
      const middlewareWithListeners = middleware.prepend(
        createAppListenerMiddleware(appDependencies, Object.values(listeners))
          .middleware,
      );
      return middlewareWithListeners
        .concat(loginNotifierMiddleware)
        .concat(logoutNotifierMiddleware);
    },
    devTools: true,
  });
};

type AppThunkDispatch = ThunkDispatch<AppState, AppDependencies, Action>;
export type ReduxStore = ReturnType<typeof initReduxStore> & {
  dispatch: AppThunkDispatch;
};
export type AppDispatch = AppThunkDispatch;
