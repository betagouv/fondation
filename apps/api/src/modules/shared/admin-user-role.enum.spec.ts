import { adminUserRoleLabel } from './admin-user-role.enum';

describe('adminUserRoleLabel', () => {
  it.each`
    role                          | gender       | expected
    ${'PRESIDENT_SIEGE'}          | ${'MALE'}    | ${'Président de la formation du siège'}
    ${'PRESIDENT_SIEGE'}          | ${'FEMALE'}  | ${'Présidente de la formation du siège'}
    ${'PRESIDENT_SIEGE'}          | ${undefined} | ${'Président(e) de la formation du siège'}
    ${'DEPUTY_PRESIDENT_PARQUET'} | ${'MALE'}    | ${'Président suppléant de la formation du parquet'}
    ${'DEPUTY_PRESIDENT_PARQUET'} | ${'FEMALE'}  | ${'Présidente suppléante de la formation du parquet'}
    ${'DEPUTY_PRESIDENT_PARQUET'} | ${undefined} | ${'Président(e) suppléant(e) de la formation du parquet'}
    ${'FIRST_SECRETARY'}          | ${'FEMALE'}  | ${'Secrétaire générale'}
    ${'SECRETARY'}                | ${'FEMALE'}  | ${'Secrétaire générale adjointe'}
    ${'SECRETARY'}                | ${undefined} | ${'Secrétaire général(e) adjoint(e)'}
    ${'OFFICER'}                  | ${'MALE'}    | ${'Agent du pôle nomination'}
    ${'OFFICER'}                  | ${'FEMALE'}  | ${'Agente du pôle nomination'}
    ${'MEMBRE_SIEGE'}             | ${'FEMALE'}  | ${'Membre du siège'}
    ${'MEMBRE_COMMUN'}            | ${undefined} | ${'Membre commun'}
  `('should label $role for the gender $gender as "$expected"', ({ expected, gender, role }) => {
    expect(adminUserRoleLabel(role, gender)).toBe(expected);
  });
});
