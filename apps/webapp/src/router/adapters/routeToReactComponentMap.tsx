import { FC } from "react";
import { RouteName } from "../core-logic/models/Routes";
import {
  LazyLogin,
  LazyNominationFileList,
  LazyNominationFileOverview,
} from "./lazyRouteComponents";

export const routeToReactComponentMap = {
  login: LazyLogin,
  nominationCaseList: LazyNominationFileList,
  nominationFileOverview: LazyNominationFileOverview,
};

export type RouteToComponentMap =
  | typeof routeToReactComponentMap
  | Record<RouteName, FC>;
