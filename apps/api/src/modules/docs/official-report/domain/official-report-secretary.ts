import { GenderEnum } from '../../../shared/gender.enum';
import { RoleEnum } from '../../../shared/role.enum';
import { UserDutyEnum } from '../../../shared/user-duty.enum';
import { UserTitleEnum } from '../../../shared/user-title.enum';

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

  /** as the version recorded it: the checks ran when the secretary was chosen */
  static recorded(props: {
    displayTitle: string | null;
    firstName: string;
    gender: GenderEnum;
    id: string | null;
    lastName: string;
    title: UserTitleEnum | null;
  }): OfficialReportSecretary {
    return new OfficialReportSecretary(
      props.id,
      props.firstName,
      props.lastName,
      props.gender,
      props.displayTitle,
      props.title === 'FIRST_SECRETARY' ? props.title : null,
    );
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
