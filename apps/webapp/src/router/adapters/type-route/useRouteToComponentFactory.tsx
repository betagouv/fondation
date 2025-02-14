import React from "react";
import { RouteToComponentFactory } from "../../core-logic/components/routeToComponent";
import { RouterAccessControl } from "../../core-logic/models/RouterAccessControl";
import {
  RouteToComponentMap,
  routeToReactComponentMap,
} from "../routeToReactComponentMap";
import { useRoute } from "./typeRouter";
import { GdsTransparenciesRoutesMapper } from "../../core-logic/models/gds-transparencies-routes-mapper";

export const useRouteToComponentFactory: RouteToComponentFactory =
  (routeToComponentMap: RouteToComponentMap = routeToReactComponentMap) =>
  (isAuthenticated: boolean) => {
    const useRouteToComponent = () => {
      const route = useRoute();

      const suspensed = (element: JSX.Element | null) => (
        <React.Suspense fallback={<div>Loading</div>}>{element}</React.Suspense>
      );

      const protectedComponent = (component: JSX.Element) => {
        return route.name &&
          new RouterAccessControl().safeAccess(route.name, isAuthenticated)
          ? component
          : null;
      };

      switch (route.name) {
        case false:
          return <section>Page non trouvée.</section>;
        case "login": {
          const Component = routeToComponentMap[route.name];
          return suspensed(<Component />);
        }
        case "transparencies": {
          const Component = routeToComponentMap[route.name];
          return suspensed(protectedComponent(<Component />));
        }
        case "reportList": {
          const Component = routeToComponentMap[route.name];
          return suspensed(
            protectedComponent(
              <Component
                transparency={GdsTransparenciesRoutesMapper.toTransparency(
                  route.params.transparency,
                )}
              />,
            ),
          );
        }
        case "reportOverview": {
          const Component = routeToComponentMap[route.name];
          return suspensed(
            protectedComponent(<Component id={route.params.id} />),
          );
        }

        default: {
          // Exhaustive check to ensure all cases are handled
          const _exhaustiveCheck: never = route;
          console.info(_exhaustiveCheck);
          throw new Error(`Unhandled route: ${JSON.stringify(route)}`);
        }
      }
    };
    return useRouteToComponent;
  };
