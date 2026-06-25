import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { type ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import { PrioriteEnum } from '@/types/enums.types';

import { MagistratPrioritySelect, MagistratReporterSelect } from './MagistratAffectationFields';

function renderWithIntl(ui: ReactNode) {
  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      {ui}
    </IntlProvider>,
  );
}

describe('MagistratPrioritySelect', () => {
  it('adds a priority that is not yet selected', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(<MagistratPrioritySelect value={[]} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Priorité' }));
    await user.click(await screen.findByRole('checkbox', { name: 'Étoilé' }));

    expect(onChange).toHaveBeenCalledWith([PrioriteEnum.ETOILE]);
  });

  it('removes a priority that is already selected', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(<MagistratPrioritySelect value={[PrioriteEnum.ETOILE]} onChange={onChange} />);

    await user.click(screen.getByRole('button'));
    await user.click(await screen.findByRole('checkbox', { name: 'Étoilé' }));

    expect(onChange).toHaveBeenCalledWith([]);
  });
});

describe('MagistratReporterSelect', () => {
  const REPORTERS = [
    { userId: 'b', firstName: 'Marie', lastName: 'Zola' },
    { userId: 'a', firstName: 'Jean', lastName: 'Albert' },
  ];

  it('lists reporters sorted by last name', async () => {
    const user = userEvent.setup();
    renderWithIntl(<MagistratReporterSelect available={REPORTERS} value={[]} onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Affecter un rapporteur' }));

    const checkboxes = await screen.findAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0]).toBe(screen.getByRole('checkbox', { name: 'Jean ALBERT' }));
  });

  it('toggles a reporter by user id', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(<MagistratReporterSelect available={REPORTERS} value={[]} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Affecter un rapporteur' }));
    await user.click(await screen.findByRole('checkbox', { name: 'Jean ALBERT' }));

    expect(onChange).toHaveBeenCalledWith(['a']);
  });
});
