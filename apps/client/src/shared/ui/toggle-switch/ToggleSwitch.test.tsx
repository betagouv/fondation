import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { ToggleSwitch } from './ToggleSwitch';

describe('ToggleSwitch', () => {
  it('describes its input by no missing hint', async () => {
    const { container } = render(<ToggleSwitch inputTitle="Mes dossiers" label="Mes dossiers" />);

    expect(screen.getByRole('checkbox')).not.toHaveAttribute('aria-describedby');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('describes its input by its hint when it has one', () => {
    render(<ToggleSwitch helperText="Seulement les vôtres" inputTitle="Mes dossiers" label="Mes dossiers" />);

    expect(screen.getByRole('checkbox')).toHaveAccessibleDescription('Seulement les vôtres');
  });
});
