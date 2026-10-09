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

const mocks = vi.hoisted(() => ({ waitForConfirmation: vi.fn(async () => ({ isConfirmed: true })) }));

vi.mock('@/shared/context/confirm-modal', () => ({
  useConfirmModal: () => ({ waitForConfirmation: mocks.waitForConfirmation }),
}));

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

    await userEvent.click(screen.getByRole('checkbox', { name: 'Prévoir une audition' }));

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith({
        body: { requested: true },
        path: { nominationFileId: 'nomination-file', sessionId: 'session-1' },
      }),
    );
  });

  it('asks before dismissing a scheduled audition, whose date goes with it', async () => {
    const save = vi
      .spyOn($api.sessions, 'updateNominationFileAuditionRequest')
      .mockResolvedValue({} as RequestResponse);
    renderCheckbox({
      auditionDate: { day: 12, month: 12, year: 2028 },
      auditionRequired: true,
      auditionTime: { hours: 9, minutes: 30, seconds: 0 },
      id: 'nomination-file',
    });

    await userEvent.click(screen.getByRole('checkbox', { name: 'Prévoir une audition' }));

    expect(mocks.waitForConfirmation).toHaveBeenCalled();
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith({
        body: { requested: false },
        path: { nominationFileId: 'nomination-file', sessionId: 'session-1' },
      }),
    );
  });

  it('asks to summon the magistrat for an audition the position does not ask for', () => {
    renderCheckbox({ auditionRequired: true });

    expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent(
      'Magistrat à convoquer en audition',
    );
  });
});
