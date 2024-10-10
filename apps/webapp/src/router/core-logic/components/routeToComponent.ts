import { RouteToComponentMap } from "../../adapters/routeToReactComponentMap";

export type RouteToComponentFactory = (
  routeToComponentMap: RouteToComponentMap,
) => (isAuthenticated: boolean) => () => JSX.Element | null;
