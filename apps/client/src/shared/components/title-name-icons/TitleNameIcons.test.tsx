import { render, screen } from '@testing-library/react';
import { type ComponentProps } from 'react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { TitleNameIcons } from './TitleNameIcons';

function renderTitle(props: ComponentProps<typeof TitleNameIcons>) {
  return render(
    <MemoryRouter>
      <IntlProvider defaultLocale="fr" locale="fr">
        <TitleNameIcons {...props} />
      </IntlProvider>
    </MemoryRouter>,
  );
}

describe('TitleNameIcons', () => {
  it('should display the full name', () => {
    const { container } = renderTitle({
      name: 'DUPONT Anne-Charlotte',
      lolfi: { sessionId: 'session-1', nominationFileId: 'file-1' },
    });

    expect(container).toHaveTextContent('DUPONT Anne-Charlotte');
  });

  it('should keep the last word and the icons in an unbreakable group', () => {
    renderTitle({
      name: 'DUPONT DE LA BOISSIÈRE Anne-Charlotte',
      lolfi: { sessionId: 'session-1', nominationFileId: 'file-1' },
    });

    const nowrapGroup = screen.getByRole('link', { name: 'Vers LOLFI' }).closest('.whitespace-nowrap');
    expect(nowrapGroup).toHaveTextContent('Anne-Charlotte');
    expect(nowrapGroup).not.toHaveTextContent('BOISSIÈRE');
  });

  it('should render the magistrat details link when a magistrat is detected', () => {
    renderTitle({
      name: 'DUPONT Anne-Charlotte',
      detailsLink: { context: 'membre', magistratId: 'magistrat-1' },
      lolfi: { sessionId: 'session-1', nominationFileId: 'file-1' },
    });

    expect(screen.getByRole('link', { name: 'Fiche détails du magistrat' })).toBeVisible();
  });

  it('should render no details link without a detected magistrat', () => {
    renderTitle({
      name: 'DUPONT Anne-Charlotte',
      detailsLink: { context: 'membre', magistratId: null },
      lolfi: { sessionId: 'session-1', nominationFileId: 'file-1' },
    });

    expect(screen.queryByRole('link', { name: 'Fiche détails du magistrat' })).not.toBeInTheDocument();
  });

  it('should link to LOLFI with a direct href', () => {
    renderTitle({
      name: 'DUPONT Anne-Charlotte',
      lolfi: { href: 'https://lolfi.example.fr/magistrat/1' },
    });

    expect(screen.getByRole('link', { name: 'Vers LOLFI' })).toHaveAttribute(
      'href',
      'https://lolfi.example.fr/magistrat/1',
    );
  });
});
