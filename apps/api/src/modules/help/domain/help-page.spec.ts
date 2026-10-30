import { canReadHelpPage, helpPageOf } from './help-page';

describe('canReadHelpPage', () => {
  it('lets a member read the help of the member space only', () => {
    expect(canReadHelpPage('MEMBRE', { role: 'MEMBRE_DU_SIEGE' })).toBe(true);
    expect(canReadHelpPage('SECRETARIAT_GENERAL', { role: 'MEMBRE_COMMUN' })).toBe(false);
  });

  it('lets the secretariat read both', () => {
    expect(canReadHelpPage('MEMBRE', { role: 'ADJOINT_SECRETAIRE_GENERAL' })).toBe(true);
    expect(canReadHelpPage('SECRETARIAT_GENERAL', { role: 'ADJOINT_SECRETAIRE_GENERAL' })).toBe(true);
  });
});

describe('helpPageOf', () => {
  it('gives a member the help of the member space', () => {
    expect(helpPageOf({ role: 'MEMBRE_DU_PARQUET' })).toBe('MEMBRE');
  });

  it('gives the secretariat its own help, which it can read', () => {
    const reader = { role: 'ADJOINT_SECRETAIRE_GENERAL' as const };

    expect(helpPageOf(reader)).toBe('SECRETARIAT_GENERAL');
    expect(canReadHelpPage(helpPageOf(reader), reader)).toBe(true);
  });
});
