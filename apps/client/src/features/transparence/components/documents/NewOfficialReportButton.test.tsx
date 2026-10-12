import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { NewOfficialReportButton } from './NewOfficialReportButton';
import type { AgendaDocument } from './session-document-groups';

const AGENDA: AgendaDocument = {
  createdAt: '2028-03-10T09:00:00.000Z',
  createdBy: null,
  draftChangesBy: null,
  draftUpdate: null,
  id: 'agenda-1',
  meetingDate: { day: 12, month: 3, year: 2028 },
  name: 'Ordre du jour du 12 mars 2028',
  officialReportId: null,
  officialReportReadiness: { status: 'READY' },
  outdated: false,
  presentationPlans: [],
  status: 'VALIDATED',
  type: 'agenda',
  validatedAt: '2028-03-10T11:00:00.000Z',
  validatedBy: null,
};

function renderButton(readiness: AgendaDocument['officialReportReadiness']) {
  render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <MemoryRouter>
        <NewOfficialReportButton
          agenda={{ ...AGENDA, officialReportReadiness: readiness }}
          sessionId="session-1"
        />
      </MemoryRouter>
    </IntlProvider>,
  );
}

describe('NewOfficialReportButton', () => {
  it('should lead to the official report form when the agenda is ready', () => {
    renderButton({ status: 'READY' });

    expect(screen.getByRole('link', { name: 'Générer un procès-verbal' })).toHaveAttribute(
      'href',
      '/secretariat-general/session/session-1/docs/pv',
    );
  });

  it('should tell what the agenda lacks', () => {
    renderButton({
      filesWithoutOutcome: 2,
      filesWithoutReporter: 1,
      filesWithUnpublishedReporter: 0,
      status: 'INCOMPLETE',
    });

    expect(screen.getByRole('button', { name: /Générer un procès-verbal/ })).toBeDisabled();
    expect(
      screen.getByText(
        "Pour générer le procès-verbal, il reste à renseigner l'issue de 2 propositions et affecter un rapporteur à 1 proposition",
      ),
    ).toBeInTheDocument();
  });

  it('should ask to publish a transparence never published', () => {
    renderButton({ status: 'NEVER_PUBLISHED' });

    expect(
      screen.getByText("Vous devez publier la transparence aux membres dans l'onglet Propositions"),
    ).toBeInTheDocument();
  });
});
