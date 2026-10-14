import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PresentationPlanContext } from '@/features/documents/context/presentation-plan.context';
import type { PresentationPlanContextType } from '@/features/documents/context/presentation-plan.type';

import { PresentationAgendaCommentsStep } from './PresentationAgendaCommentsStep';

const mocks = vi.hoisted(() => ({ createPlan: vi.fn() }));

vi.mock('@queries/agenda.queries', () => ({
  useListPresentationPlansAgendasQuery: () => ({
    data: {
      items: [
        { id: 'agenda-1', session: { comment: 'Note du SG', id: 'session-1', name: 'Transparence PR' } },
        { id: 'agenda-2', session: { comment: 'Note du SG', id: 'session-1', name: 'Transparence PR' } },
      ],
    },
  }),
}));

function renderStep(agendas: Record<string, string | null>) {
  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <PresentationPlanContext
        value={
          {
            createPlan: mocks.createPlan,
            goToMetadata: vi.fn(),
            hasAllMandatoryMetadata: true,
            hasFailed: false,
            isDisabled: false,
            planId: null,
            state: { agendas },
          } as unknown as PresentationPlanContextType
        }
      >
        <PresentationAgendaCommentsStep />
      </PresentationPlanContext>
    </IntlProvider>,
  );
}

beforeEach(() => mocks.createPlan.mockClear());

describe('PresentationAgendaCommentsStep', () => {
  it('should prefill a new notice with the comment of the session, once per session', async () => {
    renderStep({ 'agenda-1': null, 'agenda-2': null });

    expect(screen.getByRole('textbox', { name: 'Commentaire' })).toHaveValue('Note du SG');

    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer la notice' }));
    expect(mocks.createPlan).toHaveBeenCalledWith({
      agendas: { 'agenda-1': 'Note du SG', 'agenda-2': '' },
    });
  });

  it('should not bring the session comment back once emptied on purpose', async () => {
    renderStep({ 'agenda-1': null, 'agenda-2': null });

    await userEvent.clear(screen.getByRole('textbox', { name: 'Commentaire' }));
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer la notice' }));

    expect(mocks.createPlan).toHaveBeenCalledWith({ agendas: { 'agenda-1': '', 'agenda-2': '' } });
  });

  it('should keep the comment the notice already holds', () => {
    renderStep({ 'agenda-1': '', 'agenda-2': '' });

    expect(screen.getByRole('textbox', { name: 'Commentaire' })).toHaveValue('');
  });
});
