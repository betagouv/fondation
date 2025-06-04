import { Role } from "shared-models";
import { RouteName } from "./Routes";

const MEMBER_ROLES = [
  Role.MEMBRE_COMMUN,
  Role.MEMBRE_DU_PARQUET,
  Role.MEMBRE_DU_SIEGE,
] as const;

export class RouterAccessControl {
  protectedRoutes: Record<RouteName, boolean> = {
    login: false,
    transparencies: true,
    reportList: true,
    reportOverview: true,
    secretariatGeneral: true,
    sgNouvelleTransparence: true,
  };

  permissionRoutes: Record<RouteName, readonly Role[]> = {
    login: Object.values(Role),
    transparencies: MEMBER_ROLES,
    reportList: MEMBER_ROLES,
    reportOverview: MEMBER_ROLES,
    secretariatGeneral: [Role.ADJOINT_SECRETAIRE_GENERAL],
    sgNouvelleTransparence: [Role.ADJOINT_SECRETAIRE_GENERAL],
  };

  safeAccess(
    routeName: RouteName,
    isAuthenticated: boolean,
    role: Role | null,
  ): boolean {
    const isProtected = this.protectedRoutes[routeName];
    const permittedRole =
      role && this.permissionRoutes[routeName].includes(role);

    if (isProtected && (!isAuthenticated || !permittedRole)) {
      return false;
    }
    return true;
  }
}
