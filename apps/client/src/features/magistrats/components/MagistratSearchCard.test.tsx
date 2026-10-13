import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { frFormat } from '@/i18n/formats';
import type { FoundMagistrat } from '@queries/magistrats.queries';

import { MagistratSearchCard } from './MagistratSearchCard';

const magistrat: FoundMagistrat = {
  currentPosition: null,
  firstName: 'ISABELLE',
  grade: 'G1',
  gradeAndJurisdiction: 'G1',
  id: 'magistrat-1',
  lastName: 'GAUTHIER',
  name: 'GAUTHIER Isabelle (ép. ROBERT)',
  status: 'ACTIVE',
  usedName: null,
};

function renderCard(foundMagistrat: FoundMagistrat) {
  return render(
    <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr">
      <MemoryRouter>
        <MagistratSearchCard context="sg" magistrat={foundMagistrat} />
      </MemoryRouter>
    </IntlProvider>,
  );
}

describe('MagistratSearchCard', () => {
  it('shows the used name sent with the magistrat', () => {
    renderCard({ ...magistrat, usedName: 'GAUTHIER-ROBERT' });

    expect(screen.getByRole('article', { name: 'GAUTHIER Isabelle (ép. ROBERT)' })).toHaveTextContent(
      "Nom d'usage : GAUTHIER-ROBERT",
    );
  });

  it('leaves out the used name when none is sent', () => {
    renderCard(magistrat);

    expect(screen.queryByText(/Nom d'usage/)).not.toBeInTheDocument();
  });

  it('marks an inactive magistrat', () => {
    renderCard({ ...magistrat, status: 'INACTIVE' });

    expect(screen.getByRole('article', { name: 'GAUTHIER Isabelle (ép. ROBERT)' })).toHaveTextContent(
      'Inactif',
    );
  });
});
