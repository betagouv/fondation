import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import { NominationFilesSelectionBar } from './NominationFilesSelectionBar';

function renderBar(selectedCount = 2, totalCount = 18) {
  const onClear = vi.fn();
  const onExit = vi.fn();

  render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <NominationFilesSelectionBar
        onClear={onClear}
        onExit={onExit}
        selectedCount={selectedCount}
        totalCount={totalCount}
      />
    </IntlProvider>,
  );

  return { onClear, onExit };
}

describe('NominationFilesSelectionBar', () => {
  it('should announce the selected files count', () => {
    renderBar();

    expect(screen.getByText('2 propositions sélectionnées sur 18')).toBeVisible();
  });

  it('should drop the selection', async () => {
    const { onClear } = renderBar();

    await userEvent.click(screen.getByRole('button', { name: 'Tout désélectionner' }));

    expect(onClear).toHaveBeenCalled();
  });

  it('should leave the selection mode', async () => {
    const { onExit } = renderBar();

    await userEvent.click(screen.getByRole('button', { name: 'Quitter la sélection' }));

    expect(onExit).toHaveBeenCalled();
  });

  it('should offer nothing to clear without a selection', () => {
    renderBar(0);

    expect(screen.getByText('Aucune proposition sélectionnée sur 18')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Tout désélectionner' })).toBeNull();
  });
});
