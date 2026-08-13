import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';

import { ReporterTag } from './ReporterTag';
import { ReporterTagList } from './ReporterTagList';

const HONORINE = { firstName: 'Honorine', id: 'honorine', lastName: 'Valrose' };
const ADA = { firstName: 'Ada', id: 'ada', lastName: 'Lovelace' };

function renderTag(enableTooltip?: boolean) {
  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <ReporterTag enableTooltip={enableTooltip} reporter={HONORINE} />
    </IntlProvider>,
  );
}

describe('ReporterTag', () => {
  it('describes the tag with the reporter full name', () => {
    renderTag();

    expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent('Honorine VALROSE');
  });

  it('drops the tooltip when it is disabled', () => {
    renderTag(false);

    expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull();
  });
});

describe('ReporterTagList', () => {
  it('describes the whole list with a single tooltip', () => {
    render(
      <IntlProvider defaultLocale="fr" locale="fr">
        <ReporterTagList reporters={[HONORINE, ADA]} />
      </IntlProvider>,
    );

    expect(screen.getAllByRole('tooltip', { hidden: true })).toHaveLength(1);
  });

  it('drops the tooltip when it is disabled', () => {
    render(
      <IntlProvider defaultLocale="fr" locale="fr">
        <ReporterTagList enableTooltip={false} reporters={[HONORINE, ADA]} />
      </IntlProvider>,
    );

    expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull();
  });
});
