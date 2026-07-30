import { render, screen } from '@testing-library/react';
import { type ComponentProps } from 'react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { DetailsLink } from './DetailsLink';

function renderLink(props: ComponentProps<typeof DetailsLink>) {
  return render(
    <MemoryRouter>
      <IntlProvider defaultLocale="fr" locale="fr">
        <DetailsLink {...props} />
      </IntlProvider>
    </MemoryRouter>,
  );
}

describe('DetailsLink', () => {
  it('should render nothing without a detected magistrat', () => {
    const { container } = renderLink({ context: 'sg', magistratId: null });

    expect(container).toBeEmptyDOMElement();
  });

  it('should link to the secrétariat général magistrat details page', () => {
    renderLink({ context: 'sg', magistratId: 'magistrat-1' });

    expect(screen.getByRole('link', { name: 'Fiche détails du magistrat' })).toHaveAttribute(
      'href',
      '/secretariat-general/magistrats/magistrat-1',
    );
  });

  it('should link to the member magistrat details page', () => {
    renderLink({ context: 'membre', magistratId: 'magistrat-1' });

    expect(screen.getByRole('link', { name: 'Fiche détails du magistrat' })).toHaveAttribute(
      'href',
      '/transparences/pouvoir-de-proposition-du-garde-des-sceaux/magistrats/magistrat-1',
    );
  });

  it('should pass basic accessibility', async () => {
    const { container } = renderLink({ context: 'sg', magistratId: 'magistrat-1' });

    expect(await axe(container)).toHaveNoViolations();
  });
});
