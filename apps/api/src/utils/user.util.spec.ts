import { fullname, initials } from './user.util';

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

describe('fullname', () => {
  it('capitalizes the first name and uppercases the last name, joined by a non-breaking space', () => {
    expect(fullname({ firstName: 'michel', lastName: 'Foucault' })).toBe('Michel\u00A0FOUCAULT');
  });
});
