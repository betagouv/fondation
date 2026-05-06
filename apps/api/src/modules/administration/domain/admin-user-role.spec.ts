import { Role } from 'shared-models';

import { AdminUserRole } from './admin-user-role';
import { AdminUserTitle } from './admin-user-title';
import { ADMIN_USER_ROLES_ENUM, USER_DUTIES, USER_TITLES } from './user-enum';

describe('AdminUserRole', () => {
  it('handle all possible combinations without throwing', () => {
    const snapshot = Object.values(Role).flatMap((role) =>
      USER_TITLES.flatMap((title) =>
        USER_DUTIES.map((duty) => {
          const x = AdminUserRole.from({ role, title, duty });
          const result = {
            asString: x.toString(),
            role: x.role,
            title: x.title,
            duty: x.duty,
          };

          return {
            role,
            title,
            duty,
            result,
          };
        }),
      ),
    );

    expect(snapshot).toMatchSnapshot();
  });

  it.each`
    role                               | title                         | duty                  | expected
    ${Role.ADJOINT_SECRETAIRE_GENERAL} | ${'FIRST_SECRETARY'}          | ${'SECRETARY'}        | ${'FIRST_SECRETARY'}
    ${Role.ADJOINT_SECRETAIRE_GENERAL} | ${null}                       | ${'SECRETARY'}        | ${'SECRETARY'}
    ${Role.ADJOINT_SECRETAIRE_GENERAL} | ${null}                       | ${'OFFICER'}          | ${'OFFICER'}
    ${Role.ADJOINT_SECRETAIRE_GENERAL} | ${null}                       | ${null}               | ${'OFFICER'}
    ${Role.MEMBRE_DU_SIEGE}            | ${'PRESIDENT_SIEGE'}          | ${'PRESIDENT'}        | ${'PRESIDENT_SIEGE'}
    ${Role.MEMBRE_DU_SIEGE}            | ${'DEPUTY_PRESIDENT_SIEGE'}   | ${'DEPUTY_PRESIDENT'} | ${'DEPUTY_PRESIDENT_SIEGE'}
    ${Role.MEMBRE_DU_SIEGE}            | ${null}                       | ${null}               | ${'MEMBRE_SIEGE'}
    ${Role.MEMBRE_DU_PARQUET}          | ${'PRESIDENT_PARQUET'}        | ${'PRESIDENT'}        | ${'PRESIDENT_PARQUET'}
    ${Role.MEMBRE_DU_PARQUET}          | ${'DEPUTY_PRESIDENT_PARQUET'} | ${'DEPUTY_PRESIDENT'} | ${'DEPUTY_PRESIDENT_PARQUET'}
    ${Role.MEMBRE_DU_PARQUET}          | ${null}                       | ${null}               | ${'MEMBRE_PARQUET'}
    ${Role.MEMBRE_COMMUN}              | ${null}                       | ${null}               | ${'MEMBRE_COMMUN'}
  `('role=$role, title=$title, duty=$duty -> $expected', ({ role, title, duty, expected }) => {
    const adminUserRole = AdminUserRole.from({ role, title, duty });
    expect(adminUserRole.toString()).toBe(expected);
  });

  it('should always retitle in the same way', () => {
    const snapshot = Object.values(Role).flatMap((role) =>
      USER_TITLES.flatMap((title) =>
        USER_DUTIES.flatMap((duty) => {
          return ADMIN_USER_ROLES_ENUM.map((nextTitle) => {
            const y = AdminUserRole.from({ role, title, duty });
            const x = y.reTitle(AdminUserTitle.from(nextTitle));

            const result = x
              ? {
                  asString: x.toString(),
                  role: x.role,
                  title: x.title,
                  duty: x.duty,
                }
              : null;

            return {
              role,
              title,
              duty,
              nextTitle,
              result,
            };
          });
        }),
      ),
    );

    expect(snapshot).toMatchSnapshot();
  });

  it('should re-title the COMMUN PRESIDENT_SIEGE to MEMBRE_COMMUN', () => {
    const reTitled = AdminUserRole.from({
      role: Role.MEMBRE_COMMUN,
      title: 'PRESIDENT_SIEGE',
      duty: 'PRESIDENT',
    }).reTitle(AdminUserTitle.from('MEMBRE_COMMUN'));

    expect(reTitled).not.toBeNull();
    expect(reTitled?.role).toBe(Role.MEMBRE_COMMUN);
    expect(reTitled?.duty).toBeNull();
    expect(reTitled?.title).toBeNull();
  });

  it('should re-title the ADMIN FIRST_SECRETARY to SECRETARY', () => {
    const reTitled = AdminUserRole.from({
      role: Role.ADMIN,
      title: 'FIRST_SECRETARY',
      duty: 'SECRETARY',
    }).reTitle(AdminUserTitle.from('SECRETARY'));

    expect(reTitled).not.toBeNull();
    expect(reTitled?.role).toBe(Role.ADMIN);
    expect(reTitled?.duty).toBe('SECRETARY');
    expect(reTitled?.title).toBeNull();
  });

  it('should re-title the ADMIN FIRST_SECRETARY to MEMBRE SIEGE', () => {
    const reTitled = AdminUserRole.from({
      role: Role.ADMIN,
      title: 'FIRST_SECRETARY',
      duty: 'SECRETARY',
    }).reTitle(AdminUserTitle.from('MEMBRE_SIEGE'));

    expect(reTitled).not.toBeNull();
    expect(reTitled?.role).toBe(Role.MEMBRE_DU_SIEGE);
    expect(reTitled?.duty).toBeNull();
    expect(reTitled?.title).toBeNull();
  });

  it('should NOT re-title the ADMIN SECRETARY to SECRETARY', () => {
    const reTitled = AdminUserRole.from({
      role: Role.ADMIN,
      title: null,
      duty: 'SECRETARY',
    }).reTitle(AdminUserTitle.from('SECRETARY'));

    expect(reTitled).toBeNull();
  });
});
