import { memberFormationOf, memberRolesOf } from './member.utils';

describe('memberRolesOf', () => {
  it('keeps every member when no formation is asked', () => {
    expect(memberRolesOf([])).toEqual(['MEMBRE_COMMUN', 'MEMBRE_DU_PARQUET', 'MEMBRE_DU_SIEGE']);
  });

  it('keeps the members of the asked formations only', () => {
    expect(memberRolesOf(['COMMUN', 'SIEGE'])).toEqual(['MEMBRE_COMMUN', 'MEMBRE_DU_SIEGE']);
  });
});

describe('memberFormationOf', () => {
  it('names the formation of a member', () => {
    expect(memberFormationOf('MEMBRE_DU_PARQUET')).toEqual({ id: 'PARQUET', label: 'Parquet' });
  });
});
