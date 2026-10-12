import type { RoleEnum } from 'src/modules/shared/role.enum';
import { assertNever } from 'src/utils/assert-never';
import { assertIsDefined } from 'src/utils/is-defined';

import { AdminUserTitle } from './admin-user-title';
import {
  AdminUserRoleEnum,
  adminUserRoleEnumToDuty,
  adminUserRoleEnumToIdentityRoles,
  adminUserRoleEnumToTitle,
  UserDutyEnum,
  UserTitleEnum,
} from './user-enum';

export class AdminUserRole {
  get role(): RoleEnum {
    const output = adminUserRoleEnumToIdentityRoles(this._role);

    if (output.length === 1) return assertIsDefined(output[0]);

    if (
      (this.identityRole === 'ADMIN' || this.identityRole === 'MEMBRE_COMMUN') &&
      output.includes(this.identityRole)
    ) {
      return this.identityRole;
    }

    const [filtered] = output.filter((role) => role !== 'ADMIN' && role !== 'MEMBRE_COMMUN');
    return assertIsDefined(filtered);
  }

  get title(): UserTitleEnum | null {
    return adminUserRoleEnumToTitle(this._role);
  }

  get duty(): UserDutyEnum | null {
    return adminUserRoleEnumToDuty(this._role);
  }

  private constructor(
    private readonly _role: AdminUserRoleEnum,
    private readonly identityRole: RoleEnum | null,
  ) {}

  toString(): AdminUserRoleEnum {
    return this._role;
  }

  reTitle(userTitle: AdminUserTitle): AdminUserRole | null {
    const target = userTitle.toString();
    if (target === this._role) return null;

    return new AdminUserRole(target, this.identityRole);
  }

  static from(props: {
    role: RoleEnum;
    duty: UserDutyEnum | null;
    title: UserTitleEnum | null;
  }): AdminUserRole {
    switch (props.role) {
      case 'ADMIN':
      case 'ADJOINT_SECRETAIRE_GENERAL': {
        switch (props.title) {
          case 'FIRST_SECRETARY':
            return new AdminUserRole('FIRST_SECRETARY', props.role);

          default: {
            switch (props.duty) {
              case 'SECRETARY':
                return new AdminUserRole('SECRETARY', props.role);

              default:
              case 'OFFICER':
                return new AdminUserRole('OFFICER', props.role);
            }
          }
        }
      }

      case 'MEMBRE_COMMUN': {
        switch (props.title) {
          case null:
          case 'FIRST_SECRETARY':
            return new AdminUserRole('MEMBRE_COMMUN', props.role);

          default:
            return new AdminUserRole(props.title, props.role);
        }
      }

      case 'MEMBRE_DU_SIEGE': {
        switch (props.title) {
          case null:
          case 'FIRST_SECRETARY':
            return new AdminUserRole('MEMBRE_SIEGE', props.role);

          default:
            return new AdminUserRole(props.title, props.role);
        }
      }

      case 'MEMBRE_DU_PARQUET': {
        switch (props.title) {
          case null:
          case 'FIRST_SECRETARY':
            return new AdminUserRole('MEMBRE_PARQUET', props.role);

          default:
            return new AdminUserRole(props.title, props.role);
        }
      }

      default:
        return assertNever(props.role);
    }
  }
}
