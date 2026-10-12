import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { Card } from './Card';

describe('Card', () => {
  it('should display title and description', () => {
    render(<Card title="Mon titre" description="Ma description" linkProps={{ to: '#' }} />);

    expect(screen.getByText('Mon titre')).toBeInTheDocument();
    expect(screen.getByText('Ma description')).toBeInTheDocument();
  });

  it('should pass basic accessibility', async () => {
    const { container } = render(
      <Card title="Mon titre" description="Ma description" linkProps={{ to: '#' }} />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
