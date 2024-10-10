import { RouteName } from "./Routes";

export class RouterAccessControl {
  protectedRoutes: Record<RouteName, boolean> = {
    login: false,
    nominationCaseList: true,
    nominationFileOverview: true,
  };

  safeAccess(routeName: RouteName, isAuthenticated: boolean): boolean {
    const isProtected = this.protectedRoutes[routeName];
    if (isProtected && !isAuthenticated) {
      return false;
    }
    return true;
  }
}
