import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { type ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { SoftDropdown } from './SoftDropdown';

function renderDropdown(children: ReactNode | ((close: () => void) => ReactNode)) {
  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <SoftDropdown label="Priorité">{children}</SoftDropdown>
    </IntlProvider>,
  );
}

describe('SoftDropdown', () => {
  it('keeps the panel closed until the trigger is clicked', async () => {
    const user = userEvent.setup();
    renderDropdown(<p>Contenu</p>);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Priorité' }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Contenu')).toBeInTheDocument();
  });

  it('lets its content close the panel through the render-prop', async () => {
    const user = userEvent.setup();
    renderDropdown((close) => (
      <button type="button" onClick={close}>
        Fermer
      </button>
    ));

    await user.click(screen.getByRole('button', { name: 'Priorité' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Fermer' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('passes basic accessibility checks when open', async () => {
    const user = userEvent.setup();
    renderDropdown(<p>Contenu</p>);

    await user.click(screen.getByRole('button', { name: 'Priorité' }));
    await screen.findByRole('dialog');

    expect(await axe(document.body)).toHaveNoViolations();
  });
});
