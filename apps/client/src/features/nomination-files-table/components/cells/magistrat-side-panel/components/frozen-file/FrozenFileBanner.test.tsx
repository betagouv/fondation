import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';

import type { NominationSessionFileStatus } from '@/types/enums.types';

import { FrozenFileBanner } from './FrozenFileBanner';

const REPORTED_ON = { year: 2026, month: 6, day: 8 };

function renderNotice(props: { isArchived: boolean; status: NominationSessionFileStatus }) {
  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <FrozenFileBanner {...props} />
    </IntlProvider>,
  );
}

describe('FrozenFileBanner', () => {
  it('names the official report and its date', () => {
    renderNotice({ isArchived: false, status: { value: 'DSJ_REPORTED', dates: [REPORTED_ON] } });

    expect(
      screen.getByText("Dossier acté dans le PV du 8 juin 2026 : il n'est plus modifiable"),
    ).toBeVisible();
  });

  it('falls back on a plain wording when no date is known', () => {
    renderNotice({ isArchived: false, status: { value: 'TO_REPORT', dates: [] } });

    expect(screen.getByText("Dossier acté dans un procès-verbal : il n'est plus modifiable")).toBeVisible();
  });

  it('never dates the official report from agenda dates', () => {
    renderNotice({ isArchived: false, status: { value: 'DSJ_PLANNED', dates: [REPORTED_ON] } });

    expect(screen.getByText("Dossier acté dans un procès-verbal : il n'est plus modifiable")).toBeVisible();
  });

  it('blames the archive first, whatever the file status says', () => {
    renderNotice({ isArchived: true, status: { value: 'DSJ_REPORTED', dates: [REPORTED_ON] } });

    expect(screen.getByText("Session archivée : ce dossier n'est plus modifiable")).toBeVisible();
  });
});
