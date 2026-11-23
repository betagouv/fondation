import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';

import { ToastProvider } from '@/shared/ui/toast';

import { ExclusionSelector } from './ExclusionSelector';

describe('ExclusionSelector', () => {
  it('keeps the modal open and tells when the exclusions could not be saved', async () => {
    const user = userEvent.setup();
    render(
      <IntlProvider defaultLocale="fr" locale="fr">
        <ToastProvider>
          <ExclusionSelector
            editLabel="Éditer"
            modalTitle="Sélection"
            onSave={() => Promise.reject(new Error('Internal Server Error'))}
            originalIds={[]}
            picker={({ setSelected }) => (
              <button onClick={() => setSelected(['lyon'])} type="button">
                Lyon
              </button>
            )}
            saved="n/a"
          />
        </ToastProvider>
      </IntlProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Éditer' }));
    await user.click(screen.getByRole('button', { name: 'Lyon' }));
    await user.click(screen.getByRole('button', { name: 'Sauvegarder' }));

    expect(
      await within(screen.getByRole('region', { name: 'Notifications' })).findByText(
        "Les exclusions n'ont pas pu être enregistrées",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Sélection' })).toBeInTheDocument();
  });
});
