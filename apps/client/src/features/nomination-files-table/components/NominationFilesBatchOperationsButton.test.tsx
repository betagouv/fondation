import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';

import { FilesAffectationsProvider } from '../context/FilesAffectationsProvider';
import { FilesSelectionProvider } from '../context/FilesSelectionProvider';
import { NominationFilesTableProvider } from '../context/NominationFilesTableProvider';
import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';
import { makeSessionOutcomes } from '@/test-utils/factories/session-outcomes.factory';
import { FormationEnum } from '@/types/enums.types';
import { memberKeys, type ListMembersOptions } from '@queries/members.queries';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { NominationFilesBatchOperationsButton } from './NominationFilesBatchOperationsButton';

const SESSION_ID = 'session-1';
const LYON = { id: 'CA  LYON', label: "Cour d'appel de Lyon" };

const EXCLUDED_MEMBER = {
  excludedJurisdictions: [LYON],
  firstName: 'Marie',
  id: 'reporter-1',
  lastName: 'Lefevre',
};
const ALSO_EXCLUDED_MEMBER = {
  excludedJurisdictions: [LYON],
  firstName: 'Sophie',
  id: 'reporter-2',
  lastName: 'Bernard',
};
const AVAILABLE_MEMBER = {
  excludedJurisdictions: [],
  firstName: 'Paul',
  id: 'reporter-3',
  lastName: 'Moreau',
};

const IN_LYON = makeSessionNominationFile({
  content: { jurisdictions: { current: LYON, targeted: null }, numeroDeDossier: 12 },
  id: 'file-in-lyon',
});
const ELSEWHERE = makeSessionNominationFile({
  content: {
    jurisdictions: { current: { id: 'CA  PARIS', label: null }, targeted: null },
    numeroDeDossier: 34,
  },
  id: 'file-elsewhere',
});

function renderBatchOperations(files: SessionNominationFile[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const memberListOptions: ListMembersOptions = {
    formations: ['COMMUN', FormationEnum.SIEGE],
    pagination: { pageIndex: 0, pageSize: 100 },
  };
  client.setQueryData(memberKeys.listMembers(memberListOptions), {
    items: [EXCLUDED_MEMBER, ALSO_EXCLUDED_MEMBER, AVAILABLE_MEMBER],
  });

  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <QueryClientProvider client={client}>
        <NominationFilesTableProvider
          formation={FormationEnum.SIEGE}
          isEditable
          outcomes={makeSessionOutcomes(FormationEnum.SIEGE)}
          sessionId={SESSION_ID}
        >
          <FilesSelectionProvider
            files={files}
            selection={Object.fromEntries(files.map(({ id }) => [id, true]))}
          >
            <FilesAffectationsProvider files={files}>
              <NominationFilesBatchOperationsButton />
            </FilesAffectationsProvider>
          </FilesSelectionProvider>
        </NominationFilesTableProvider>
      </QueryClientProvider>
    </IntlProvider>,
  );
}

function selectReporter(lastName: string) {
  fireEvent.click(screen.getByLabelText(new RegExp(lastName, 'i')));
}

describe('NominationFilesBatchOperationsButton', () => {
  it('warns for the selected files that fall within an excluded jurisdiction', () => {
    renderBatchOperations([IN_LYON, ELSEWHERE]);

    selectReporter('lefevre');

    expect(
      screen.getByText(
        "Attention le dossier n° 12 est dans le périmètre d'une juridiction exclue (Cour d'appel de Lyon) pour Marie LEFEVRE",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/dossier n° 34/)).not.toBeInTheDocument();
  });

  it('stays silent for a reporter without any excluded jurisdiction', () => {
    renderBatchOperations([IN_LYON, ELSEWHERE]);

    selectReporter('moreau');

    expect(screen.queryByText(/Attention le dossier/)).not.toBeInTheDocument();
  });

  it('marks the excluded reporter in the list before any selection', () => {
    renderBatchOperations([IN_LYON]);

    expect(
      screen.getByText("Juridiction exclue pour Marie LEFEVRE : Cour d'appel de Lyon"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Attention le dossier/)).not.toBeInTheDocument();
  });

  it('gathers on a single line the reporters sharing the same excluded jurisdiction', () => {
    renderBatchOperations([IN_LYON]);

    selectReporter('lefevre');
    selectReporter('bernard');

    expect(
      screen.getByText(
        "Attention le dossier n° 12 est dans le périmètre d'une juridiction exclue (Cour d'appel de Lyon) pour Marie LEFEVRE et Sophie BERNARD",
      ),
    ).toBeInTheDocument();
  });

  it('drops the warning when the reporter is unselected', () => {
    renderBatchOperations([IN_LYON]);

    selectReporter('lefevre');
    expect(screen.getByText(/dossier n° 12/)).toBeInTheDocument();

    selectReporter('lefevre');
    expect(screen.queryByText(/dossier n° 12/)).not.toBeInTheDocument();
  });
});
