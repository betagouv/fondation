import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { frFormat } from '@/i18n/formats';
import type { ListedNominationFileAttachmentDto } from '@api/types';

import { Attachments } from './Attachments';

const mocks = vi.hoisted(() => ({
  attachments: [] as ListedNominationFileAttachmentDto['items'],
  cancelTab: vi.fn(),
  createUrl: vi.fn(),
  downloadFile: vi.fn(),
  isSg: vi.fn(() => true),
  open: vi.fn(),
  openAddAttachment: vi.fn(),
  remove: vi.fn(),
  settleTab: vi.fn(),
  waitForConfirmation: vi.fn(async () => ({ isConfirmed: true })),
}));

vi.mock('./context/AddNominationFileAttachmentModalContext', () => ({
  useAddNominationFileAttachmentModal: () => ({ open: mocks.openAddAttachment }),
}));
vi.mock('@/shared/context/confirm-modal', () => ({
  useConfirmModal: () => ({ waitForConfirmation: mocks.waitForConfirmation }),
}));
vi.mock('@/shared/hooks/useTab', () => ({
  useTab: () => ({
    open: mocks.open,
    openDeferred: () => ({ cancel: mocks.cancelTab, settle: mocks.settleTab }),
  }),
}));
vi.mock('@/features/auth/hooks/roles.hook', () => ({ useIsSgNavigation: () => mocks.isSg() }));
vi.mock('@queries/files.queries', () => ({
  useDownloadFileMutation: () => ({
    isError: false,
    isPending: false,
    mutate: mocks.downloadFile,
    reset: vi.fn(),
  }),
}));
vi.mock('@queries/nomination-sessions.queries', () => ({
  useCreateNominationFileAttachmentUrlMutation: () => ({
    isError: false,
    isPending: false,
    mutate: mocks.createUrl,
    reset: vi.fn(),
  }),
  useListNominationFileAttachmentsQuery: () => ({ data: { items: mocks.attachments } }),
  useRemoveNominationFileAttachmentMutation: () => ({
    isError: false,
    isPending: false,
    mutate: mocks.remove,
    reset: vi.fn(),
  }),
}));

const PROPS = { isArchived: false, nominationFileId: 'nf-1', sessionId: 'session-1' };

function renderAttachments(overrides: Partial<typeof PROPS> = {}) {
  return render(
    <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr">
      <Attachments {...PROPS} {...overrides} />
    </IntlProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isSg.mockReturnValue(true);
  mocks.attachments = [
    {
      addedAt: { year: 2026, month: 6, day: 18 },
      id: 'file-1',
      name: 'rapport.pdf',
      size: 2048,
      type: 'FICHE_DE_JURIDICTION',
    },
  ];
});

describe('Attachments listing', () => {
  it('renders each attachment with its name and formatted metadata', () => {
    renderAttachments();

    expect(screen.getByRole('button', { name: 'rapport' })).toBeInTheDocument();
    expect(screen.getByText('PDF - 2 Ko')).toBeInTheDocument();
  });

  it('renders the type badge and the date the attachment was added', () => {
    renderAttachments();
    const list = within(screen.getByRole('list'));

    expect(list.getByText('Fiche de juridiction')).toBeInTheDocument();
    expect(list.getByText('Ajoutée le 18/06/2026')).toBeInTheDocument();
  });

  it('renders nothing for a member when there is no attachment', () => {
    mocks.isSg.mockReturnValue(false);
    mocks.attachments = [];
    const { container } = renderAttachments();

    expect(container).toBeEmptyDOMElement();
  });
});

describe('Attachments actions', () => {
  it('settles the tab opened on click with the file url', async () => {
    mocks.createUrl.mockImplementation((_vars, options) =>
      options.onSuccess({ url: 'https://files/rapport.pdf' }),
    );
    const user = userEvent.setup();
    renderAttachments();

    await user.click(screen.getByRole('button', { name: 'rapport' }));

    expect(mocks.createUrl).toHaveBeenCalledWith(
      { fileId: 'file-1', nominationFileId: 'nf-1', sessionId: 'session-1' },
      expect.any(Object),
    );
    expect(mocks.settleTab).toHaveBeenCalledWith('https://files/rapport.pdf');
  });

  it('closes the tab opened on click when the url cannot be created', async () => {
    mocks.createUrl.mockImplementation((_vars, options) => options.onError());
    const user = userEvent.setup();
    renderAttachments();

    await user.click(screen.getByRole('button', { name: 'rapport' }));

    expect(mocks.cancelTab).toHaveBeenCalled();
    expect(mocks.settleTab).not.toHaveBeenCalled();
  });

  it('downloads the file from the url the api returned', async () => {
    mocks.createUrl.mockImplementation((_vars, options) =>
      options.onSuccess({ url: 'https://api.example/api/files/v1/abc' }),
    );
    const user = userEvent.setup();
    renderAttachments();

    await user.click(screen.getByRole('button', { name: 'Télécharger rapport.pdf' }));

    expect(mocks.downloadFile).toHaveBeenCalledWith({
      name: 'rapport.pdf',
      url: 'https://api.example/api/files/v1/abc',
    });
  });

  it('removes the file once the deletion is confirmed', async () => {
    const user = userEvent.setup();
    renderAttachments();

    await user.click(screen.getByRole('button', { name: 'Supprimer rapport.pdf' }));

    expect(mocks.waitForConfirmation).toHaveBeenCalledOnce();
    expect(mocks.remove).toHaveBeenCalledWith({
      fileId: 'file-1',
      nominationFileId: 'nf-1',
      sessionId: 'session-1',
    });
  });

  it('does not remove the file when the deletion is cancelled', async () => {
    mocks.waitForConfirmation.mockResolvedValueOnce({ isConfirmed: false });
    const user = userEvent.setup();
    renderAttachments();

    await user.click(screen.getByRole('button', { name: 'Supprimer rapport.pdf' }));

    expect(mocks.waitForConfirmation).toHaveBeenCalledOnce();
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it('opens the add modal on the displayed nomination file', async () => {
    const user = userEvent.setup();
    renderAttachments({ nominationFileId: 'nf-2' });

    await user.click(screen.getByRole('button', { name: 'Ajouter' }));

    expect(mocks.openAddAttachment).toHaveBeenCalledWith({
      nominationFileId: 'nf-2',
      sessionId: 'session-1',
    });
  });
});

describe('Attachments permissions', () => {
  it('hides delete and upload from a member', () => {
    mocks.isSg.mockReturnValue(false);
    renderAttachments();

    expect(screen.queryByRole('button', { name: /Supprimer/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ajouter' })).not.toBeInTheDocument();
  });

  it('hides delete and upload when the file is archived', () => {
    renderAttachments({ isArchived: true });

    expect(screen.queryByRole('button', { name: /Supprimer/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ajouter' })).not.toBeInTheDocument();
  });
});

describe('Attachments accessibility', () => {
  it('passes basic accessibility checks', async () => {
    const { container } = renderAttachments();

    expect(await axe(container)).toHaveNoViolations();
  });
});
