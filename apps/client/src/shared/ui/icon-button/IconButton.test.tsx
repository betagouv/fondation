import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ACTION_ICONS } from '@/constants/icons.constants';

import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('should name the button after its label, without the browser own tooltip', () => {
    render(<IconButton iconId={ACTION_ICONS.delete} label="Supprimer le fichier" onClick={() => {}} />);

    const button = screen.getByRole('button', { name: 'Supprimer le fichier' });
    expect(button).not.toHaveAttribute('title');
    expect(button).toHaveClass(ACTION_ICONS.delete);
  });

  it('should not submit the form it belongs to', () => {
    const onSubmit = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <IconButton iconId={ACTION_ICONS.delete} label="Supprimer le fichier" onClick={() => {}} />
      </form>,
    );

    expect(screen.getByRole('button', { name: 'Supprimer le fichier' })).toHaveAttribute('type', 'button');
  });

  it('should carry its label in a tooltip', () => {
    render(<IconButton iconId={ACTION_ICONS.download} label="Télécharger le fichier" onClick={() => {}} />);

    expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent('Télécharger le fichier');
  });

  it('should keep the class names given on top of its own', () => {
    render(
      <IconButton
        className="ml-auto"
        iconId={ACTION_ICONS.download}
        label="Télécharger le fichier"
        onClick={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: 'Télécharger le fichier' })).toHaveClass('ml-auto', 'fr-btn');
  });

  it('should call back on click', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<IconButton iconId={ACTION_ICONS.download} label="Télécharger le fichier" onClick={onClick} />);

    await user.click(screen.getByRole('button', { name: 'Télécharger le fichier' }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
