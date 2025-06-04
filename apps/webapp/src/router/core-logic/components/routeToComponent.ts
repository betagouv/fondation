import { Role } from "shared-models";
import { RouteToComponentMap } from "../../adapters/routeToReactComponentMap";

export type RouteToComponentFactory = (
  routeToComponentMap: RouteToComponentMap,
) => (isAuthenticated: boolean, role: Role | null) => () => JSX.Element | null;
