import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  makeSessionNominationFile,
  type NominationFileOverrides,
} from '@/test-utils/factories/session-nomination-file.factory';
import * as $api from '@api/sdk';

import { AuditionRequestToggle } from './AuditionRequestToggle';

type RequestResponse = Awaited<ReturnType<typeof $api.sessions.updateNominationFileAuditionRequest>>;

function renderCheckbox(overrides: NominationFileOverrides) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });

  render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <QueryClientProvider client={client}>
        <AuditionRequestToggle nominationFile={makeSessionNominationFile(overrides)} sessionId="session-1" />
      </QueryClientProvider>
    </IntlProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AuditionRequestToggle', () => {
  it('requests an audition the position does not expect', async () => {
    const save = vi
      .spyOn($api.sessions, 'updateNominationFileAuditionRequest')
      .mockResolvedValue({} as RequestResponse);
    renderCheckbox({ auditionDate: null, auditionRequired: false, id: 'nomination-file' });

    await userEvent.click(screen.getByRole('checkbox', { name: 'Audition à prévoir' }));

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith({
        body: { requested: true },
        path: { nominationFileId: 'nomination-file', sessionId: 'session-1' },
      }),
    );
  });

  it('keeps a scheduled audition requested until its date is removed', () => {
    renderCheckbox({ auditionDate: { day: 12, month: 12, year: 2028 }, auditionRequired: true });

    expect(screen.getByRole('checkbox', { name: 'Audition à prévoir' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Audition à prévoir' })).toBeDisabled();
  });
});
