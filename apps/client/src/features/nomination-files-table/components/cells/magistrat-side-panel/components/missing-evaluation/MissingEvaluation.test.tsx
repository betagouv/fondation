import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';
import * as $api from '@api/sdk';

import { MissingEvaluation, MissingEvaluationNotice } from './MissingEvaluation';

const SESSION_ID = 'session-1';
const LABEL = 'Évaluation manquante';

function renderMissingEvaluation(options: { isUpdatable?: boolean; missingEvaluation?: boolean } = {}) {
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
        <MissingEvaluation nominationFile={nominationFile} sessionId={SESSION_ID} />
      </QueryClientProvider>
    </IntlProvider>,
  );
}

describe('MissingEvaluation visibility', () => {
  it('shows an editable checkbox on an updatable nomination file', () => {
    renderMissingEvaluation();

    expect(screen.getByRole('checkbox', { name: LABEL })).toBeEnabled();
  });

  it('disables the checkbox when the nomination file cannot be updated', () => {
    renderMissingEvaluation({ isUpdatable: false, missingEvaluation: true });

    expect(screen.getByRole('checkbox', { name: LABEL })).toBeDisabled();
  });

  it('renders nothing when the nomination file cannot be updated and is not flagged', () => {
    renderMissingEvaluation({ isUpdatable: false, missingEvaluation: false });

    expect(screen.queryByRole('checkbox', { name: LABEL })).not.toBeInTheDocument();
  });
});

describe('MissingEvaluationNotice', () => {
  // jsdom implements no layout, so scrollIntoView is absent from Element.prototype
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('moves the focus to the checkbox when clicking Modifier', async () => {
    const user = userEvent.setup();

    render(
      <IntlProvider defaultLocale="fr" locale="fr">
        <QueryClientProvider client={new QueryClient()}>
          <MissingEvaluationNotice editable missingEvaluation />
          <MissingEvaluation
            nominationFile={makeSessionNominationFile({ missingEvaluation: true })}
            sessionId={SESSION_ID}
          />
        </QueryClientProvider>
      </IntlProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Modifier' }));

    expect(screen.getByRole('checkbox', { name: LABEL })).toHaveFocus();
  });
});

describe('MissingEvaluation edition', () => {
  afterEach(() => vi.restoreAllMocks());

  it('flags the missing evaluation when checked', async () => {
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

  it('clears the missing evaluation when unchecked', async () => {
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
