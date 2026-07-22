import { UserDutyEnum, UserTitleEnum } from 'src/modules/administration/domain/user-enum';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { GenderEnum } from 'src/modules/shared/gender.enum';
import { RoleEnum } from 'src/modules/shared/role.enum';

export class OfficialReportMember {
  constructor(
    readonly id: string,
    readonly firstName: string,
    readonly lastName: string,
    readonly gender: GenderEnum,
    readonly sort: number,
    readonly displayTitle: string | null,
    readonly isAbsent: boolean,
  ) {}

  equals(other: OfficialReportMember): boolean {
    return typeof this.id === 'string' && typeof other.id === 'string' && this.id === other.id;
  }

  static from(props: {
    id: string;
    firstName: string;
    lastName: string;
    gender: GenderEnum;
    displayTitle: string | null;
    sort: number;
    title: UserTitleEnum | null;
    duty: UserDutyEnum | null;
    role: RoleEnum;
    isAbsent: boolean;
    expectedFormation: FormationEnum;
  }): OfficialReportMember {
    if (props.role === 'ADJOINT_SECRETAIRE_GENERAL' || props.role === 'ADMIN') {
      throw new InvalidMemberRole();
    }

    if (
      (props.expectedFormation === 'PARQUET' && props.role === 'MEMBRE_DU_SIEGE') ||
      (props.expectedFormation === 'SIEGE' && props.role === 'MEMBRE_DU_PARQUET')
    ) {
      throw new InvalidMemberFormation();
    }

    if (props.duty === 'OFFICER' || props.duty === 'SECRETARY') {
      throw new InvalidMemberDuty();
    }

    if (props.title === 'FIRST_SECRETARY') {
      throw new InvalidMemberTitle();
    }

    return new OfficialReportMember(
      props.id,
      props.firstName,
      props.lastName,
      props.gender,
      props.sort,
      props.displayTitle,
      props.isAbsent,
    );
  }
}

export class InvalidMemberRole extends Error {}
export class InvalidMemberFormation extends Error {}
export class InvalidMemberDuty extends Error {}
export class InvalidMemberTitle extends Error {}
