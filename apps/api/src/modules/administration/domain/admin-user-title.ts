import {
  AdminUserRoleEnum,
  adminUserRoleEnumToDuty,
  adminUserRoleEnumToTitle,
  UserDutyEnum,
  UserTitleEnum,
} from './user-enum';

export class AdminUserTitle {
  get title(): UserTitleEnum | null {
    return adminUserRoleEnumToTitle(this.role);
  }

  get duty(): UserDutyEnum | null {
    return adminUserRoleEnumToDuty(this.role);
  }

  private constructor(private readonly role: AdminUserRoleEnum) {}

  static from(role: AdminUserRoleEnum): AdminUserTitle {
    return new AdminUserTitle(role);
  }

  toString(): AdminUserRoleEnum {
    return this.role;
  }

  unTitle(): AdminUserTitle {
    switch (this.role) {
      case 'DEPUTY_PRESIDENT_PARQUET':
      case 'PRESIDENT_PARQUET':
        return new AdminUserTitle('MEMBRE_PARQUET');

      case 'DEPUTY_PRESIDENT_SIEGE':
      case 'PRESIDENT_SIEGE':
        return new AdminUserTitle('MEMBRE_SIEGE');

      case 'FIRST_SECRETARY':
        return new AdminUserTitle('SECRETARY');

      case 'SECRETARY':
      case 'MEMBRE_COMMUN':
      case 'MEMBRE_PARQUET':
      case 'MEMBRE_SIEGE':
      case 'OFFICER':
        return new AdminUserTitle(this.role);
    }
  }
}
