import { FC } from "react";
import { RouteName } from "../core-logic/models/Routes";
import {
  LazyLogin,
  ReportListPage,
  LazyReportOverview,
} from "./lazyRouteComponents";

export const routeToReactComponentMap = {
  login: LazyLogin,
  reportList: ReportListPage,
  reportOverview: LazyReportOverview,
};

export type RouteToComponentMap =
  | typeof routeToReactComponentMap
  | Record<RouteName, FC>;
