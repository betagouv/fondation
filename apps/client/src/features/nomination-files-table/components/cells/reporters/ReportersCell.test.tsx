import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';

import { ExcludedJurisdictionsContext } from '@/features/nomination-files-table/context/excluded-jurisdictions.context';
import { MemberExcludedJurisdictions } from '@/features/nomination-files-table/context/member-excluded-jurisdictions';
import { frFormat } from '@/i18n/formats';
import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';
import { authKeys } from '@queries/auth.queries';

import { ReportersCell } from './ReportersCell';

const LYON = { id: 'CA  LYON', label: "Cour d'appel de Lyon" };

const CAMILLE = { firstName: 'Camille', id: 'camille', lastName: 'Commun' };
const PAUL = { firstName: 'Paul', id: 'paul', lastName: 'Parquet' };

function renderCell(excludedJurisdictionsOfCamille: (typeof LYON)[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(authKeys.introspectSession(), { ...PAUL, role: 'MEMBRE_DU_SIEGE' });

  const dossier = makeSessionNominationFile({
    content: { jurisdictions: { current: LYON, targeted: null } },
    reporters: [CAMILLE, PAUL],
  });

  const model = MemberExcludedJurisdictions.fromMembers([
    { ...CAMILLE, excludedJurisdictions: excludedJurisdictionsOfCamille },
    { ...PAUL, excludedJurisdictions: [] },
  ]);

  return render(
    <QueryClientProvider client={client}>
      <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr">
        <ExcludedJurisdictionsContext value={model}>
          <ReportersCell dossier={dossier} />
        </ExcludedJurisdictionsContext>
      </IntlProvider>
    </QueryClientProvider>,
  );
}

describe('ReportersCell', () => {
  it('names every reporter in the single tooltip of the list', () => {
    renderCell([]);

    expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent('Camille COMMUN et Paul PARQUET');
  });

  it('adds the excluded jurisdiction of a reporter to that same tooltip', () => {
    renderCell([LYON]);

    expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent(
      `Juridiction exclue pour Camille COMMUN : ${LYON.label}`,
    );
  });

  it('flags the excluded reporter only, and leaves the icon silent for screen readers', () => {
    const { container } = renderCell([LYON]);

    const [camille, paul] = screen.getAllByRole('listitem');
    expect(within(camille).getByText('CC')).toBeInTheDocument();
    expect(container.querySelectorAll('.fr-icon-warning-fill')).toHaveLength(1);
    expect(within(paul).queryByRole('img')).not.toBeInTheDocument();
  });
});
