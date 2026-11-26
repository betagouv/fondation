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
        checked={checked}
        courtGroup={{
          courts: COURTS,
          guidelinesAdaptationLabel:
            "Adaptation aux lignes directrices de gestion sur la durée d'affectation du poste actuel pour les tribunaux judiciaires",
          type: { id: 'JUDICIAL_COURT', label: 'Tribunaux judiciaires' },
          typeInSentence: 'tribunaux judiciaires',
        }}
        isEmpty={checked.length === 0}
        onChange={() => {}}
      />
    </IntlProvider>,
  );
}

describe('TargetCourtsPicker', () => {
  it.each([
    [10, 10, undefined],
    [11, 11, 'et 1 autre juridiction'],
    [12, 11, 'et 2 autres juridictions'],
  ])('sums up %i courts chosen in %i tags', async (chosen, tags, count) => {
    const { container } = renderPicker(COURTS.slice(0, chosen).map(({ id }) => id));

    expect(screen.getAllByRole('listitem')).toHaveLength(tags);
    if (count) expect(screen.getByText(count)).toBeInTheDocument();
    else expect(screen.queryByText(/^et \d+ autres? juridictions?$/)).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('opens on its list while no court is chosen', () => {
    renderPicker([]);

    expect(
      screen.getByRole('button', { name: 'Masquer la liste des tribunaux judiciaires' }),
    ).toHaveAttribute('aria-expanded', 'true');
  });
});
