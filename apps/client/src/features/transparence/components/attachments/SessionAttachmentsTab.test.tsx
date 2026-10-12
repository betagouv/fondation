import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import type { ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ToastProvider } from '@/shared/ui/toast';

import { SessionAttachmentsTab } from './SessionAttachmentsTab';

const createUrl = vi.fn();

vi.mock('@queries/nomination-sessions.queries', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCreateNominationSessionAttachmentUrlMutation: () => ({ isPending: false, mutate: createUrl }),
  useListNominationSessionAttachmentsQuery: () => ({
    data: {
      items: [
        {
          addedAt: { day: 4, month: 2, year: 2028 },
          id: 'file-1',
          name: 'Fiche de juridiction.pdf',
          sizeInBytes: 248_000,
        },
        {
          addedAt: { day: 2, month: 3, year: 2028 },
          id: 'file-2',
          name: 'Tableau des effectifs.xlsx',
          sizeInBytes: 86_000,
        },
      ],
    },
  }),
}));

vi.mock('@queries/files.queries', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useDownloadFileMutation: () => ({ isPending: false, mutate: vi.fn() }),
}));

function renderTab(children: ReactNode) {
  render(
    <NuqsTestingAdapter>
      <IntlProvider defaultLocale="fr" locale="fr">
        <ToastProvider>{children}</ToastProvider>
      </IntlProvider>
    </NuqsTestingAdapter>,
  );
}

describe('SessionAttachmentsTab', () => {
  beforeEach(() => createUrl.mockReset());

  it('should list the attachments of the session', () => {
    renderTab(<SessionAttachmentsTab filtersSlot={null} sessionId="session-1" />);

    expect(screen.getByRole('button', { name: 'Fiche de juridiction.pdf' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Tableau des effectifs.xlsx' })).toBeVisible();
  });

  it('should sum the total and the size of every attachment', () => {
    renderTab(<SessionAttachmentsTab filtersSlot={null} sessionId="session-1" />);

    expect(screen.getByText('Total').parentElement).toHaveTextContent('2');
    expect(screen.getByText('326 Ko')).toBeVisible();
  });

  it('should narrow the list to the searched name, accents aside', async () => {
    renderTab(<SessionAttachmentsTab filtersSlot={null} sessionId="session-1" />);

    await userEvent.type(screen.getByPlaceholderText('Rechercher une pièce jointe'), 'juridiction');

    expect(screen.getByRole('button', { name: 'Fiche de juridiction.pdf' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Tableau des effectifs.xlsx' })).toBeNull();
  });

  it('should ask for a signed url before opening an attachment', async () => {
    renderTab(<SessionAttachmentsTab filtersSlot={null} sessionId="session-1" />);

    await userEvent.click(screen.getByRole('button', { name: 'Fiche de juridiction.pdf' }));

    expect(createUrl).toHaveBeenCalledWith({ fileId: 'file-1', sessionId: 'session-1' }, expect.anything());
  });

  it('should offer nothing but the download without the manager actions', () => {
    renderTab(<SessionAttachmentsTab filtersSlot={null} sessionId="session-1" />);

    expect(screen.getByRole('button', { name: 'Télécharger Fiche de juridiction.pdf' })).toBeVisible();
    expect(screen.queryByRole('button', { name: /Supprimer/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Ajouter une pièce jointe' })).toBeNull();
    expect(screen.getByRole('columnheader', { name: 'Action' })).toBeVisible();
  });

  it('should hand the manager actions over to its host', () => {
    renderTab(
      <SessionAttachmentsTab
        extraActions={(attachment) => <button type="button">{`Supprimer ${attachment.name}`}</button>}
        filtersSlot={null}
        headerEnd={<button type="button">Ajouter une pièce jointe</button>}
        sessionId="session-1"
      />,
    );

    expect(screen.getByRole('button', { name: 'Supprimer Fiche de juridiction.pdf' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Ajouter une pièce jointe' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeVisible();
  });
});
