interface RoutePath {
  LOGIN: '/login';
  TRANSPARENCES: {
    DASHBOARD: '/transparences';
    DETAILS: '/transparences/:id';
  };
  SG: {
    DASHBOARD: '/secretariat-general';
    NOUVELLE_TRANSPARENCE: '/secretariat-general/nouvelle-transparence';
  };
}

export const ROUTE_PATHS: RoutePath = {
  LOGIN: '/login',
  TRANSPARENCES: {
    DASHBOARD: '/transparences',
    DETAILS: '/transparences/:id'
  },
  SG: {
    DASHBOARD: '/secretariat-general',
    NOUVELLE_TRANSPARENCE: '/secretariat-general/nouvelle-transparence'
  }
};

export type RoutePathSecretariat = RoutePath['SG'][keyof RoutePath['SG']];
