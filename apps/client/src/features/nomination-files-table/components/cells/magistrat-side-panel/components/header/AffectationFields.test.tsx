import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { type ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import { PrioriteEnum } from '@/types/enums.types';

import { PrioritySelect, ReporterSelect } from './AffectationFields';

function renderWithIntl(ui: ReactNode) {
  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      {ui}
    </IntlProvider>,
  );
}

describe('PrioritySelect', () => {
  it('adds a priority that is not yet selected', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(<PrioritySelect onChange={onChange} value={[]} />);

    await user.click(screen.getByRole('button', { name: 'Définir une priorité' }));
    await user.click(await screen.findByRole('option', { name: 'Étoilé' }));

    expect(onChange).toHaveBeenCalledWith([PrioriteEnum.ETOILE]);
  });

  it('removes a priority that is already selected', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(<PrioritySelect onChange={onChange} value={[PrioriteEnum.ETOILE]} />);

    await user.click(screen.getByRole('button', { name: 'Définir une priorité' }));
    await user.click(await screen.findByRole('option', { name: 'Étoilé' }));

    expect(onChange).toHaveBeenCalledWith([]);
  });
});

describe('ReporterSelect', () => {
  const REPORTERS = [
    { userId: 'b', firstName: 'Marie', lastName: 'Zola' },
    { userId: 'a', firstName: 'Jean', lastName: 'Albert' },
  ];

  it('lists reporters sorted by last name', async () => {
    const user = userEvent.setup();
    renderWithIntl(<ReporterSelect available={REPORTERS} onChange={vi.fn()} value={[]} />);

    await user.click(screen.getByRole('button', { name: 'Affecter un rapporteur' }));

    const options = await screen.findAllByRole('option');
    expect(options).toHaveLength(2);
    expect(options[0]).toBe(screen.getByRole('option', { name: 'Jean ALBERT' }));
  });

  it('toggles a reporter by user id', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(<ReporterSelect available={REPORTERS} onChange={onChange} value={[]} />);

    await user.click(screen.getByRole('button', { name: 'Affecter un rapporteur' }));
    await user.click(await screen.findByRole('option', { name: 'Jean ALBERT' }));

    expect(onChange).toHaveBeenCalledWith(['a']);
  });
});
