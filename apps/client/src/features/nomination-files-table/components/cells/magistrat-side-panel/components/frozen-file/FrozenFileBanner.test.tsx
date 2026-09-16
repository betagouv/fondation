import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';

import { FrozenFileBanner } from './FrozenFileBanner';

function renderNotice(lockedReason: 'ARCHIVED_SESSION' | 'REPORTED') {
  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <FrozenFileBanner lockedReason={lockedReason} />
    </IntlProvider>,
  );
}

describe('FrozenFileBanner', () => {
  it('names the archive', () => {
    renderNotice('ARCHIVED_SESSION');

    expect(screen.getByText("Session archivée : ce dossier n'est plus modifiable")).toBeVisible();
  });

  it('names the official report', () => {
    renderNotice('REPORTED');

    expect(
      screen.getByText(
        'Cette proposition est déjà actée dans un procès-verbal restitué et avec une issue définitive',
      ),
    ).toBeVisible();
  });
});
