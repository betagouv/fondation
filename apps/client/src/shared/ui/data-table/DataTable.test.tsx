import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { DemoTable } from './DataTable.fixtures';

describe('DataTable', () => {
  it('exposes the real total through aria-rowcount, not the rendered count', () => {
    render(<DemoTable rowCount={1000} />);

    expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '1000');
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

  it('only renders a fraction of the rows (virtualization)', () => {
    render(<DemoTable rowCount={1000} />);

    const renderedRows = screen.getAllByRole('row').filter((row) => row.hasAttribute('aria-rowindex'));
    expect(renderedRows.length).toBeLessThan(1000);
  });

  it('passes basic accessibility checks', async () => {
    const { container } = render(<DemoTable rowCount={50} withSelection />);

    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders the empty label when there is no data', () => {
    render(<DemoTable rowCount={0} />);

    expect(screen.getByText('Aucune donnée')).toBeInTheDocument();
  });

  it('offers to try again when the rows could not be loaded instead of saying there are none', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<DemoTable loadError={{ isNextPage: false, isRetrying: false, onRetry }} rowCount={0} />);

    expect(screen.getByRole('status')).toHaveTextContent("La liste n'a pas pu être chargée.");
    expect(screen.queryByText('Aucune donnée')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Réessayer' }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('keeps the rows already loaded when the next ones could not be', () => {
    render(
      <DemoTable
        loadError={{ isNextPage: true, isRetrying: false, onRetry: vi.fn() }}
        rowCount={3}
        unvirtualized
      />,
    );

    expect(screen.getAllByRole('row')).toHaveLength(5);
    expect(screen.getByRole('status')).toHaveTextContent("La suite de la liste n'a pas pu être chargée.");
  });

  it('keeps the focus on the retry button while retrying, without retrying twice', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<DemoTable loadError={{ isNextPage: false, isRetrying: true, onRetry }} rowCount={0} />);
    const retry = screen.getByRole('button', { name: 'Réessayer' });

    await user.click(retry);

    expect(retry).toHaveFocus();
    expect(retry).toHaveAttribute('aria-disabled', 'true');
    expect(onRetry).not.toHaveBeenCalled();
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
});
