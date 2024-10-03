import { createAppSelector } from "../../../nomination-case/store/createAppSelector";

export const selectRouteChangedHandler = createAppSelector(
  [(state) => state.router],
  (router) => router.routeChangedHandler
);
