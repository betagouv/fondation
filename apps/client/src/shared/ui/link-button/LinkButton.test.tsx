import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { LinkButton } from './LinkButton';

describe('LinkButton', () => {
  it('should look like a link carrying its icon, without submitting the form it belongs to', () => {
    render(
      <form onSubmit={() => {}}>
        <LinkButton iconId="fr-icon-file-text-line" onClick={() => {}}>
          NDR 23/09/2026
        </LinkButton>
      </form>,
    );

    const button = screen.getByRole('button', { name: 'NDR 23/09/2026' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('fr-link', 'fr-icon-file-text-line');
  });

  it('should keep the class names given on top of its own', () => {
    render(
      <LinkButton className="truncate" iconId="fr-icon-file-text-line" onClick={() => {}}>
        NDR 23/09/2026
      </LinkButton>,
    );

    expect(screen.getByRole('button', { name: 'NDR 23/09/2026' })).toHaveClass('truncate', 'fr-link');
  });

  it('should call back on click', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <LinkButton iconId="fr-icon-file-text-line" onClick={onClick}>
        NDR 23/09/2026
      </LinkButton>,
    );

    await user.click(screen.getByRole('button', { name: 'NDR 23/09/2026' }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
