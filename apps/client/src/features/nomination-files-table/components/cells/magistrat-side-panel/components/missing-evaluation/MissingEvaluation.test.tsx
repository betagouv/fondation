import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';
import * as $api from '@api/sdk';

import { MissingEvaluation } from './MissingEvaluation';

const SESSION_ID = 'session-1';
const LABEL = 'Évaluation manquante dans le dossier administratif LOLFI';

function renderMissingEvaluation(
  options: { editable?: boolean; isUpdatable?: boolean; missingEvaluation?: boolean } = {},
) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });

  const nominationFile = makeSessionNominationFile({
    content: { isUpdatable: options.isUpdatable ?? true },
    missingEvaluation: options.missingEvaluation ?? false,
  });

  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <QueryClientProvider client={client}>
        <MissingEvaluation
          editable={options.editable ?? true}
          nominationFile={nominationFile}
          sessionId={SESSION_ID}
        />
      </QueryClientProvider>
    </IntlProvider>,
  );
}

describe('MissingEvaluation visibility', () => {
  it('shows an editable toggle on an updatable nomination file', () => {
    renderMissingEvaluation();

    expect(screen.getByRole('checkbox', { name: LABEL })).toBeEnabled();
    expect(screen.getByText('Non')).toBeVisible();
  });

  it('disables the toggle when the nomination file cannot be updated', () => {
    renderMissingEvaluation({ isUpdatable: false, missingEvaluation: true });

    expect(screen.getByRole('checkbox', { name: LABEL })).toBeDisabled();
    expect(screen.getByText('Oui')).toBeVisible();
  });

  it('renders the banner without a toggle outside the secretariat general', () => {
    renderMissingEvaluation({ editable: false, missingEvaluation: true });

    expect(screen.getByText(LABEL)).toBeVisible();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('renders nothing when the nomination file cannot be updated and is not flagged', () => {
    renderMissingEvaluation({ isUpdatable: false, missingEvaluation: false });

    expect(screen.queryByText(LABEL)).not.toBeInTheDocument();
  });
});

describe('MissingEvaluation edition', () => {
  afterEach(() => vi.restoreAllMocks());

  it('flags the missing evaluation when toggled on', async () => {
    const update = vi
      .spyOn($api.sessions, 'updateNominationFileMissingEvaluation')
      .mockResolvedValue(
        {} as Awaited<ReturnType<typeof $api.sessions.updateNominationFileMissingEvaluation>>,
      );
    const user = userEvent.setup();
    renderMissingEvaluation();

    await user.click(screen.getByRole('checkbox', { name: LABEL }));

    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { sessionId: SESSION_ID, nominationFileId: 'nomination-file' },
        body: { missingEvaluation: true },
      }),
    );
  });

  it('clears the missing evaluation when toggled off', async () => {
    const update = vi
      .spyOn($api.sessions, 'updateNominationFileMissingEvaluation')
      .mockResolvedValue(
        {} as Awaited<ReturnType<typeof $api.sessions.updateNominationFileMissingEvaluation>>,
      );
    const user = userEvent.setup();
    renderMissingEvaluation({ missingEvaluation: true });

    await user.click(screen.getByRole('checkbox', { name: LABEL }));

    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { sessionId: SESSION_ID, nominationFileId: 'nomination-file' },
        body: { missingEvaluation: false },
      }),
    );
  });
});
