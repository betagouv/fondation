import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';

import { authKeys } from '@queries/auth.queries';

import { ReporterTag } from './ReporterTag';
import { ReporterTagList } from './ReporterTagList';

const HONORINE = { firstName: 'Honorine', id: 'honorine', lastName: 'Valrose' };
const ADA = { firstName: 'Ada', id: 'ada', lastName: 'Lovelace' };

function renderList(max?: number) {
  const client = new QueryClient();
  client.setQueryData(authKeys.introspectSession(), { ...HONORINE, role: 'MEMBRE_DU_SIEGE' });

  return render(
    <QueryClientProvider client={client}>
      <IntlProvider defaultLocale="fr" locale="fr">
        <ReporterTagList max={max} reporters={[HONORINE, ADA]} />
      </IntlProvider>
    </QueryClientProvider>,
  );
}

function renderTag(enableTooltip?: boolean, isCurrentUser?: boolean) {
  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <ReporterTag enableTooltip={enableTooltip} isCurrentUser={isCurrentUser} reporter={HONORINE} />
    </IntlProvider>,
  );
}

describe('ReporterTag', () => {
  it('describes the tag with the reporter full name', () => {
    renderTag();

    expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent('Honorine VALROSE');
  });

  it('addresses the current user rather than naming them', () => {
    renderTag(undefined, true);

    expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent('Vous');
  });

  it('states the excluded jurisdiction rather than the name alone', () => {
    render(
      <IntlProvider defaultLocale="fr" locale="fr">
        <ReporterTag
          excludedTitle="Juridiction exclue pour Honorine VALROSE : Cour d'appel de Lyon"
          reporter={HONORINE}
        />
      </IntlProvider>,
    );

    expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent(
      "Juridiction exclue pour Honorine VALROSE : Cour d'appel de Lyon",
    );
  });

  it('drops the tooltip when it is disabled', () => {
    renderTag(false);

    expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull();
  });
});

describe('ReporterTagList', () => {
  it('gives each reporter its own tooltip, and addresses the current user', () => {
    renderList();

    expect(screen.getAllByRole('tooltip', { hidden: true }).map((tooltip) => tooltip.textContent)).toEqual([
      'Vous',
      'Ada LOVELACE',
    ]);
  });

  it('shows the current user before the remainder, even when the alphabetical order puts them after', () => {
    renderList(1);

    expect(screen.getAllByRole('tooltip', { hidden: true }).at(0)).toHaveTextContent('Vous');
  });

  it('names the reporters left out of the list in the remainder tooltip', () => {
    renderList(1);

    expect(screen.getByText('+1')).toBeInTheDocument();
    expect(screen.getAllByRole('tooltip', { hidden: true }).at(-1)).toHaveTextContent('Ada LOVELACE');
  });
});
