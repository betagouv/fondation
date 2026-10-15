import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import { frFormat } from '@/i18n/formats';

import { PresentationRestitution } from './PresentationAuthoring';

vi.mock('@queries/auth.queries', () => ({ useUser: () => ({ user: { id: 'me' } }) }));

function IntlWrapper(props: { children: ReactNode }) {
  return (
    <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr">
      {props.children}
    </IntlProvider>
  );
}

describe('PresentationRestitution', () => {
  it('should date the restitution by the notice and its ending time', () => {
    render(
      <PresentationRestitution
        date={{ day: 15, month: 3, year: 2028 }}
        endTime={{ hours: 10, minutes: 15, seconds: 0 }}
        presentedBy={{ id: 'user-1', name: 'Camille Martin' }}
      />,
      { wrapper: IntlWrapper },
    );

    expect(screen.getByText(/Restituée le/)).toHaveTextContent(
      'Restituée le 15/03/2028 à 10h15 par Camille Martin',
    );
  });

  it('should keep only the date of a notice without ending time', () => {
    render(
      <PresentationRestitution date={{ day: 15, month: 3, year: 2028 }} endTime={null} presentedBy={null} />,
      {
        wrapper: IntlWrapper,
      },
    );

    expect(screen.getByText(/Restituée le/)).toHaveTextContent(/^Restituée le 15\/03\/2028$/);
  });
});
