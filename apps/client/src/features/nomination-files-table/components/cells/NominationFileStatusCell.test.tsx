import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';

import { frFormat } from '@/i18n/formats';
import type { NominationSessionFileStatus } from '@/types/enums.types';

import { NominationFileStatusCell } from './NominationFileStatusCell';

function renderCell(status: NominationSessionFileStatus) {
  return render(
    <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr">
      <NominationFileStatusCell status={status} />
    </IntlProvider>,
  );
}

describe('NominationFileStatusCell', () => {
  it('waits when the file belongs to no document', () => {
    renderCell({ value: 'TO_REPORT', date: null });

    expect(screen.getByText('En attente')).toBeInTheDocument();
  });

  it('shows the agenda acronym, spells it out for assistive tech, and dates it', () => {
    renderCell({ value: 'DSJ_PLANNED', date: { year: 2026, month: 6, day: 1 } });

    expect(screen.getByText('ODJ')).toHaveAttribute('aria-hidden');
    expect(screen.getByText('Ordre du jour')).toHaveClass('fr-sr-only');
    expect(screen.getByText('01/06/2026')).toBeInTheDocument();
  });

  it('shows the official report acronym, spells it out for assistive tech, and dates it', () => {
    renderCell({ value: 'DSJ_REPORTED', date: { year: 2026, month: 6, day: 8 } });

    expect(screen.getByText('PV')).toHaveAttribute('aria-hidden');
    expect(screen.getByText('PV de restitution')).toHaveClass('fr-sr-only');
    expect(screen.getByText('08/06/2026')).toBeInTheDocument();
  });
});
