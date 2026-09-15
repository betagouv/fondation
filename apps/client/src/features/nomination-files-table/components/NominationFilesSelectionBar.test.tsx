import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';

import { NominationFilesSelectionBar } from './NominationFilesSelectionBar';

function renderBar(selectedCount = 2, totalCount = 18) {
  render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <NominationFilesSelectionBar selectedCount={selectedCount} totalCount={totalCount} />
    </IntlProvider>,
  );
}

describe('NominationFilesSelectionBar', () => {
  it('should announce the selected files count', () => {
    renderBar();

    expect(screen.getByText('2 propositions sélectionnées sur 18')).toBeVisible();
  });

  it('should announce an empty selection', () => {
    renderBar(0);

    expect(screen.getByText('Aucune proposition sélectionnée sur 18')).toBeVisible();
  });
});
