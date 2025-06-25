interface RoutePath {
  login: '/login';
  secretariatGeneral: {
    dashboard: '/secretariat-general';
    nouvelleTransparence: '/secretariat-general/nouvelle-transparence';
  };
}

export const ROUTE_PATHS: RoutePath = {
  login: '/login',
  secretariatGeneral: {
    dashboard: '/secretariat-general',
    nouvelleTransparence: '/secretariat-general/nouvelle-transparence'
  }
};

export type RoutePathSecretariat =
  RoutePath['secretariatGeneral'][keyof RoutePath['secretariatGeneral']];
