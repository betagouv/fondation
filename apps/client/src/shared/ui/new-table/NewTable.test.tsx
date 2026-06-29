import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { DemoTable } from './NewTable.fixtures';

describe('NewTable', () => {
  it('only renders a fraction of the rows (virtualization)', () => {
    render(<DemoTable rowCount={1000} />);

    const renderedRows = screen.getAllByRole('row').filter((row) => row.hasAttribute('aria-rowindex'));
    expect(renderedRows.length).toBeLessThan(1000);
  });

  it('exposes the real total through aria-rowcount, not the rendered count', () => {
    render(<DemoTable rowCount={1000} />);

    expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '1000');
  });

  it('selects the whole dataset with select-all, not just the visible rows', async () => {
    const user = userEvent.setup();
    render(<DemoTable rowCount={1000} withSelection />);

    await user.click(screen.getByLabelText('Sélectionner toutes les lignes'));

    expect(screen.getByLabelText('Désélectionner toutes les lignes')).toBeInTheDocument();
  });

  it('toggles the sort state of a column when its header is clicked', async () => {
    const user = userEvent.setup();
    render(<DemoTable enableSorting rowCount={50} />);

    const firstNameHeader = screen.getByRole('columnheader', { name: /Prénom/ });
    expect(firstNameHeader).toHaveAttribute('aria-sort', 'none');

    await user.click(screen.getByRole('button', { name: /Prénom/ }));
    expect(firstNameHeader).toHaveAttribute('aria-sort', 'ascending');

    await user.click(screen.getByRole('button', { name: /Prénom/ }));
    expect(firstNameHeader).toHaveAttribute('aria-sort', 'descending');
  });

  it('renders the empty label when there is no data', () => {
    render(<DemoTable rowCount={0} />);

    expect(screen.getByText('Aucune donnée')).toBeInTheDocument();
  });

  it('passes basic accessibility checks', async () => {
    const { container } = render(<DemoTable rowCount={50} withSelection />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
