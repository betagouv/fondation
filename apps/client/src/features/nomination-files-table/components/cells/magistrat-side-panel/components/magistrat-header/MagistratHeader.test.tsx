import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { NominationFilesTableProvider } from '@/features/nomination-files-table/context/NominationFilesTableProvider';
import { frFormat } from '@/i18n/formats';
import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';
import { makeSessionOutcomes } from '@/test-utils/factories/session-outcomes.factory';
import { FormationEnum, PrioriteEnum } from '@/types/enums.types';
import { getGdsReportPath, ROUTE_PATHS } from '@/utils/route-path.utils';
import * as $api from '@api/sdk';
import { authKeys } from '@queries/auth.queries';
import { memberKeys } from '@queries/members.queries';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';
import { reportKeys } from '@queries/reports.queries';

import { MagistratHeader } from './MagistratHeader';

const SESSION_ID = 'session-1';
const CURRENT_USER_ID = 'current-user';

const CURRENT_USER = { id: CURRENT_USER_ID, firstName: 'Jean', lastName: 'Petit' };
const OTHER_REPORTER = { id: 'reporter-1', firstName: 'Marie', lastName: 'Lefevre' };

function renderHeader(options: {
  isEditable?: boolean;
  isSg?: boolean;
  myReportId?: string;
  nominationFile: SessionNominationFile;
}) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  const memberListOptions = {
    formations: ['COMMUN', FormationEnum.SIEGE],
    pagination: { pageIndex: 0, pageSize: 100 },
  };
  client.setQueryData(authKeys.introspectSession(), CURRENT_USER);
  client.setQueryData(memberKeys.listMembers(memberListOptions), {
    items: [CURRENT_USER, OTHER_REPORTER],
  });
  client.setQueryData(
    reportKeys.myReport({ nominationFileId: options.nominationFile.id }),
    options.myReportId ?? null,
  );

  return render(
    <MemoryRouter
      initialEntries={[
        options.isSg === false ? ROUTE_PATHS.TRANSPARENCES.DASHBOARD : ROUTE_PATHS.SG.DASHBOARD,
      ]}
    >
      <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr">
        <QueryClientProvider client={client}>
          <NominationFilesTableProvider
            formation={FormationEnum.SIEGE}
            isEditable={options.isEditable ?? true}
            outcomes={makeSessionOutcomes(FormationEnum.SIEGE)}
            sessionId={SESSION_ID}
          >
            <MagistratHeader nominationFile={options.nominationFile} sessionId={SESSION_ID} />
          </NominationFilesTableProvider>
        </QueryClientProvider>
      </IntlProvider>
    </MemoryRouter>,
  );
}

describe('MagistratHeader reporter status', () => {
  it('announces when no reporter is assigned', () => {
    renderHeader({ nominationFile: makeSessionNominationFile({ reporters: [] }) });

    expect(screen.getByText('Affectation non effectuée')).toBeInTheDocument();
  });

  it('lists reporters when the current user is not one of them', () => {
    renderHeader({ nominationFile: makeSessionNominationFile({ reporters: [OTHER_REPORTER] }) });

    expect(screen.getByText('Marie LEFEVRE')).toBeInTheDocument();
    expect(screen.queryByText('Vous êtes rapporteur')).not.toBeInTheDocument();
  });

  it('highlights the current user as a reporter, with co-reporters', () => {
    renderHeader({
      nominationFile: makeSessionNominationFile({ reporters: [CURRENT_USER, OTHER_REPORTER] }),
    });

    expect(screen.getByText('Vous êtes rapporteur')).toBeInTheDocument();
    expect(screen.getByText('avec')).toBeInTheDocument();
    expect(screen.getByText('Marie LEFEVRE')).toBeInTheDocument();
    expect(screen.queryByText('Jean PETIT')).not.toBeInTheDocument();
  });

  it('marks the current user as the sole reporter, without co-reporters', () => {
    renderHeader({ nominationFile: makeSessionNominationFile({ reporters: [CURRENT_USER] }) });

    expect(screen.getByText('Vous êtes rapporteur')).toBeInTheDocument();
    expect(screen.queryByText('avec')).not.toBeInTheDocument();
    expect(screen.queryByText('Jean PETIT')).not.toBeInTheDocument();
  });

  it('links to the report of the current user when they have one', () => {
    renderHeader({
      isSg: false,
      myReportId: 'report-1',
      nominationFile: makeSessionNominationFile({ reporters: [CURRENT_USER] }),
    });

    expect(screen.getByRole('link', { name: 'Voir mon dossier' })).toHaveAttribute(
      'href',
      getGdsReportPath('report-1'),
    );
  });

  it('hides the report link when the current user has no report', () => {
    renderHeader({ nominationFile: makeSessionNominationFile({ reporters: [OTHER_REPORTER] }) });

    expect(screen.queryByRole('link', { name: 'Voir mon dossier' })).not.toBeInTheDocument();
  });
});

describe('MagistratHeader edition', () => {
  afterEach(() => vi.restoreAllMocks());

  it('offers the edit button when the table is editable and the file is updatable', () => {
    renderHeader({
      isEditable: true,
      nominationFile: makeSessionNominationFile({ content: { isUpdatable: true } }),
    });

    expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument();
  });

  it('hides the edit button for a member (table not editable)', () => {
    renderHeader({
      isEditable: false,
      nominationFile: makeSessionNominationFile({ content: { isUpdatable: true } }),
    });

    expect(screen.queryByRole('button', { name: 'Modifier' })).not.toBeInTheDocument();
  });

  it('hides the edit button when the file is not updatable', () => {
    renderHeader({
      isEditable: true,
      nominationFile: makeSessionNominationFile({ content: { isUpdatable: false } }),
    });

    expect(screen.queryByRole('button', { name: 'Modifier' })).not.toBeInTheDocument();
  });

  it('swaps read controls for edit controls, and cancel restores read mode', async () => {
    const user = userEvent.setup();
    renderHeader({
      isEditable: true,
      nominationFile: makeSessionNominationFile({ content: { isUpdatable: true }, reporters: [] }),
    });

    expect(screen.getByText('Affectation non effectuée')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Modifier' }));

    expect(screen.getByRole('button', { name: 'Valider' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Affecter un rapporteur/ })).toBeInTheDocument();
    expect(screen.queryByText('Affectation non effectuée')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Modifier' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Valider' })).not.toBeInTheDocument();
  });

  it('saves the current affectation when validating, then leaves edit mode', async () => {
    const affectReporters = vi
      .spyOn($api.sessions, 'affectReporters')
      .mockResolvedValue({} as Awaited<ReturnType<typeof $api.sessions.affectReporters>>);
    const user = userEvent.setup();
    renderHeader({
      isEditable: true,
      nominationFile: makeSessionNominationFile({
        content: { isUpdatable: true },
        priorities: [PrioriteEnum.ETOILE],
        reporters: [OTHER_REPORTER],
      }),
    });

    await user.click(screen.getByRole('button', { name: 'Modifier' }));
    await user.click(screen.getByRole('button', { name: 'Valider' }));

    expect(affectReporters).toHaveBeenCalledTimes(1);
    expect(affectReporters).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { sessionId: SESSION_ID },
        body: {
          items: [
            {
              nominationFileId: 'nomination-file',
              reporterIds: [OTHER_REPORTER.id],
              priorities: [PrioriteEnum.ETOILE],
            },
          ],
        },
      }),
    );

    expect(await screen.findByRole('button', { name: 'Modifier' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Valider' })).not.toBeInTheDocument();
  });
});

describe('MagistratHeader accessibility', () => {
  it('passes basic accessibility checks', async () => {
    const { container } = renderHeader({
      myReportId: 'report-1',
      nominationFile: makeSessionNominationFile({ reporters: [CURRENT_USER, OTHER_REPORTER] }),
    });

    expect(await axe(container)).toHaveNoViolations();
  });
});
