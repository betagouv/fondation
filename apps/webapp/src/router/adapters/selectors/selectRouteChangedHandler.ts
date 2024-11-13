import { createAppSelector } from "../../../reports/store/createAppSelector";

export const selectRouteChangedHandler = createAppSelector(
  [(state) => state.router],
  (router) => router.routeChangedHandler,
);
