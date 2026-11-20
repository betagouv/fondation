import { describe, expect, it } from 'vitest';

import { greetingAt } from './greeting.utils';

describe('greetingAt', () => {
  it.each([
    [5, 59, 'EVENING'],
    [6, 0, 'DAY'],
    [17, 59, 'DAY'],
    [18, 0, 'EVENING'],
    [0, 0, 'EVENING'],
  ])('greets at %i:%i with %s', (hours, minutes, greeting) => {
    expect(greetingAt(new Date(2026, 10, 20, hours, minutes))).toBe(greeting);
  });
});
