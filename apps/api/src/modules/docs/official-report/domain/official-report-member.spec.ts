import { FormationEnum } from 'src/modules/shared/formation.enum';
import { RoleEnum } from 'src/modules/shared/role.enum';

import {
  InvalidMemberDuty,
  InvalidMemberFormation,
  InvalidMemberRole,
  InvalidMemberTitle,
  OfficialReportMember,
} from './official-report-member';
import { makeMember } from './official-report-test-utils';

describe('OfficialReportMember', () => {
  it('should prevent creating a member from an ADJOINT_SECRETAIRE_GENERAL', () => {
    expect(() => OfficialReportMember.from(makeMember({ role: 'ADJOINT_SECRETAIRE_GENERAL' }))).toThrow(
      InvalidMemberRole,
    );
  });

  it('should prevent creating a member from an ADMIN', () => {
    expect(() => OfficialReportMember.from(makeMember({ role: 'ADMIN' }))).toThrow(InvalidMemberRole);
  });

  it.each`
    role                          | expectedFormation
    ${RoleEnum.MEMBRE_DU_PARQUET} | ${FormationEnum.SIEGE}
    ${RoleEnum.MEMBRE_DU_SIEGE}   | ${FormationEnum.PARQUET}
  `(
    `should prevent creating a member with role $role when formation is $expectedFormation`,
    ({ role, expectedFormation }) => {
      expect(() => OfficialReportMember.from(makeMember({ role, expectedFormation }))).toThrow(
        InvalidMemberFormation,
      );
    },
  );

  it.each`
    role                          | expectedFormation
    ${RoleEnum.MEMBRE_COMMUN}     | ${FormationEnum.SIEGE}
    ${RoleEnum.MEMBRE_DU_SIEGE}   | ${FormationEnum.SIEGE}
    ${RoleEnum.MEMBRE_COMMUN}     | ${FormationEnum.PARQUET}
    ${RoleEnum.MEMBRE_DU_PARQUET} | ${FormationEnum.PARQUET}
  `(
    `should allow creating a member with role $role when formation is $expectedFormation`,
    ({ role, expectedFormation }) => {
      expect(() => OfficialReportMember.from(makeMember({ role, expectedFormation }))).not.toThrow(
        InvalidMemberFormation,
      );
    },
  );

  it('should prevent creating a member with a duty "OFFICER"', () => {
    expect(() => OfficialReportMember.from(makeMember({ duty: 'OFFICER' }))).toThrow(InvalidMemberDuty);
  });

  it('should prevent creating a member with a duty "SECRETARY"', () => {
    expect(() => OfficialReportMember.from(makeMember({ duty: 'SECRETARY' }))).toThrow(InvalidMemberDuty);
  });

  it('should prevent creating a member with a title "FIRST_SECRETARY"', () => {
    expect(() => OfficialReportMember.from(makeMember({ title: 'FIRST_SECRETARY' }))).toThrow(
      InvalidMemberTitle,
    );
  });

  describe('#equals', () => {
    it('should be true when ids are equal', () => {
      const first = OfficialReportMember.from(makeMember({ id: 'member-1' }));
      const second = OfficialReportMember.from(makeMember({ id: 'member-1' }));

      expect(first.equals(second)).toBe(true);
    });

    it('should be false when ids are NOT equal', () => {
      const first = OfficialReportMember.from(makeMember({ id: 'member-1' }));
      const second = OfficialReportMember.from(makeMember({ id: 'member-2' }));

      expect(first.equals(second)).toBe(false);
    });
  });
});
