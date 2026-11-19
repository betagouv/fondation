import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import type { SessionCommentDraft } from '@/features/transparence/hooks/useSessionCommentDraft';
import { frFormat } from '@/i18n/formats';
import { authKeys } from '@queries/auth.queries';

import { SessionCommentField } from './SessionCommentField';

const ME = { firstName: 'Anne', id: 'sg-1', lastName: 'Roy', role: 'ADJOINT_SECRETAIRE_GENERAL' };

function renderField(lastChange: SessionCommentDraft['lastChange']) {
  const client = new QueryClient();
  client.setQueryData(authKeys.introspectSession(), ME);
  const draft: SessionCommentDraft = {
    cancel: vi.fn(),
    isDirty: false,
    isError: false,
    isPending: false,
    isWarned: false,
    lastChange,
    onChange: vi.fn(),
    save: vi.fn(),
    tryLeave: vi.fn(),
    value: 'Une note',
  };

  return render(
    <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr">
      <QueryClientProvider client={client}>
        <SessionCommentField draft={draft} isArchived={false} rows={8} />
      </QueryClientProvider>
    </IntlProvider>,
  );
}

describe('SessionCommentField', () => {
  it('describes the field with the hint', () => {
    renderField(null);

    expect(screen.getByRole('textbox', { name: 'Commentaire de la notice' })).toHaveAccessibleDescription(
      'Ce commentaire apparaîtra dans la notice de restitution',
    );
  });

  it('says "par vous" to the author of the last change', () => {
    renderField({ at: '2026-11-18T09:42:00.000Z', by: { id: ME.id, name: 'Anne Roy' } });

    expect(screen.getByText(/^Modifié le 18\/11\/2026 à .* par vous$/)).toBeInTheDocument();
  });

  it('names another author', () => {
    renderField({ at: '2026-11-18T09:42:00.000Z', by: { id: 'sg-2', name: 'Paul Martin' } });

    expect(screen.getByText(/^Modifié le 18\/11\/2026 à .* par Paul Martin$/)).toBeInTheDocument();
  });
});
