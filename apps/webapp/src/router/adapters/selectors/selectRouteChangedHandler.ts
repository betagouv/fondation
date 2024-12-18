import { createAppSelector } from "../../../store/createAppSelector";

export const selectRouteChangedHandler = createAppSelector(
  [(state) => state.router],
  (router) => router.routeChangedHandler,
);
