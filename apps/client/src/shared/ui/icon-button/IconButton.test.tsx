import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { ACTION_ICONS } from '@/constants/icons.constants';

import { IconButton, IconLink } from './IconButton';

function renderLink(props: { disabled?: boolean }) {
  const router = createMemoryRouter([
    {
      path: '/',
      element: (
        <IconLink
          disabled={props.disabled}
          iconId={ACTION_ICONS.edit}
          label="Modifier le document"
          to="/documents/1"
        />
      ),
    },
    { path: '/documents/1', element: <p>Document</p> },
  ]);

  return render(<RouterProvider router={router} />);
}

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

  it('should call back on click', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<IconButton iconId={ACTION_ICONS.download} label="Télécharger le fichier" onClick={onClick} />);

    await user.click(screen.getByRole('button', { name: 'Télécharger le fichier' }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe('IconLink', () => {
  it('should link to its destination', () => {
    renderLink({});

    expect(screen.getByRole('link', { name: 'Modifier le document' })).toHaveAttribute(
      'href',
      '/documents/1',
    );
  });

  it('should turn into a disabled control rather than an inert link', async () => {
    const user = userEvent.setup();
    renderLink({ disabled: true });

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Modifier le document' });
    expect(button).toBeDisabled();

    await user.click(button);
    expect(screen.queryByText('Document')).not.toBeInTheDocument();
  });
});
