import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';

import { ReporterTag } from './ReporterTag';
import { ReporterTagList } from './ReporterTagList';

const HONORINE = { firstName: 'Honorine', id: 'honorine', lastName: 'Valrose' };
const ADA = { firstName: 'Ada', id: 'ada', lastName: 'Lovelace' };

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
  it('gives each reporter its own tooltip', () => {
    render(
      <IntlProvider defaultLocale="fr" locale="fr">
        <ReporterTagList reporters={[HONORINE, { ...ADA, isCurrentUser: true }]} />
      </IntlProvider>,
    );

    expect(screen.getAllByRole('tooltip', { hidden: true }).map((tooltip) => tooltip.textContent)).toEqual([
      'Vous',
      'Honorine VALROSE',
    ]);
  });

  it('names the reporters left out of the list in the remainder tooltip', () => {
    render(
      <IntlProvider defaultLocale="fr" locale="fr">
        <ReporterTagList max={1} reporters={[HONORINE, ADA]} />
      </IntlProvider>,
    );

    expect(screen.getByText('+1')).toBeInTheDocument();
    expect(screen.getAllByRole('tooltip', { hidden: true }).at(-1)).toHaveTextContent('Honorine VALROSE');
  });
});
