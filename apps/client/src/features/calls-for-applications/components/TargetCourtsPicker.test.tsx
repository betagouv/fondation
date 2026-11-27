import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { TargetCourtsPicker } from './TargetCourtsPicker';

const COURTS = Array.from({ length: 12 }, (_, index) => ({
  id: `TJ  ${index}`,
  label: `Tribunal judiciaire ${index}`,
  type: 'JUDICIAL_COURT' as const,
}));

function renderPicker(checked: string[]) {
  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <TargetCourtsPicker
        guidelinesAdaptations={[]}
        checked={checked}
        courtGroup={{
          courts: COURTS,
          type: { id: 'JUDICIAL_COURT', label: 'Tribunaux judiciaires' },
          typeInSentence: 'tribunaux judiciaires',
        }}
        isEmpty={checked.length === 0}
        onGuidelinesAdaptationsChange={() => {}}
        onChange={() => {}}
      />
    </IntlProvider>,
  );
}

describe('TargetCourtsPicker', () => {
  it('shows every court chosen once folded', async () => {
    const { container } = renderPicker(COURTS.map(({ id }) => id));

    expect(screen.getAllByRole('listitem')).toHaveLength(12);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('opens on its list while no court is chosen', () => {
    renderPicker([]);

    expect(
      screen.getByRole('button', { name: 'Masquer la liste des tribunaux judiciaires' }),
    ).toHaveAttribute('aria-expanded', 'true');
  });
});
