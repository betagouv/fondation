import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { Card } from './Card';

describe('Card', () => {
  it('affiche le titre et la description', () => {
    render(<Card title="Mon titre" description="Ma description" linkProps={{ to: '#' }} />);

    expect(screen.getByText('Mon titre')).toBeInTheDocument();
    expect(screen.getByText('Ma description')).toBeInTheDocument();
  });

  it("ne présente pas de violation d'accessibilité", async () => {
    const { container } = render(
      <Card title="Mon titre" description="Ma description" linkProps={{ to: '#' }} />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
