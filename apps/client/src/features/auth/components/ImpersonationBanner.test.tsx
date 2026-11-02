import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { tabImpersonation } from '@/utils/tab-impersonation';

import { ImpersonationBanner } from './ImpersonationBanner';

vi.mock('@queries/auth.queries', () => ({
  useLogout: () => ({ isPending: false, mutate: vi.fn() }),
  useUser: () => ({ user: { firstName: 'jess', isImpersonated: false, lastName: 'test' } }),
}));

afterEach(() => tabImpersonation.forget());

describe('ImpersonationBanner', () => {
  it('tells the admin their impersonation ended on its own, the tab back to their session', () => {
    tabImpersonation.remember('Sophie SIÈGE');
    tabImpersonation.end();

    render(
      <IntlProvider defaultLocale="fr" locale="fr">
        <ImpersonationBanner />
      </IntlProvider>,
    );

    expect(screen.getByText(/a pris fin/)).toHaveTextContent(
      'Votre connexion en tant que Sophie SIÈGE a pris fin',
    );
    expect(screen.getByRole('button', { name: 'Continuer avec mon compte' })).toBeInTheDocument();
  });

  it('goes away once the admin goes on in the tab as themself', async () => {
    tabImpersonation.remember('Sophie SIÈGE');
    tabImpersonation.end();
    render(
      <IntlProvider defaultLocale="fr" locale="fr">
        <ImpersonationBanner />
      </IntlProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Continuer avec mon compte' }));

    expect(screen.queryByText(/a pris fin/)).not.toBeInTheDocument();
  });
});
