import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import { SidePanel } from './SidePanel';

function renderPanel(props: { open?: boolean; onClose?: () => void } = {}) {
  const onClose = props.onClose ?? vi.fn();
  const view = render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <SidePanel ariaLabel="Détails" onClose={onClose} open={props.open ?? true}>
        <button type="button">First</button>
        <input aria-label="middle" />
        <button type="button">Last</button>
      </SidePanel>
    </IntlProvider>,
  );
  return { onClose, view };
}

describe('SidePanel', () => {
  it('moves focus into the panel when opened', () => {
    renderPanel();
    expect(screen.getByRole('dialog')).toHaveFocus();
  });

  it('wraps focus from the last element back to the first on Tab', async () => {
    const user = userEvent.setup();
    renderPanel();

    screen.getByRole('button', { name: 'Last' }).focus();
    await user.tab();

    expect(screen.getByRole('button', { name: 'Fermer' })).toHaveFocus();
  });

  it('wraps focus from the first element back to the last on Shift+Tab', async () => {
    const user = userEvent.setup();
    renderPanel();

    screen.getByRole('button', { name: 'Fermer' }).focus();
    await user.tab({ shift: true });

    expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    const { onClose } = renderPanel();

    screen.getByRole('button', { name: 'First' }).focus();
    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on an outside pointer down but not on an inside one', () => {
    const { onClose } = renderPanel();

    fireEvent.pointerDown(screen.getByRole('button', { name: 'First' }));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.pointerDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('restores focus to the previously focused element on close', () => {
    const onClose = vi.fn();
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    expect(trigger).toHaveFocus();

    const ui = (open: boolean) => (
      <IntlProvider defaultLocale="fr" locale="fr">
        <SidePanel ariaLabel="Détails" onClose={onClose} open={open}>
          <button type="button">Inside</button>
        </SidePanel>
      </IntlProvider>
    );

    const view = render(ui(false));
    view.rerender(ui(true));
    expect(screen.getByRole('dialog')).toHaveFocus();

    view.rerender(ui(false));
    expect(trigger).toHaveFocus();

    trigger.remove();
  });
});
