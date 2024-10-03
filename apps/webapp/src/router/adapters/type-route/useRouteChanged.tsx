import { useEffect } from "react";
import { useAppDispatch } from "../../../nomination-case/adapters/primary/hooks/react-redux";
import { routeChanged } from "../../core-logic/reducers/router.slice";
import { useRoute } from "./typeRouter";
import { RouteChangedHandler } from "../../core-logic/components/routeChangedHandler";

export const useRouteChanged: RouteChangedHandler = () => {
  const route = useRoute();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(routeChanged(route.name || ""));
  }, [dispatch, route.name]);
};
