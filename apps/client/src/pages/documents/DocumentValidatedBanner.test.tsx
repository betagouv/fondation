import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import { frFormat } from '@/i18n/formats';

import { DocumentValidatedBanner } from './DocumentValidatedBanner';

vi.mock('@queries/auth.queries', () => ({ useUser: () => ({ user: { id: 'me' } }) }));

function IntlWrapper(props: { children: ReactNode }) {
  return (
    <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr">
      {props.children}
    </IntlProvider>
  );
}

describe('DocumentValidatedBanner', () => {
  it('should date the restitution of a notice by its date and ending time', () => {
    render(
      <DocumentValidatedBanner
        kind="notice"
        presentation={{
          by: { id: 'me', name: 'Lucas Bernard' },
          date: { day: 15, month: 3, year: 2028 },
          endTime: { hours: 10, minutes: 15, seconds: 0 },
        }}
        validation={null}
      />,
      { wrapper: IntlWrapper },
    );

    expect(screen.getByText(/Restituée le/)).toHaveTextContent('Restituée le 15/03/2028 à 10h15 par vous');
  });
});
