import { Action, configureStore, ThunkDispatch } from "@reduxjs/toolkit";
import {
  allRulesMapV2,
  AllRulesMapV2,
  NominationFile,
  Transparency,
} from "shared-models";
import { UnionToTuple } from "type-fest";
import { AuthenticationGateway } from "../authentication/core-logic/gateways/Authentication.gateway";
import { loginNotifierMiddlewareFactory } from "../authentication/core-logic/middlewares/loginNotifier.middleware";
import { logoutNotifierMiddlewareFactory } from "../authentication/core-logic/middlewares/logoutNotifier.middleware";
import { LoginNotifierProvider } from "../authentication/core-logic/providers/loginNotifier.provider";
import { LogoutNotifierProvider } from "../authentication/core-logic/providers/logoutNotifier.provider";
import { createAuthenticationSlice } from "../authentication/core-logic/reducers/authentication.slice";
import { FileApiClient } from "../files/core-logic/gateways/File.client";
import { reportHtmlIds } from "../reports/adapters/primary/dom/html-ids";
import {
  allRulesLabelsMap,
  RulesLabelsMap,
} from "../reports/adapters/primary/labels/rules-labels";
import {
  summaryLabels,
  SummarySection,
} from "../reports/adapters/primary/labels/summary-labels";
import { ReportGateway } from "../reports/core-logic/gateways/Report.gateway";
import { TransparencyGateway } from "../reports/core-logic/gateways/Transparency.gateway";
import { createReportListSlice } from "../reports/core-logic/reducers/reportList.slice";
import { createReportOverviewSlice } from "../reports/core-logic/reducers/reportOverview.slice";
import { createTransparenciesSlice } from "../reports/core-logic/reducers/transparencies.slice";
import { listReport } from "../reports/core-logic/use-cases/report-listing/listReport.use-case";
import {
  RouteToComponentMap,
  routeToReactComponentMap,
} from "../router/adapters/routeToReactComponentMap";
import { RouteChangedHandler } from "../router/core-logic/components/routeChangedHandler";
import { RouteToComponentFactory } from "../router/core-logic/components/routeToComponent";
import { RouterProvider } from "../router/core-logic/providers/router";
import { createRouterSlice } from "../router/core-logic/reducers/router.slice";
import { DataAdministrationGateway } from "../secretariat-general/core-logic/gateways/DataAdministration.gateway";
import { createSecretariatGeneralSlice } from "../secretariat-general/core-logic/reducers/secretariatGeneral.slice";
import { RealDateProvider } from "../shared-kernel/adapters/secondary/providers/realDateProvider";
import { DateProvider } from "../shared-kernel/core-logic/providers/dateProvider";
import { FileProvider } from "../shared-kernel/core-logic/providers/fileProvider";
import { UuidGenerator } from "../shared-kernel/core-logic/providers/uuidGenerator";
import { createSharedKernelSlice } from "../shared-kernel/core-logic/reducers/shared-kernel.slice";
import { AppState } from "./appState";
import { AppListeners } from "./listeners";
import { createAppListenerMiddleware } from "./middlewares/listener.middleware";

export interface Gateways<
  StoreTransparencies extends string[] = UnionToTuple<Transparency>,
> {
  reportGateway: ReportGateway;
  authenticationGateway: AuthenticationGateway;
  fileGateway: FileApiClient;
  transparencyGateway: TransparencyGateway<StoreTransparencies>;
  dataAdministrationGateway: DataAdministrationGateway;
}

export interface Providers {
  routerProvider: RouterProvider;
  logoutNotifierProvider: LogoutNotifierProvider;
  loginNotifierProvider: LoginNotifierProvider;
  fileProvider: FileProvider;
  dateProvider: DateProvider;
  uuidGenerator: UuidGenerator;
}

export interface NestedPrimaryAdapters {
  routeToComponentFactory: RouteToComponentFactory;
  routeChangedHandler: RouteChangedHandler;
}

export type AppDependencies<
  StoreTransparencies extends string[] = UnionToTuple<Transparency>,
> = {
  gateways: Gateways<StoreTransparencies>;
  providers: Providers;
};

export type PartialAppDependencies<
  StoreTransparencies extends string[] = UnionToTuple<Transparency>,
> = {
  [K in keyof AppDependencies]: Partial<
    AppDependencies<StoreTransparencies>[K]
  >;
};

const isProduction = process.env.NODE_ENV === "production";

export const defaultReportSummarySections: SummarySection[] = [
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
    anchorId: reportHtmlIds.overview.statutorySection,
    label: summaryLabels.rules.statutory,
  },
  {
    anchorId: reportHtmlIds.overview.managementSection,
    label: summaryLabels.rules.management,
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

const prodTransparencies: UnionToTuple<Transparency> = [
  Transparency.AUTOMNE_2024,
  Transparency.PROCUREURS_GENERAUX_8_NOVEMBRE_2024,
  Transparency.PROCUREURS_GENERAUX_25_NOVEMBRE_2024,
  Transparency.TABLEAU_GENERAL_T_DU_25_NOVEMBRE_2024,
  Transparency.CABINET_DU_MINISTRE_DU_21_JANVIER_2025,
  Transparency.SIEGE_DU_06_FEVRIER_2025,
  Transparency.PARQUET_DU_06_FEVRIER_2025,
  Transparency.PARQUET_DU_20_FEVRIER_2025,
  Transparency.DU_03_MARS_2025,
  Transparency.GRANDE_TRANSPA_DU_21_MARS_2025,
  Transparency.DU_30_AVRIL_2025,
  Transparency.MARCH_2026,
];

export const initReduxStore = <
  IsTest extends boolean = true,
  StoreTransparencies extends string[] = UnionToTuple<Transparency>,
>(
  gateways: IsTest extends true
    ? Partial<Gateways<StoreTransparencies>>
    : Gateways<StoreTransparencies>,
  providers: IsTest extends true ? Partial<Providers> : Providers,
  nestedPrimaryAdapters: IsTest extends true
    ? Partial<NestedPrimaryAdapters>
    : NestedPrimaryAdapters,
  listeners?: IsTest extends true ? Partial<AppListeners> : AppListeners,
  routeToComponentMap: RouteToComponentMap = routeToReactComponentMap,
  rulesMap: AllRulesMapV2 = isProduction
    ? allRulesMapV2
    : {
        [NominationFile.RuleGroup.MANAGEMENT]: [],
        [NominationFile.RuleGroup.STATUTORY]: [],
        [NominationFile.RuleGroup.QUALITATIVE]: [],
      },
  rulesLabelsMap: IsTest extends true
    ? RulesLabelsMap<{
        [NominationFile.RuleGroup.MANAGEMENT]: [];
        [NominationFile.RuleGroup.STATUTORY]: [];
        [NominationFile.RuleGroup.QUALITATIVE]: [];
      }>
    : RulesLabelsMap = isProduction
    ? allRulesLabelsMap
    : ({
        [NominationFile.RuleGroup.MANAGEMENT]: {},
        [NominationFile.RuleGroup.STATUTORY]: {},
        [NominationFile.RuleGroup.QUALITATIVE]: {},
      } as RulesLabelsMap),
  reportSummarySections: SummarySection[] = defaultReportSummarySections,
  currentDate = new Date(),
  transparencies: StoreTransparencies = isProduction || import.meta.env.DEV
    ? (prodTransparencies as unknown as StoreTransparencies)
    : ([] as unknown as StoreTransparencies),
) => {
  const loginNotifierMiddleware = loginNotifierMiddlewareFactory(
    providers.loginNotifierProvider,
  );

  const logoutNotifierMiddleware = logoutNotifierMiddlewareFactory(
    providers.logoutNotifierProvider,
  );

  const reportListSlice = createReportListSlice();

  // Set default dateProvider if not provided
  const providersWithDefaults = {
    ...providers,
    dateProvider: providers.dateProvider || new RealDateProvider(),
  };

  return configureStore({
    reducer: {
      sharedKernel: createSharedKernelSlice(currentDate).reducer,
      transparencies: createTransparenciesSlice(transparencies).reducer,
      reportOverview: createReportOverviewSlice(
        reportSummarySections,
        rulesMap,
        rulesLabelsMap,
      ).reducer,
      reportList: reportListSlice.reducer,
      authentication: createAuthenticationSlice().reducer,
      router: createRouterSlice({
        routerProvider: providers.routerProvider,
        routeToComponent:
          nestedPrimaryAdapters.routeToComponentFactory?.(routeToComponentMap),
        routeChangedHandler: nestedPrimaryAdapters.routeChangedHandler,
      }).reducer,
      secretariatGeneral: createSecretariatGeneralSlice().reducer,
    },
    middleware: (getDefaultMiddleware) => {
      const appDependencies: PartialAppDependencies<StoreTransparencies> = {
        gateways: gateways ?? {},
        providers: providersWithDefaults,
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
    devTools: {
      trace: true,
      actionCreators: {
        listReportFulfilled: listReport.fulfilled,
      },
    },
  });
};

type AppThunkDispatch<
  IsTest extends boolean,
  AppStateTransparencies extends string[],
> = ThunkDispatch<
  AppState<IsTest, AppStateTransparencies>,
  AppDependencies<AppStateTransparencies>,
  Action
>;
export type ReduxStore<
  IsTest extends boolean = boolean,
  AppStateTransparencies extends string[] = string[],
> = ReturnType<typeof initReduxStore<IsTest, AppStateTransparencies>> & {
  dispatch: AppThunkDispatch<IsTest, AppStateTransparencies>;
};
export type AppDispatch<
  IsTest extends boolean = boolean,
  AppStateTransparencies extends string[] = string[],
> = AppThunkDispatch<IsTest, AppStateTransparencies>;
