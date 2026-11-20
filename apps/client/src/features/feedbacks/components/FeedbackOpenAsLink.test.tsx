import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import { FeedbackOpenAsLink } from './FeedbackOpenAsLink';

const open = vi.fn();

vi.mock('@/shared/hooks/useTab', () => ({ useTab: () => ({ open }) }));
vi.mock('@/shared/ui/toast', () => ({ useToasts: () => ({ error: vi.fn() }) }));
vi.mock('@queries/auth.queries', () => ({
  useImpersonateMutation: () => ({
    isPending: false,
    mutate: (_: unknown, options: { onSuccess: (impersonation: { id: string }) => void }) =>
      options.onSuccess({ id: 'impersonation-1' }),
  }),
}));

describe('FeedbackOpenAsLink', () => {
  it('opens the page of the feedback in a tab impersonating its account', async () => {
    render(
      <IntlProvider defaultLocale="fr" locale="fr">
        <FeedbackOpenAsLink account={{ id: 'member', name: 'Jean MARTIN' }} url="/rapports/1?dossier=42" />
      </IntlProvider>,
    );

    expect(screen.getByText("S'ouvre en tant que Jean MARTIN")).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: /\/rapports\/1\?dossier=42/ }));

    expect(open).toHaveBeenCalledWith(
      new URL(`${window.location.origin}/rapports/1?dossier=42#impersonation=impersonation-1`),
    );
  });
});
