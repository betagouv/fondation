import { personalContentVisibility } from './personal-content.policies';

describe('personalContentVisibility', () => {
  it('shows their personal content to the person themselves', () => {
    expect(personalContentVisibility({ impersonation: undefined })).toBe('VISIBLE');
  });

  it('keeps it private from the admin impersonating them', () => {
    expect(personalContentVisibility({ impersonation: { impersonatorId: 'admin-1' } })).toBe('PRIVATE');
  });
});
