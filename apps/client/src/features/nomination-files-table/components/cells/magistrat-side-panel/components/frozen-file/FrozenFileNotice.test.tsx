import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';

import type { NominationSessionFileStatus } from '@/types/enums.types';

import { FrozenFileNotice } from './FrozenFileNotice';

function renderNotice(props: { isArchived: boolean; status: NominationSessionFileStatus }) {
  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <FrozenFileNotice {...props} />
    </IntlProvider>,
  );
}

describe('FrozenFileNotice', () => {
  it('names the official report and its date', () => {
    renderNotice({
      isArchived: false,
      status: { value: 'DSJ_REPORTED', dates: [{ year: 2026, month: 6, day: 8 }] },
    });

    expect(
      screen.getByText("Dossier acté dans le PV du 8 juin 2026 : il n'est plus modifiable"),
    ).toBeVisible();
  });

  it('falls back on a plain wording when no date is known', () => {
    renderNotice({ isArchived: false, status: { value: 'TO_REPORT', dates: [] } });

    expect(screen.getByText("Dossier acté dans un procès-verbal : il n'est plus modifiable")).toBeVisible();
  });

  it('blames the archive first, whatever the file status says', () => {
    renderNotice({
      isArchived: true,
      status: { value: 'DSJ_REPORTED', dates: [{ year: 2026, month: 6, day: 8 }] },
    });

    expect(screen.getByText("Session archivée : ce dossier n'est plus modifiable")).toBeVisible();
  });
});
