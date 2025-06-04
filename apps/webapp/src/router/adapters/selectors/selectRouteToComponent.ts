import { createAppSelector } from "../../../store/createAppSelector";

export const selectRouteToComponent = createAppSelector(
  [
    (state) => state.router.routeToComponent,
    (state) => state.authentication.authenticated,
    (state) => state.authentication.user?.role,
  ],
  (routeToComponent, authenticated, role) =>
    routeToComponent(authenticated, role || null),
);
