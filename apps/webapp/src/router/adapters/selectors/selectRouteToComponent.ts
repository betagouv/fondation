import { createAppSelector } from "../../../nomination-case/store/createAppSelector";

export const selectRouteToComponent = createAppSelector(
  [
    (state) => state.router.routeToComponent,
    (state) => state.authentication.authenticated,
  ],
  (routeToComponent, authenticated) => routeToComponent(authenticated)
);
