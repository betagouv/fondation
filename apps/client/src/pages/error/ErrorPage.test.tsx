import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PropsWithChildren } from 'react';
import { IntlProvider } from 'react-intl';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

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

describe('ErrorPage', () => {
  it('lets the member load again a page whose loading timed out', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    loadSession
      .mockRejectedValueOnce(new DOMException('signal timed out', 'TimeoutError'))
      .mockResolvedValue('Transparence du 4 novembre');
    const router = createMemoryRouter([{ element: <SessionPage />, errorElement: <ErrorPage />, path: '/' }]);

    render(
      <IntlProvider defaultLocale="fr" locale="fr">
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </IntlProvider>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Le chargement a pris trop de temps' }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }));

    expect(await screen.findByRole('heading', { name: 'Transparence du 4 novembre' })).toBeInTheDocument();
  });
});
