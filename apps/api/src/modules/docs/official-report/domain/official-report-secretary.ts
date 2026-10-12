import { UserDutyEnum, UserTitleEnum } from 'src/modules/administration/domain/user-enum';
import { GenderEnum } from 'src/modules/shared/gender.enum';
import { RoleEnum } from 'src/modules/shared/role.enum';

export class OfficialReportSecretary {
  constructor(
    readonly id: string | null,
    readonly firstName: string,
    readonly lastName: string,
    readonly gender: GenderEnum,
    readonly displayTitle: string | null,
    readonly title: Extract<UserTitleEnum, 'FIRST_SECRETARY'> | null,
  ) {}

  equals(other: OfficialReportSecretary): boolean {
    return typeof this.id === 'string' && typeof other.id === 'string' && this.id === other.id;
  }

  static from(props: {
    id: string | null;
    firstName: string;
    lastName: string;
    gender: GenderEnum;
    displayTitle: string | null;
    role: RoleEnum;
    duty: UserDutyEnum | null;
    title: UserTitleEnum | null;
  }): OfficialReportSecretary {
    if (
      props.role === 'MEMBRE_COMMUN' ||
      props.role === 'MEMBRE_DU_PARQUET' ||
      props.role === 'MEMBRE_DU_SIEGE'
    ) {
      throw new InvalidSecretaryRole();
    }

    if (props.duty !== 'SECRETARY') {
      throw new InvalidSecretaryDuty();
    }

    if (
      props.title === 'DEPUTY_PRESIDENT_PARQUET' ||
      props.title === 'DEPUTY_PRESIDENT_SIEGE' ||
      props.title === 'PRESIDENT_PARQUET' ||
      props.title === 'PRESIDENT_SIEGE'
    ) {
      throw new InvalidSecretaryTitle();
    }

    return new OfficialReportSecretary(
      props.id,
      props.firstName,
      props.lastName,
      props.gender,
      props.displayTitle,
      props.title,
    );
  }
}

export class InvalidSecretaryRole extends Error {}
export class InvalidSecretaryDuty extends Error {}
export class InvalidSecretaryTitle extends Error {}
