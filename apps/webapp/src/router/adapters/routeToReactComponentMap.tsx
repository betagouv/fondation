import { FC } from "react";
import { RouteName } from "../core-logic/models/Routes";
import {
  LazyLogin,
  LazyNominationCaseList,
  LazyNominationCaseOverview,
} from "./lazyRouteComponents";

export const routeToReactComponentMap = {
  login: LazyLogin,
  nominationCaseList: LazyNominationCaseList,
  nominationCaseOverview: LazyNominationCaseOverview,
};

export type RouteToComponentMap =
  | typeof routeToReactComponentMap
  | Record<RouteName, FC>;
