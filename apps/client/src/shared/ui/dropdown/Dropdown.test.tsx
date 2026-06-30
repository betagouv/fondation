import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { Dropdown, type DropdownOption } from './Dropdown';

const OPTIONS: DropdownOption[] = [
  { label: 'Rouge', value: 'red' },
  { label: 'Bleu', value: 'blue' },
  { label: 'Vert', value: 'green' },
];

function openTrigger() {
  return screen.getByRole('button', { name: 'Couleur' });
}

describe('Dropdown', () => {
  it('stays collapsed until the trigger is activated', async () => {
    const user = userEvent.setup();
    render(<Dropdown label="Couleur" onSelect={vi.fn()} options={OPTIONS} selected={null} />);

    const trigger = openTrigger();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(OPTIONS.length);
  });

  describe('single selection', () => {
    it('reports the chosen value and collapses', async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();
      render(<Dropdown label="Couleur" onSelect={onSelect} options={OPTIONS} selected={null} />);

      await user.click(openTrigger());
      await user.click(screen.getByRole('option', { name: 'Bleu' }));

      expect(onSelect).toHaveBeenCalledWith('blue');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('clears the value when the active option is reselected', async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();
      render(<Dropdown label="Couleur" onSelect={onSelect} options={OPTIONS} selected="blue" />);

      await user.click(openTrigger());
      await user.click(screen.getByRole('option', { name: 'Bleu' }));

      expect(onSelect).toHaveBeenCalledWith(null);
    });
  });

  describe('multiple selection', () => {
    it('appends the chosen value while staying open', async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();
      render(<Dropdown label="Couleur" multiple onSelect={onSelect} options={OPTIONS} selected={['red']} />);

      await user.click(openTrigger());
      await user.click(screen.getByRole('option', { name: 'Bleu' }));

      expect(onSelect).toHaveBeenCalledWith(['red', 'blue']);
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('removes a value that is already selected', async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();
      render(
        <Dropdown
          label="Couleur"
          multiple
          onSelect={onSelect}
          options={OPTIONS}
          selected={['red', 'blue']}
        />,
      );

      await user.click(openTrigger());
      await user.click(screen.getByRole('option', { name: 'Rouge' }));

      expect(onSelect).toHaveBeenCalledWith(['blue']);
    });

    it('advertises a multiselectable listbox', async () => {
      const user = userEvent.setup();
      render(<Dropdown label="Couleur" multiple onSelect={vi.fn()} options={OPTIONS} selected={[]} />);

      await user.click(openTrigger());

      expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
    });
  });

  describe('trigger display', () => {
    it('shows the placeholder when nothing is selected', () => {
      render(
        <Dropdown
          label="Couleur"
          onSelect={vi.fn()}
          options={OPTIONS}
          placeholder="Sélectionner"
          selected={null}
        />,
      );

      expect(openTrigger()).toHaveTextContent('Sélectionner');
    });

    it('shows the selected labels instead of the placeholder', () => {
      render(
        <Dropdown
          label="Couleur"
          multiple
          onSelect={vi.fn()}
          options={OPTIONS}
          placeholder="Sélectionner"
          selected={['red', 'green']}
        />,
      );

      const trigger = openTrigger();
      expect(trigger).toHaveTextContent('Rouge');
      expect(trigger).toHaveTextContent('Vert');
      expect(trigger).not.toHaveTextContent('Sélectionner');
    });

    it('flags the selected option with aria-selected', async () => {
      const user = userEvent.setup();
      render(<Dropdown label="Couleur" onSelect={vi.fn()} options={OPTIONS} selected="blue" />);

      await user.click(openTrigger());

      expect(screen.getByRole('option', { name: 'Bleu', selected: true })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Rouge', selected: false })).toBeInTheDocument();
    });
  });

  describe('dismissal', () => {
    it('closes on Escape and returns focus to the trigger', async () => {
      const user = userEvent.setup();
      render(<Dropdown label="Couleur" onSelect={vi.fn()} options={OPTIONS} selected={null} />);
      const trigger = openTrigger();

      await user.click(trigger);
      await user.keyboard('{Escape}');

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });

    it('closes when a click lands outside the dropdown', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Dropdown label="Couleur" onSelect={vi.fn()} options={OPTIONS} selected={null} />
          <span data-testid="outside">Ailleurs</span>
        </div>,
      );

      await user.click(openTrigger());
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      await user.click(screen.getByTestId('outside'));

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('passes basic accessibility checks when open', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Dropdown
        label="Couleur"
        onSelect={vi.fn()}
        options={OPTIONS}
        placeholder="Sélectionner"
        selected={null}
      />,
    );

    await user.click(openTrigger());
    await screen.findByRole('listbox');

    expect(await axe(container)).toHaveNoViolations();
  });
});
