import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { MagistratAttachments } from './MagistratAttachments';

const mocks = vi.hoisted(() => ({
  add: vi.fn(),
  attachments: [] as { id: string; name: string; size: number | null }[],
  createUrl: vi.fn(),
  download: vi.fn(),
  isSg: vi.fn(() => true),
  open: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('@/shared/hooks/useTab', () => ({ useTab: () => ({ open: mocks.open, download: mocks.download }) }));
vi.mock('@/features/auth/hooks/roles.hook', () => ({ useIsSgNavigation: () => mocks.isSg() }));
vi.mock('@queries/nomination-sessions.queries', () => ({
  useListNominationFileAttachmentsQuery: () => ({ data: { items: mocks.attachments } }),
  useAddNominationFileAttachmentsMutation: () => ({
    mutate: mocks.add,
    isPending: false,
    isError: false,
    reset: vi.fn(),
  }),
  useCreateNominationFileAttachmentUrlMutation: () => ({
    mutate: mocks.createUrl,
    isPending: false,
    isError: false,
    reset: vi.fn(),
  }),
  useRemoveNominationFileAttachmentMutation: () => ({
    mutate: mocks.remove,
    isPending: false,
    isError: false,
    reset: vi.fn(),
  }),
}));

const PROPS = { nominationFileId: 'nf-1', sessionId: 'session-1', isArchived: false };

function renderAttachments(overrides: Partial<typeof PROPS> = {}) {
  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <MagistratAttachments {...PROPS} {...overrides} />
    </IntlProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isSg.mockReturnValue(true);
  mocks.attachments = [{ id: 'file-1', name: 'rapport.pdf', size: 2048 }];
});

describe('MagistratAttachments listing', () => {
  it('renders each attachment with its name and formatted metadata', () => {
    renderAttachments();

    expect(screen.getByRole('button', { name: 'rapport' })).toBeInTheDocument();
    expect(screen.getByText('PDF - 2 Ko')).toBeInTheDocument();
  });

  it('shows the empty state to a member when there is no attachment', () => {
    mocks.isSg.mockReturnValue(false);
    mocks.attachments = [];
    renderAttachments();

    expect(screen.getByText('Aucune pièce jointe')).toBeInTheDocument();
  });
});

describe('MagistratAttachments actions', () => {
  it('opens the file in a new tab when previewing', async () => {
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
    expect(mocks.open).toHaveBeenCalledWith('https://files/rapport.pdf');
  });

  it('downloads the file with the download flag', async () => {
    mocks.createUrl.mockImplementation((_vars, options) =>
      options.onSuccess({ url: 'https://files/rapport.pdf' }),
    );
    const user = userEvent.setup();
    renderAttachments();

    await user.click(screen.getByRole('button', { name: 'Télécharger rapport.pdf' }));

    expect(mocks.download).toHaveBeenCalledWith('https://files/rapport.pdf?download');
  });

  it('removes the file when deleting', async () => {
    const user = userEvent.setup();
    renderAttachments();

    await user.click(screen.getByRole('button', { name: 'Supprimer rapport.pdf' }));

    expect(mocks.remove).toHaveBeenCalledWith({
      fileId: 'file-1',
      nominationFileId: 'nf-1',
      sessionId: 'session-1',
    });
  });

  it('uploads the selected files', async () => {
    const user = userEvent.setup();
    const { container } = renderAttachments();

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, new File(['data'], 'new.pdf', { type: 'application/pdf' }));

    expect(mocks.add).toHaveBeenCalledWith(
      expect.objectContaining({ nominationFileId: 'nf-1', sessionId: 'session-1' }),
      expect.any(Object),
    );
    expect(mocks.add.mock.calls[0][0].files).toHaveLength(1);
  });
});

describe('MagistratAttachments permissions', () => {
  it('hides delete and upload from a member', () => {
    mocks.isSg.mockReturnValue(false);
    renderAttachments();

    expect(screen.queryByRole('button', { name: /Supprimer/ })).not.toBeInTheDocument();
    expect(screen.queryByText('Ajouter un fichier')).not.toBeInTheDocument();
  });

  it('hides delete and upload when the file is archived', () => {
    renderAttachments({ isArchived: true });

    expect(screen.queryByRole('button', { name: /Supprimer/ })).not.toBeInTheDocument();
    expect(screen.queryByText('Ajouter un fichier')).not.toBeInTheDocument();
  });
});

describe('MagistratAttachments accessibility', () => {
  it('passes basic accessibility checks', async () => {
    const { container } = renderAttachments();

    expect(await axe(container)).toHaveNoViolations();
  });
});
