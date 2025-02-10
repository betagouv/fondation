import { RouteName } from "./Routes";

export class RouterAccessControl {
  protectedRoutes: Record<RouteName, boolean> = {
    login: false,
    transparencies: true,
    reportList: true,
    reportOverview: true,
  };

  safeAccess(routeName: RouteName, isAuthenticated: boolean): boolean {
    const isProtected = this.protectedRoutes[routeName];
    if (isProtected && !isAuthenticated) {
      return false;
    }
    return true;
  }
}
