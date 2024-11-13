import { useEffect } from "react";
import { useAppDispatch } from "../../../reports/adapters/primary/hooks/react-redux";
import { routeChanged } from "../../core-logic/reducers/router.slice";
import { RouteChangedHandler } from "../../core-logic/components/routeChangedHandler";
import { useRoute } from "./typeRouter";

export const useRouteChanged: RouteChangedHandler = () => {
  const route = useRoute();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(routeChanged(route.href || ""));
  }, [dispatch, route.href]);
};
