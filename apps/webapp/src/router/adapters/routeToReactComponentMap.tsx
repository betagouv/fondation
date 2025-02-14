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

export type RouteToComponentMap<Prod extends boolean = boolean> =
  Prod extends true ? typeof routeToReactComponentMap : Record<RouteName, FC>;
