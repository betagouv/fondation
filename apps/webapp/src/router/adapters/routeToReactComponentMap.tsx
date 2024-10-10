import { FC } from "react";
import { RouteName } from "../core-logic/models/Routes";
import {
  LazyLogin,
  NominationFileListPage,
  LazyNominationFileOverview,
} from "./lazyRouteComponents";

export const routeToReactComponentMap = {
  login: LazyLogin,
  nominationCaseList: NominationFileListPage,
  nominationFileOverview: LazyNominationFileOverview,
};

export type RouteToComponentMap =
  | typeof routeToReactComponentMap
  | Record<RouteName, FC>;
