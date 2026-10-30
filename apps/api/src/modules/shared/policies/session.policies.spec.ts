import { canReadSession } from './session.policies';

describe('canReadSession', () => {
  const session = { formation: 'SIEGE' } as const;

  it.each(['ADJOINT_SECRETAIRE_GENERAL', 'MEMBRE_COMMUN'] as const)('lets %s read every session', (role) => {
    expect(canReadSession(session, { role })).toBe(true);
  });

  it('lets a member read a session of their formation', () => {
    expect(canReadSession(session, { role: 'MEMBRE_DU_SIEGE' })).toBe(true);
  });

  it('hides a session of the other formation from a member', () => {
    expect(canReadSession(session, { role: 'MEMBRE_DU_PARQUET' })).toBe(false);
  });
});
