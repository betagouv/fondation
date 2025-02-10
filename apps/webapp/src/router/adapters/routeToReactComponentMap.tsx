import { FC } from "react";
import { RouteName } from "../core-logic/models/Routes";
import {
  LazyLogin,
  ReportListPage,
  LazyReportOverview,
  LazyTransparencies,
} from "./lazyRouteComponents";

export const routeToReactComponentMap = {
  login: LazyLogin,
  transparencies: LazyTransparencies,
  reportList: ReportListPage,
  reportOverview: LazyReportOverview,
};

export type RouteToComponentMap =
  | typeof routeToReactComponentMap
  | Record<RouteName, FC>;
