import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PropsWithChildren } from 'react';
import { IntlProvider } from 'react-intl';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { httpAssert } from '@/utils/http-exception';

import { ErrorPage } from './ErrorPage';

vi.mock('@/features/auth/hooks/roles.hook', () => ({ useIsSg: () => false }));
vi.mock('@/layout/PageLayout', () => ({ PageLayout: ({ children }: PropsWithChildren) => children }));
vi.mock('@queries/auth.queries', () => ({ useUser: () => ({ user: { role: 'MEMBRE_DU_SIEGE' } }) }));

const loadSession = vi.fn<() => Promise<string>>();

function SessionPage() {
  const { data, error, isPending } = useQuery({ queryFn: loadSession, queryKey: ['session'] });
  if (isPending) return null;
  if (error) throw error;
  return <h1>{data}</h1>;
}

function renderSessionPage() {
  const router = createMemoryRouter([{ element: <SessionPage />, errorElement: <ErrorPage />, path: '/' }]);

  render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </IntlProvider>,
  );
}

function failureWith(status: number): unknown {
  try {
    httpAssert(new Response(null, { status }));
  } catch (exception) {
    return exception;
  }
}

describe('ErrorPage', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('lets the member load again a page whose loading timed out', async () => {
    loadSession
      .mockRejectedValueOnce(new DOMException('signal timed out', 'TimeoutError'))
      .mockResolvedValue('Transparence du 4 novembre');
    renderSessionPage();

    expect(
      await screen.findByRole('heading', { name: 'Le chargement a pris trop de temps' }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }));

    expect(await screen.findByRole('heading', { name: 'Transparence du 4 novembre' })).toBeInTheDocument();
  });

  it.each([
    ['the proxy finds no server', failureWith(502), 'Le service est momentanément indisponible'],
    ['the server is unavailable', failureWith(503), 'Le service est momentanément indisponible'],
    [
      'the connection drops',
      new DOMException('Failed to fetch', 'NetworkError'),
      'La connexion a été interrompue',
    ],
  ])('lets the member load again a page when %s', async (_, failure, title) => {
    loadSession.mockRejectedValueOnce(failure).mockResolvedValue('Transparence du 4 novembre');
    renderSessionPage();

    expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }));

    expect(await screen.findByRole('heading', { name: 'Transparence du 4 novembre' })).toBeInTheDocument();
  });

  it('offers no retry on a server bug, which a new attempt would not fix', async () => {
    loadSession.mockRejectedValueOnce(failureWith(500));
    renderSessionPage();

    expect(await screen.findByRole('heading', { name: 'Erreur inattendue' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Réessayer' })).not.toBeInTheDocument();
  });
});
