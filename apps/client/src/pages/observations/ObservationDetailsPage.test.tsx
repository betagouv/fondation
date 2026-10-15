import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ObservationDetailsPage } from './ObservationDetailsPage';

const getFileUrl = vi.fn();
const toastError = vi.fn();

vi.mock('@/features/auth/hooks/roles.hook', () => ({ useIsSgNavigation: () => false }));
vi.mock('@/shared/ui/toast', () => ({ useToasts: () => ({ error: toastError }) }));
vi.mock('@/shared/components/banners', () => ({
  ArchiveBannerPortal: (props: { children: ReactNode }) => props.children,
}));
vi.mock('@/features/observations/context/ObservationFollowUpCommentDialogProvider', () => ({
  ObservationFollowUpCommentProvider: (props: { children: ReactNode }) => props.children,
}));
// the page owns the download, the content only offers it
vi.mock('@/features/observations/components/ObservationDetailsContent', () => ({
  ObservationDetailsContent: (props: { onDownloadFile: (file: { id: string; name: string }) => void }) => (
    <button onClick={() => props.onDownloadFile({ id: 'file-1', name: 'courrier.pdf' })} type="button">
      Télécharger courrier.pdf
    </button>
  ),
}));
vi.mock('@queries/files.queries', () => ({ useDownloadFileMutation: () => ({ mutate: vi.fn() }) }));
vi.mock('@queries/observations.queries', () => ({
  useAttachObservationMemberCommentScreenshotsMutation: () => ({ mutateAsync: vi.fn() }),
  useGetObservationFileUrlMutation: () => ({ mutate: getFileUrl }),
  useObservationDetailsQuery: () => ({
    data: { isArchived: false },
    isError: false,
    isLoading: false,
  }),
  useWriteObservationMemberCommentMutation: () => ({ mutate: vi.fn() }),
}));

beforeEach(() => vi.clearAllMocks());

describe('ObservationDetailsPage', () => {
  it('tells the download of an attachment failed', async () => {
    getFileUrl.mockImplementation((_vars, options) => options.onError(new Error('network')));
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/sessions/session-1/dossiers/dossier-1/observations/obs-1']}>
        <IntlProvider defaultLocale="fr" locale="fr">
          <Routes>
            <Route
              element={<ObservationDetailsPage />}
              path="/sessions/:sessionId/dossiers/:nominationFileId/observations/:observationId"
            />
          </Routes>
        </IntlProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Télécharger courrier.pdf' }));

    expect(toastError).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Le téléchargement de "courrier.pdf" a échoué' }),
    );
  });
});
