import { RoleEnum } from 'src/modules/shared/role.enum';

import {
  InvalidSecretaryDuty,
  InvalidSecretaryRole,
  InvalidSecretaryTitle,
  OfficialReportSecretary,
} from './official-report-secretary';
import { makeSecretary } from './official-report-test-utils';

describe('OfficialReportSecretary', () => {
  it.each`
    role
    ${RoleEnum.MEMBRE_COMMUN}
    ${RoleEnum.MEMBRE_DU_PARQUET}
    ${RoleEnum.MEMBRE_DU_SIEGE}
  `('should prevent creating a secretary from a $role', ({ role }) => {
    expect(() => OfficialReportSecretary.from(makeSecretary({ role }))).toThrow(InvalidSecretaryRole);
  });

  it.each`
    role
    ${RoleEnum.ADMIN}
    ${RoleEnum.ADJOINT_SECRETAIRE_GENERAL}
  `('should allow creating a secretary from a $role', ({ role }) => {
    expect(() => OfficialReportSecretary.from(makeSecretary({ role }))).not.toThrow(InvalidSecretaryRole);
  });

  it.each`
    duty
    ${'PRESIDENT'}
    ${'DEPUTY_PRESIDENT'}
    ${'OFFICER'}
    ${null}
  `('should prevent creating a secretary with a duty "$duty"', ({ duty }) => {
    expect(() => OfficialReportSecretary.from(makeSecretary({ duty }))).toThrow(InvalidSecretaryDuty);
  });

  it('should allow creating a secretary with a duty "SECRETARY"', () => {
    expect(() => OfficialReportSecretary.from(makeSecretary({ duty: 'SECRETARY' }))).not.toThrow(
      InvalidSecretaryDuty,
    );
  });

  it.each`
    title
    ${'PRESIDENT_SIEGE'}
    ${'PRESIDENT_PARQUET'}
    ${'DEPUTY_PRESIDENT_SIEGE'}
    ${'DEPUTY_PRESIDENT_PARQUET'}
  `('should prevent creating a secretary with a title "$title"', ({ title }) => {
    expect(() => OfficialReportSecretary.from(makeSecretary({ title }))).toThrow(InvalidSecretaryTitle);
  });

  it.each`
    title
    ${'FIRST_SECRETARY'}
    ${null}
  `('should allow creating a secretary with a title "$title"', ({ title }) => {
    expect(() => OfficialReportSecretary.from(makeSecretary({ title }))).not.toThrow(InvalidSecretaryTitle);
  });

  describe('#equals', () => {
    it('should be true when ids are equal', () => {
      const first = OfficialReportSecretary.from(makeSecretary({ id: 'secretary-1' }));
      const second = OfficialReportSecretary.from(makeSecretary({ id: 'secretary-1' }));

      expect(first.equals(second)).toBe(true);
    });

    it('should be false when ids are NOT equal', () => {
      const first = OfficialReportSecretary.from(makeSecretary({ id: 'secretary-1' }));
      const second = OfficialReportSecretary.from(makeSecretary({ id: 'secretary-2' }));

      expect(first.equals(second)).toBe(false);
    });

    it('should be false when ids are null', () => {
      const first = OfficialReportSecretary.from(makeSecretary({ id: null }));
      const second = OfficialReportSecretary.from(makeSecretary({ id: null }));

      expect(first.equals(second)).toBe(false);
    });
  });
});
