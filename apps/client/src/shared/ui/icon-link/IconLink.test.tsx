import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';

import { ACTION_ICONS } from '@/constants/icons.constants';

import { IconLink } from './IconLink';

function renderLink(props: { className?: string; disabled?: boolean; newTab?: boolean }) {
  const router = createMemoryRouter([
    {
      path: '/',
      element: (
        <IconLink {...props} iconId={ACTION_ICONS.edit} label="Modifier le document" to="/documents/1" />
      ),
    },
    { path: '/documents/1', element: <p>Document</p> },
  ]);

  return render(<RouterProvider router={router} />);
}

describe('IconLink', () => {
  it('should link to its destination', () => {
    renderLink({});

    expect(screen.getByRole('link', { name: 'Modifier le document' })).toHaveAttribute(
      'href',
      '/documents/1',
    );
  });

  it('should carry its label in a tooltip', () => {
    renderLink({});

    expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent('Modifier le document');
  });

  it('should open in a new tab without leaking the opener', () => {
    renderLink({ newTab: true });

    const link = screen.getByRole('link', { name: 'Modifier le document' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should keep the class names given on top of its own', () => {
    renderLink({ className: 'ml-auto' });

    expect(screen.getByRole('link', { name: 'Modifier le document' })).toHaveClass('ml-auto', 'fr-btn');
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
