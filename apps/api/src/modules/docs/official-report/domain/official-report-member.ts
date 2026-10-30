import { FormationEnum } from '../../../shared/formation.enum';
import { GenderEnum } from '../../../shared/gender.enum';
import { isSecretariat, RoleEnum } from '../../../shared/role.enum';
import { UserDutyEnum } from '../../../shared/user-duty.enum';
import { UserTitleEnum } from '../../../shared/user-title.enum';

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

  static recorded(member: {
    firstName: string;
    gender: GenderEnum;
    isAbsent: boolean;
    lastName: string;
    memberId: string;
    sort: number;
    title: string | null;
  }): OfficialReportMember {
    return new OfficialReportMember(
      member.memberId,
      member.firstName,
      member.lastName,
      member.gender,
      member.sort,
      member.title,
      member.isAbsent,
    );
  }

  static from(props: {
    displayTitle: string | null;
    duty: UserDutyEnum | null;
    expectedFormation: FormationEnum;
    firstName: string;
    gender: GenderEnum;
    id: string;
    isAbsent: boolean;
    lastName: string;
    role: RoleEnum;
    sort: number;
    title: UserTitleEnum | null;
  }): OfficialReportMember {
    if (isSecretariat(props.role)) {
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
