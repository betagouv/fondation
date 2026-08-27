import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import type { AgendaBasket } from '@/features/documents/hooks/useAgendaBasket.hook';

import { NominationFilesAgendaBasket } from './NominationFilesAgendaBasket';

function renderBasket(options: { isFiltering?: boolean; size?: number } = {}) {
  const size = options.size ?? 2;
  const onToggleFilter = vi.fn();
  const basket = { isEmpty: size === 0, size } as unknown as AgendaBasket;

  render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <NominationFilesAgendaBasket
        basket={basket}
        isFiltering={options.isFiltering ?? false}
        onToggleFilter={onToggleFilter}
      />
    </IntlProvider>,
  );

  return { onToggleFilter };
}

describe('NominationFilesAgendaBasket', () => {
  it('should stay out of the way while the agenda is empty', () => {
    renderBasket({ size: 0 });

    expect(screen.queryByRole('button', { name: /ODJ en préparation/ })).toBeNull();
  });

  it('should ask for the agenda files only', async () => {
    const { onToggleFilter } = renderBasket();

    const toggle = screen.getByRole('button', { name: /ODJ en préparation/ });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(toggle);

    expect(onToggleFilter).toHaveBeenCalled();
  });

  it('should tell the filter is on', () => {
    renderBasket({ isFiltering: true });

    expect(screen.getByRole('button', { name: /ODJ en préparation/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('should count the files waiting in the agenda', () => {
    renderBasket({ size: 3 });

    expect(screen.getByRole('button', { name: /ODJ en préparation/ })).toHaveTextContent('(3)');
  });
});
