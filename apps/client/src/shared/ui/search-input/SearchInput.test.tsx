import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ComponentProps } from 'react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { SearchInput } from './SearchInput';

function renderSearchInput(props: Partial<ComponentProps<typeof SearchInput>> = {}) {
  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <SearchInput onChange={() => {}} onClear={() => {}} value="" {...props} />
    </IntlProvider>,
  );
}

describe('SearchInput', () => {
  it('should show the magnifier and no clear button when empty', () => {
    const { container } = renderSearchInput();

    expect(container.querySelector('.fr-icon-search-line')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Effacer la recherche' })).not.toBeInTheDocument();
  });

  it('should hide the magnifier while the empty input is focused', async () => {
    const user = userEvent.setup();
    const { container } = renderSearchInput();

    await user.click(screen.getByRole('textbox'));
    expect(container.querySelector('.fr-icon-search-line')).not.toBeInTheDocument();

    await user.tab();
    expect(container.querySelector('.fr-icon-search-line')).toBeInTheDocument();
  });

  it('should notify each typed value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderSearchInput({ onChange });

    await user.type(screen.getByRole('textbox'), 'ab');

    expect(onChange).toHaveBeenNthCalledWith(1, 'a');
    expect(onChange).toHaveBeenNthCalledWith(2, 'b');
  });

  it('should replace the magnifier with a clear button once there is text', () => {
    const { container } = renderSearchInput({ value: 'tarabeux' });

    expect(container.querySelector('.fr-icon-search-line')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Effacer la recherche' })).toBeInTheDocument();
  });

  it('should clear the search on clear button click', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    renderSearchInput({ onClear, value: 'tarabeux' });

    await user.click(screen.getByRole('button', { name: 'Effacer la recherche' }));

    expect(onClear).toHaveBeenCalledOnce();
  });

  it('should have no accessibility violations', async () => {
    const { container } = renderSearchInput({ value: 'tarabeux' });

    expect(await axe(container)).toHaveNoViolations();
  });
});
