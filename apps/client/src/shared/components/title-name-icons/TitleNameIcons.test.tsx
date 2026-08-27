import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TitleNameIcons } from './TitleNameIcons';

function renderTitle(name: string) {
  return render(
    <TitleNameIcons name={name}>
      <span data-testid="icons" />
    </TitleNameIcons>,
  );
}

describe('TitleNameIcons', () => {
  it('should display the full name', () => {
    const { container } = renderTitle('DUPONT Anne-Charlotte');

    expect(container).toHaveTextContent('DUPONT Anne-Charlotte');
  });

  it('should keep the last word and the icons in an unbreakable group', () => {
    renderTitle('DUPONT DE LA BOISSIÈRE Anne-Charlotte');

    const nowrapGroup = screen.getByTestId('icons').closest('.whitespace-nowrap');
    expect(nowrapGroup).toHaveTextContent('Anne-Charlotte');
    expect(nowrapGroup).not.toHaveTextContent('BOISSIÈRE');
  });
});
