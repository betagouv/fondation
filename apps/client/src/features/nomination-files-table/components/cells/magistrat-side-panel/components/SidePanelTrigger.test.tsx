import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { SidePanelProvider } from '../context/SidePanelProvider';
import {
  makeSessionNominationFile,
  type NominationFileOverrides,
} from '@/test-utils/factories/session-nomination-file.factory';

import { SidePanelTrigger } from './SidePanelTrigger';

const SG_ROUTE = '/secretariat-general/session/session-1';
const MEMBER_ROUTE = '/transparences/pouvoir-de-proposition-du-garde-des-sceaux/sessions/session-1';

function renderTrigger(overrides: NominationFileOverrides, route = SG_ROUTE) {
  const nominationFile = makeSessionNominationFile(overrides);

  return render(
    <MemoryRouter initialEntries={[route]}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <IntlProvider defaultLocale="fr" locale="fr">
          <NuqsTestingAdapter hasMemory>
            <SidePanelProvider
              isFetching={false}
              nominationFiles={[nominationFile]}
              onEndReached={vi.fn()}
              totalCount={1}
            >
              <SidePanelTrigger nominationFile={nominationFile} />
            </SidePanelProvider>
          </NuqsTestingAdapter>
        </IntlProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('SidePanelTrigger', () => {
  it('should display the full magistrat name', () => {
    const { container } = renderTrigger({ content: { nomMagistrat: 'DUPONT DE LA TOUR Anne-Charlotte' } });

    expect(container).toHaveTextContent('DUPONT DE LA TOUR Anne-Charlotte');
  });

  it('should keep the last word of the name and the icons in an unbreakable group', () => {
    renderTrigger({
      auditionDate: { day: 12, month: 4, year: 2099 },
      content: { nomMagistrat: 'DUPONT DE LA TOUR Anne-Charlotte' },
      memo: 'un mémo',
    });

    const nowrapGroup = screen
      .getByRole('img', { name: 'Une audition est prévue' })
      .closest('.whitespace-nowrap');

    expect(nowrapGroup).toHaveTextContent('Anne-Charlotte');
    expect(nowrapGroup).not.toHaveTextContent('TOUR');
    expect(nowrapGroup).toContainElement(
      screen.getByRole('img', { name: 'Ce dossier a des annotations (mémo)' }),
    );
  });

  it('should not display an attachment icon', () => {
    renderTrigger({ hasAttachment: true });

    expect(screen.queryByRole('img', { name: 'Au moins une pièce jointe est présente' })).toBeNull();
  });

  it('should warn about the missing evaluation next to the name', () => {
    renderTrigger({ missingEvaluation: true });

    expect(screen.getByRole('button')).toHaveAccessibleDescription(
      'Évaluation manquante dans le dossier administratif LOLFI',
    );
  });

  it('should tell a member an audition will be scheduled without warning them', () => {
    renderTrigger({ auditionRequired: true }, MEMBER_ROUTE);

    expect(screen.getByRole('img', { name: 'Une audition va être programmée' })).toBeInTheDocument();
    expect(screen.getByRole('button')).not.toHaveAccessibleDescription();
  });

  it('should gather the expected audition and the missing evaluation in a single warning', () => {
    renderTrigger({ auditionRequired: true, auditionRequirement: 'POSITION', missingEvaluation: true });

    expect(screen.getByRole('button')).toHaveAccessibleDescription(
      'Une audition est à prévoir pour ce poste. Évaluation manquante dans le dossier administratif LOLFI',
    );
  });

  it('should list the warnings one per line in the tooltip', () => {
    const { container } = renderTrigger({
      auditionRequired: true,
      auditionRequirement: 'POSITION',
      missingEvaluation: true,
    });

    const lines = container.querySelectorAll('[role="tooltip"] li');

    expect([...lines].map((line) => line.textContent)).toEqual([
      '- Une audition est à prévoir pour ce poste',
      '- Évaluation manquante dans le dossier administratif LOLFI',
    ]);
  });
});
