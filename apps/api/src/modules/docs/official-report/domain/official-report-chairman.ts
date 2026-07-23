import { UserDutyEnum, UserTitleEnum } from 'src/modules/administration/domain/user-enum';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { GenderEnum } from 'src/modules/shared/gender.enum';
import { RoleEnum } from 'src/modules/shared/role.enum';

export class OfficialReportChairman {
  constructor(
    readonly id: string | null,
    readonly firstName: string,
    readonly lastName: string,
    readonly gender: GenderEnum,
    readonly displayTitle: string | null,
    readonly title: Exclude<UserTitleEnum, 'FIRST_SECRETARY'> | null,
  ) {}

  equals(other: OfficialReportChairman): boolean {
    return typeof other.id === 'string' && typeof this.id === 'string' && other.id === this.id;
  }

  static from(props: {
    id: string | null;
    firstName: string;
    lastName: string;
    gender: GenderEnum;
    displayTitle: string | null;
    sort: number;
    title: UserTitleEnum | null;
    duty: UserDutyEnum | null;
    role: RoleEnum;
    expectedFormation: FormationEnum;
  }): OfficialReportChairman {
    if (props.role === 'ADJOINT_SECRETAIRE_GENERAL' || props.role === 'ADMIN') {
      throw new InvalidChairmanRole();
    }

    if (
      (props.expectedFormation === 'PARQUET' && props.role === 'MEMBRE_DU_SIEGE') ||
      (props.expectedFormation === 'SIEGE' && props.role === 'MEMBRE_DU_PARQUET')
    ) {
      throw new InvalidChairmanFormation();
    }

    if (props.duty === 'OFFICER' || props.duty === 'SECRETARY') {
      throw new InvalidChairmanDuty();
    }

    if (props.title === 'FIRST_SECRETARY') {
      throw new InvalidChairmanTitle();
    }

    return new OfficialReportChairman(
      props.id,
      props.firstName,
      props.lastName,
      props.gender,
      props.displayTitle,
      props.title,
    );
  }
}

export class InvalidChairmanRole extends Error {}
export class InvalidChairmanFormation extends Error {}
export class InvalidChairmanDuty extends Error {}
export class InvalidChairmanTitle extends Error {}
