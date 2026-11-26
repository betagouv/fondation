import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { Tooltip } from './Tooltip';

// jsdom has no popover: the bubble only needs to open and close
beforeAll(() => {
  HTMLElement.prototype.showPopover = vi.fn();
  HTMLElement.prototype.hidePopover = vi.fn();
});

function renderTooltip() {
  render(
    <Tooltip focusable label="Détail">
      <span>Survolez-moi</span>
    </Tooltip>,
  );
  return screen.getByText('Survolez-moi').parentElement!;
}

describe('Tooltip', () => {
  it('keeps the first Escape for the bubble so that a dialog around it stays open', () => {
    const anchor = renderTooltip();

    fireEvent.pointerEnter(anchor);

    expect(fireEvent.keyDown(anchor, { key: 'Escape' })).toBe(false);
  });

  it('lets Escape through once the bubble is hidden', () => {
    const anchor = renderTooltip();

    expect(fireEvent.keyDown(anchor, { key: 'Escape' })).toBe(true);
  });
});
