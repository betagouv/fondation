import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import { FloatingActionsProvider, FloatingActionsStack } from '@/shared/context/floating-actions';

import { RemarkButton } from './RemarkButton';

const mutate = vi.fn((_remark: unknown, options: { onSuccess: () => void }) => options.onSuccess());
const success = vi.fn();

vi.mock('@queries/auth.queries', () => ({ useUser: () => ({ user: { id: 'user-1' } }) }));
vi.mock('@queries/remarks.queries', () => ({ useSendRemarkMutation: () => ({ isPending: false, mutate }) }));
vi.mock('@/shared/ui/toast', () => ({ useToasts: () => ({ error: vi.fn(), success }) }));

describe('RemarkButton', () => {
  it('sends the remark with the page it was made on, its opened side panel included', async () => {
    // the way nuqs opens a side panel: in the address only
    window.history.replaceState(null, '', '/secretariat-general/session/1?dossier=42');
    render(
      <IntlProvider defaultLocale="fr" locale="fr">
        <FloatingActionsProvider>
          <RemarkButton />
          <FloatingActionsStack />
        </FloatingActionsProvider>
      </IntlProvider>,
    );
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Une remarque ?' }));
    expect(screen.getByRole('button', { name: 'Envoyer' })).toBeDisabled();
    await user.type(screen.getByLabelText(/Votre remarque/), 'Ce libellé est trompeur');
    await user.click(screen.getByRole('button', { name: 'Envoyer' }));

    expect(mutate).toHaveBeenCalledWith(
      { text: 'Ce libellé est trompeur', url: '/secretariat-general/session/1?dossier=42' },
      expect.anything(),
    );
    expect(success).toHaveBeenCalledOnce();
  });
});
