import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as $api from '@api/sdk';

import { useTitleTakenBackWarning } from './useTitleTakenBackWarning';

function wrapper(props: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <IntlProvider defaultLocale="fr" locale="fr">
        {props.children}
      </IntlProvider>
    </QueryClientProvider>
  );
}

describe('useTitleTakenBackWarning', () => {
  beforeEach(() => {
    vi.spyOn($api.administration, 'listTitleHolders').mockResolvedValue({
      data: {
        items: [
          {
            holder: { gender: 'FEMALE', id: 'holder', name: 'Isabelle GAUTHIER', nextRole: 'MEMBRE_SIEGE' },
            title: 'PRESIDENT_SIEGE',
          },
        ],
      },
    } as unknown as Awaited<ReturnType<typeof $api.administration.listTitleHolders>>);
  });

  it('names the holder of the title and the role they keep', async () => {
    const { result } = renderHook(() => useTitleTakenBackWarning('PRESIDENT_SIEGE', { enabled: true }), {
      wrapper,
    });

    await waitFor(() =>
      expect(result.current).toBe(
        'Isabelle GAUTHIER perdra la fonction de Présidente du Siège et deviendra Membre du Siège.',
      ),
    );
  });

  it('stays silent when the role is given back to its holder', async () => {
    const { result } = renderHook(
      () => useTitleTakenBackWarning('PRESIDENT_SIEGE', { enabled: true, userId: 'holder' }),
      { wrapper },
    );

    await waitFor(() => expect($api.administration.listTitleHolders).toHaveBeenCalled());
    expect(result.current).toBeUndefined();
  });
});
