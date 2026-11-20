import { reportAttachmentsVisibility, reportLock } from './report-lock';

const impersonation = { impersonatorId: 'admin-1' };

describe('reportLock', () => {
  it('lets a reporter edit their report in an open session', () => {
    expect(reportLock({ isOpen: true }, { impersonation: undefined })).toBeNull();
  });

  it('locks every report once the session is closed', () => {
    expect(reportLock({ isOpen: false }, { impersonation: undefined })).toBe('CLOSED_SESSION');
  });

  it('locks the report of a reporter for the admin impersonating them', () => {
    expect(reportLock({ isOpen: true }, { impersonation })).toBe('IMPERSONATION');
  });
});

describe('reportAttachmentsVisibility', () => {
  it('lets a reporter open the attachments of their report', () => {
    expect(reportAttachmentsVisibility({ impersonation: undefined, role: 'MEMBRE_COMMUN' })).toBe('VISIBLE');
  });

  it('keeps them private from the admin impersonating the reporter', () => {
    expect(reportAttachmentsVisibility({ impersonation, role: 'MEMBRE_COMMUN' })).toBe('PRIVATE');
  });

  it('leaves them closed to the secretariat', () => {
    expect(
      reportAttachmentsVisibility({ impersonation: undefined, role: 'ADJOINT_SECRETAIRE_GENERAL' }),
    ).toBeNull();
  });
});
