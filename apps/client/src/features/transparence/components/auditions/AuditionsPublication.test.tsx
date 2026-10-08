import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { frFormat } from '@/i18n/formats';
import * as $api from '@api/sdk';
import type { DetailedAuditionsPublicationDto } from '@api/types';

import { AuditionsPublicationBadge } from './AuditionsPublicationBadge';
import { AuditionsPublishButton } from './AuditionsPublishButton';

vi.mock('@queries/auth.queries', () => ({ useUser: () => ({ user: { id: 'user-1' } }) }));
vi.mock('@/shared/ui/toast', () => ({ useToasts: () => ({ error: vi.fn(), success: vi.fn() }) }));

type DetailResponse = Awaited<ReturnType<typeof $api.sessions.detailLastSessionAuditionsPublication>>;
type PublishResponse = Awaited<ReturnType<typeof $api.sessions.publishSessionAuditions>>;

function renderStatus(publication: DetailedAuditionsPublicationDto) {
  vi.spyOn($api.sessions, 'detailLastSessionAuditionsPublication').mockResolvedValue({
    data: publication,
  } as DetailResponse);
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });

  render(
    <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr">
      <QueryClientProvider client={client}>
        <AuditionsPublicationBadge sessionId="session-1" />
        <AuditionsPublishButton sessionId="session-1" />
      </QueryClientProvider>
    </IntlProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Auditions publication', () => {
  it('publishes the auditions to the members a first time', async () => {
    const publish = vi
      .spyOn($api.sessions, 'publishSessionAuditions')
      .mockResolvedValue({} as PublishResponse);
    renderStatus({ lastPublished: null, status: 'NEVER_PUBLISHED' });

    await userEvent.click(await screen.findByRole('button', { name: 'Publier aux membres' }));

    expect(screen.getByText('Non publié aux membres')).toBeInTheDocument();
    await waitFor(() =>
      expect(publish).toHaveBeenCalledWith({ path: { sessionId: 'session-1' }, throwOnError: true }),
    );
  });

  it('asks to publish again the changes made since the last publication', async () => {
    renderStatus({
      lastPublished: { at: '2026-10-08T09:30:00.000Z', by: { id: 'user-1', name: 'Rachel Bernard' } },
      status: 'UNPUBLISHED_CHANGES',
    });

    expect(await screen.findByText('Modifications non publiées')).toBeInTheDocument();
    expect(
      screen.getByText(
        'La dernière publication des auditions date du 08/10/2026 à 09h30 par vous. Des modifications ont été faites depuis et ne sont pas encore publiées.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publier aux membres' })).toBeInTheDocument();
  });

  it('offers nothing to publish once the members see the current auditions', async () => {
    renderStatus({
      lastPublished: { at: '2026-10-08T09:30:00.000Z', by: { id: 'user-1', name: 'Rachel Bernard' } },
      status: 'PUBLISHED',
    });

    expect(await screen.findByText('Publié aux membres')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Publier aux membres' })).not.toBeInTheDocument();
  });
});
