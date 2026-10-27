import { canReadHelpPage } from './help-page';

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
