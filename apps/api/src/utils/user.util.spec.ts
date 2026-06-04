import { initials } from './user.util';

describe('initials', () => {
  it.each`
    firstName         | lastName      | expected
    ${'Michel'}       | ${'Foucault'} | ${'MF'}
    ${'Jean-Jacques'} | ${'Rousseau'} | ${'JJR'}
    ${'Françoise'}    | ${'Héritier'} | ${'FH'}
  `('initials($firstName $lastName) -> $initials', ({ firstName, lastName, expected }) => {
    expect(initials({ firstName, lastName })).toBe(expected);
  });
});
