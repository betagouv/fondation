import React from "react";
import { PageContentLayout } from "../../../shared-kernel/adapters/primary/react/PageContentLayout";
import { RouteToComponentFactory } from "../../core-logic/components/routeToComponent";
import { FormationsRoutesMapper } from "../../core-logic/models/formations-routes-mapper";
import { GdsTransparenciesRoutesMapper } from "../../core-logic/models/gds-transparencies-routes-mapper";
import { RouterAccessControl } from "../../core-logic/models/RouterAccessControl";
import {
  RouteToComponentMap,
  routeToReactComponentMap,
} from "../routeToReactComponentMap";
import { useRoute } from "./typeRouter";

export const useRouteToComponentFactory: RouteToComponentFactory =
  (routeToComponentMap: RouteToComponentMap = routeToReactComponentMap) =>
  (isAuthenticated: boolean) => {
    const useRouteToComponent = () => {
      const route = useRoute();

      const suspensed = (element: JSX.Element | null) => (
        <React.Suspense>{element}</React.Suspense>
      );

      const protectedComponent = (component: JSX.Element) => {
        return route.name &&
          new RouterAccessControl().safeAccess(route.name, isAuthenticated)
          ? component
          : null;
      };

      switch (route.name) {
        case false:
          return <PageContentLayout>Page non trouvée.</PageContentLayout>;
        case "login": {
          const Component = routeToComponentMap[route.name];
          return suspensed(<Component />);
        }
        case "secretariatGeneral": {
          const Component = routeToComponentMap[route.name];
          return suspensed(<Component />);
        }
        case "sgNouvelleTransparence": {
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
                formation={FormationsRoutesMapper.toFormation(
                  route.params.formation,
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
