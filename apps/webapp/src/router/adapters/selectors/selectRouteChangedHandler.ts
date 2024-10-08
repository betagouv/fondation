import { createAppSelector } from "../../../nomination-file/store/createAppSelector";

export const selectRouteChangedHandler = createAppSelector(
  [(state) => state.router],
  (router) => router.routeChangedHandler
);
