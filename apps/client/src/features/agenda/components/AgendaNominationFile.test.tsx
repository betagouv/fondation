import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import { FormationEnum } from '@/types/enums.types';
import type { FoundAgendaNominationFiles } from '@api/types';

import { AgendaNominationFile } from './AgendaNominationFile';

function makeDocsNominationFile(
  overrides?: Partial<FoundAgendaNominationFiles['items'][number]>,
): FoundAgendaNominationFiles['items'][number] {
  return {
    id: 'file-1',
    number: 1,
    reporters: [],
    outcome: null,
    magistrat: {
      id: 'magistrat-1',
      externalId: 1,
      name: 'Jean Moulin',
      position: { grade: 'I', label: 'Premier grade', functionId: null, jurisdictionId: null },
    },
    targetPosition: { grade: 'HH', label: 'Hors hiérarchie', functionId: null, jurisdictionId: null },
    ...overrides,
  };
}

function renderFile(file: FoundAgendaNominationFiles['items'][number]) {
  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <AgendaNominationFile
        checked={false}
        file={file}
        formation={FormationEnum.SIEGE}
        onChange={vi.fn()}
        search=""
      />
    </IntlProvider>,
  );
}

describe('AgendaNominationFile', () => {
  it('renders the outcome badge with its label as tooltip', () => {
    renderFile(
      makeDocsNominationFile({
        outcome: { value: 'SUSPENDED', label: 'sursis à statuer', comment: null },
      }),
    );

    expect(screen.getByTitle('sursis à statuer')).toHaveTextContent('SAS');
  });

  it('describes each position with its own grade', () => {
    renderFile(makeDocsNominationFile());

    expect(screen.getByTitle('I - Premier grade')).toBeInTheDocument();
    expect(screen.getByTitle('HH - Hors hiérarchie')).toBeInTheDocument();
  });

  it('renders no outcome badge when the file has no outcome', () => {
    renderFile(makeDocsNominationFile());

    expect(screen.queryByTitle('sursis à statuer')).not.toBeInTheDocument();
    expect(screen.getByText('Jean Moulin')).toBeInTheDocument();
  });
});
