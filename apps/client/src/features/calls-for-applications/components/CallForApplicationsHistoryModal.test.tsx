import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import { frFormat } from '@/i18n/formats';
import { authKeys } from '@queries/auth.queries';
import type { CallForApplications } from '@queries/calls-for-applications.queries';

import { CallForApplicationsHistoryModal } from './CallForApplicationsHistoryModal';

const ME = { firstName: 'Anne', id: 'me', lastName: 'Roy', role: 'ADJOINT_SECRETAIRE_GENERAL' };
const ADDED = { id: 'ADDED', label: 'ajouté' } as const;
const CHANGED = { id: 'CHANGED', label: 'modifié' } as const;

function renderHistory(history: CallForApplications['history']) {
  const client = new QueryClient();
  client.setQueryData(authKeys.introspectSession(), ME);

  render(
    <QueryClientProvider client={client}>
      <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr" timeZone="Europe/Paris">
        <CallForApplicationsHistoryModal history={history} onClose={vi.fn()} onClosed={vi.fn()} open />
      </IntlProvider>
    </QueryClientProvider>,
  );
}

describe('CallForApplicationsHistoryModal', () => {
  it('groups the fields by what each update did to them', () => {
    renderHistory([
      {
        action: 'UPDATED',
        at: '2026-11-22T13:00:00.000Z',
        by: { id: 'me', name: 'Anne ROY' },
        changes: [
          {
            change: CHANGED,
            label: 'la date limite du 10/01/2027 au 15/01/2027',
            targets: null,
          },
          { change: ADDED, label: 'un commentaire', targets: null },
        ],
      },
      {
        action: 'CREATED',
        at: '2026-11-20T09:30:00.000Z',
        by: { id: 'paul', name: 'Paul MARTIN' },
        changes: [],
      },
    ]);

    expect(
      screen.getByText(
        'Vous avez modifié la date limite du 10/01/2027 au 15/01/2027 et ajouté un commentaire',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Paul MARTIN a créé l'appel")).toBeInTheDocument();
  });

  it('names in a tooltip the courts too many for the sentence', () => {
    renderHistory([
      {
        action: 'UPDATED',
        at: '2026-11-22T13:00:00.000Z',
        by: { id: 'me', name: 'Anne ROY' },
        changes: [
          {
            change: CHANGED,
            label: 'les juridictions cibles',
            targets: {
              added: [
                { label: "Tribunal judiciaire d'Auch" },
                { label: 'Tribunal judiciaire de Cahors' },
                { label: "Tribunal judiciaire d'Agen" },
              ],
              removed: [{ label: "Cour d'appel d'Agen" }],
            },
          },
        ],
      },
    ]);

    expect(screen.getByText('Vous avez modifié les juridictions cibles')).toBeInTheDocument();
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent(
      "Ajouts : Tribunal judiciaire d'Auch, Tribunal judiciaire de Cahors et Tribunal judiciaire d'AgenRetrait : Cour d'appel d'Agen",
    );
  });
});
