import { render, screen } from '@testing-library/react';
import { type ComponentProps } from 'react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { LolfiLink } from './LolfiLink';

function renderLink(props: ComponentProps<typeof LolfiLink>) {
  return render(
    <MemoryRouter>
      <IntlProvider defaultLocale="fr" locale="fr">
        <LolfiLink {...props} />
      </IntlProvider>
    </MemoryRouter>,
  );
}

describe('LolfiLink', () => {
  it('should open the direct Lolfi URL in a new tab', () => {
    renderLink({ href: 'https://lolfi.example.fr/magistrat/1' });

    const link = screen.getByRole('link', { name: 'Vers LOLFI' });
    expect(link).toHaveAttribute('href', 'https://lolfi.example.fr/magistrat/1');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('should go through the nomination file redirect with the magistrat name', () => {
    renderLink({ name: 'DUPONT Marie', nominationFileId: 'dossier-1', sessionId: 'session-1' });

    expect(screen.getByRole('link', { name: 'Vers LOLFI' })).toHaveAttribute(
      'href',
      '/session/session-1/dossier/dossier-1/lolfi-magistrat?name=DUPONT+Marie',
    );
  });

  it('should omit the magistrat name when missing', () => {
    renderLink({ nominationFileId: 'dossier-1', sessionId: 'session-1' });

    expect(screen.getByRole('link', { name: 'Vers LOLFI' })).toHaveAttribute(
      'href',
      '/session/session-1/dossier/dossier-1/lolfi-magistrat',
    );
  });

  it('should pass basic accessibility', async () => {
    const { container } = renderLink({ href: 'https://lolfi.example.fr/magistrat/1' });

    expect(await axe(container)).toHaveNoViolations();
  });
});
