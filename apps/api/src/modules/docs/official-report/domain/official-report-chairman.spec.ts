import { FormationEnum } from 'src/modules/shared/formation.enum';
import { RoleEnum } from 'src/modules/shared/role.enum';

import {
  InvalidChairmanDuty,
  InvalidChairmanFormation,
  InvalidChairmanRole,
  InvalidChairmanTitle,
  OfficialReportChairman,
} from './official-report-chairman';
import { makeChairman } from './official-report-test-utils';

describe('OfficialReportChairman', () => {
  it('should prevent creating a chairman from an ADJOINT_SECRETAIRE_GENERAL', () => {
    expect(() =>
      OfficialReportChairman.from(makeChairman({ role: RoleEnum.ADJOINT_SECRETAIRE_GENERAL })),
    ).toThrow(InvalidChairmanRole);
  });

  it('should prevent creating a chairman from an ADMIN', () => {
    expect(() => OfficialReportChairman.from(makeChairman({ role: RoleEnum.ADMIN }))).toThrow(
      InvalidChairmanRole,
    );
  });

  it.each`
    role                          | expectedFormation
    ${RoleEnum.MEMBRE_DU_PARQUET} | ${FormationEnum.SIEGE}
    ${RoleEnum.MEMBRE_DU_SIEGE}   | ${FormationEnum.PARQUET}
  `(
    `should prevent creating a chairman with role $role when formation is $formation`,
    ({ role, expectedFormation }) => {
      expect(() => OfficialReportChairman.from(makeChairman({ role, expectedFormation }))).toThrow(
        InvalidChairmanFormation,
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
    `should allow creating a chairman with role $role when formation is $formation`,
    ({ role, expectedFormation }) => {
      expect(() => OfficialReportChairman.from(makeChairman({ role, expectedFormation }))).not.toThrow(
        InvalidChairmanFormation,
      );
    },
  );

  it('should prevent creating a chairman with a duty "OFFICER"', () => {
    expect(() => OfficialReportChairman.from(makeChairman({ duty: 'OFFICER' }))).toThrow(InvalidChairmanDuty);
  });

  it('should prevent creating a chairman with a duty "SECRETARY"', () => {
    expect(() => OfficialReportChairman.from(makeChairman({ duty: 'SECRETARY' }))).toThrow(
      InvalidChairmanDuty,
    );
  });

  it('should prevent creating a chairman with a title "FIRST_SECRETARY"', () => {
    expect(() => OfficialReportChairman.from(makeChairman({ title: 'FIRST_SECRETARY' }))).toThrow(
      InvalidChairmanTitle,
    );
  });

  describe('#equals', () => {
    it('should be true when ids are equal', () => {
      const first = OfficialReportChairman.from(makeChairman({ id: 'chairman-1' }));
      const second = OfficialReportChairman.from(makeChairman({ id: 'chairman-1' }));

      expect(first.equals(second)).toBe(true);
    });

    it('should be false when ids are NOT equal', () => {
      const first = OfficialReportChairman.from(makeChairman({ id: 'chairman-1' }));
      const second = OfficialReportChairman.from(makeChairman({ id: 'chairman-2' }));

      expect(first.equals(second)).toBe(false);
    });

    it('should NOT compare by id when one is null', () => {
      const first = OfficialReportChairman.from(makeChairman({ id: null }));
      const second = OfficialReportChairman.from(makeChairman({ id: 'chairman-1' }));

      expect(first.equals(second)).toBe(false);
    });

    it('should NOT compare by id when both are null', () => {
      const first = OfficialReportChairman.from(makeChairman({ id: null }));
      const second = OfficialReportChairman.from(makeChairman({ id: null }));

      expect(first.equals(second)).toBe(false);
    });
  });
});
