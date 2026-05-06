import { AdminUserTitle } from './admin-user-title';
import { ADMIN_USER_ROLES_ENUM, AdminUserRoleEnum } from './user-enum';

describe('AdminUserTitle', () => {
  it('should always map to the same values', () => {
    const fixtures = ADMIN_USER_ROLES_ENUM.map((input) => {
      const { duty, title } = AdminUserTitle.from(input);
      return { input, duty, title };
    });

    expect(fixtures).toMatchSnapshot();
  });

  it.each`
    source                                                    | expected
    ${'DEPUTY_PRESIDENT_PARQUET' satisfies AdminUserRoleEnum} | ${'MEMBRE_PARQUET' satisfies AdminUserRoleEnum}
    ${'DEPUTY_PRESIDENT_SIEGE' satisfies AdminUserRoleEnum}   | ${'MEMBRE_SIEGE' satisfies AdminUserRoleEnum}
    ${'PRESIDENT_PARQUET' satisfies AdminUserRoleEnum}        | ${'MEMBRE_PARQUET' satisfies AdminUserRoleEnum}
    ${'PRESIDENT_SIEGE' satisfies AdminUserRoleEnum}          | ${'MEMBRE_SIEGE' satisfies AdminUserRoleEnum}
    ${'FIRST_SECRETARY' satisfies AdminUserRoleEnum}          | ${'SECRETARY' satisfies AdminUserRoleEnum}
  `(
    `should un-title $source -> $expected`,
    ({ source, expected }: { source: AdminUserRoleEnum; expected: AdminUserRoleEnum }) => {
      expect(AdminUserTitle.from(source).unTitle().toString()).toBe(expected);
    },
  );
});
