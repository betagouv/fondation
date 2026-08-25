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

  it('leaves the locked rows out of a shift range', async () => {
    const user = userEvent.setup();
    render(<DemoTable lockedRowIds={['person-1']} rowCount={5} unvirtualized withSelection />);

    await user.click(screen.getByLabelText('Sélectionner la ligne 1'));
    await user.keyboard('{Shift>}');
    await user.click(screen.getByLabelText('Sélectionner la ligne 3'));
    await user.keyboard('{/Shift}');

    expect(screen.getByLabelText('Sélectionner la ligne 1')).toBeChecked();
    expect(screen.getByLabelText('Sélectionner la ligne 3')).toBeChecked();
    expect(screen.getByLabelText('Ligne 2 : hors périmètre')).not.toBeChecked();
  });

  it('locks out the rows the table refuses to select, and says why for each of them', () => {
    render(<DemoTable lockedRowIds={['person-0', 'person-1']} rowCount={5} unvirtualized withSelection />);

    expect(screen.getByLabelText('Ligne 1 : déjà traitée')).toBeDisabled();
    expect(screen.getByLabelText('Ligne 2 : hors périmètre')).toBeDisabled();
    expect(screen.getByLabelText('Sélectionner la ligne 3')).toBeEnabled();
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
