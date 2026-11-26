import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MagistratGradeAndPosition } from './MagistratGradeAndPosition';

const LYON = { id: 'TJ  LYON', label: 'Tribunal judiciaire de Lyon' };

describe('MagistratGradeAndPosition', () => {
  it.each([
    [
      'his grade and his position',
      { function: { id: 'JUGE', label: 'Juge' }, jurisdiction: LYON },
      'G1',
      'G1 - Juge Tribunal judiciaire de Lyon',
    ],
    ['his grade alone without a position', null, 'HH', 'HH'],
    [
      'the code of a court without a label',
      { function: null, jurisdiction: { id: 'TJ  X', label: null } },
      'G2',
      'G2 - TJ  X',
    ],
  ])('shows %s', (_, currentPosition, grade, text) => {
    const { container } = render(
      <MagistratGradeAndPosition currentPosition={currentPosition} grade={grade} />,
    );

    expect(container.textContent).toBe(text);
  });
});
