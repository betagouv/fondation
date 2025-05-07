import { FC } from "react";
import { RouteName } from "../core-logic/models/Routes";
import {
  LazyLogin,
  LazyReportListPage,
  LazyReportOverview,
  LazySecretariatGeneralDashboard,
  LazySgNouvelleTransparence,
  LazyTransparencies,
} from "./lazyRouteComponents";

export const routeToReactComponentMap = {
  login: LazyLogin,
  transparencies: LazyTransparencies,
  reportList: LazyReportListPage,
  reportOverview: LazyReportOverview,
  secretariatGeneral: LazySecretariatGeneralDashboard,
  sgNouvelleTransparence: LazySgNouvelleTransparence,
};

export type RouteToComponentMap<Prod extends boolean = boolean> =
  Prod extends true ? typeof routeToReactComponentMap : Record<RouteName, FC>;
