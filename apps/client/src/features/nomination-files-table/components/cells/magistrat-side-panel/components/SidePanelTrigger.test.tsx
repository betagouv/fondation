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

function renderTrigger(overrides: NominationFileOverrides) {
  const nominationFile = makeSessionNominationFile(overrides);

  return render(
    <MemoryRouter>
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
      auditionDate: { year: 2099, month: 4, day: 12 },
      content: { nomMagistrat: 'DUPONT DE LA TOUR Anne-Charlotte' },
      hasAttachment: true,
    });

    const nowrapGroup = screen
      .getByRole('img', { name: 'Une audition est prévue pour ce magistrat' })
      .closest('.whitespace-nowrap');

    expect(nowrapGroup).toHaveTextContent('Anne-Charlotte');
    expect(nowrapGroup).not.toHaveTextContent('TOUR');
    expect(nowrapGroup).toContainElement(
      screen.getByRole('img', { name: 'Au moins une pièce jointe est présente' }),
    );
  });
});
