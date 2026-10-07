import {
  InvalidPhoneNumber,
  InvalidPhoneNumberLabel,
  MagistratPhoneNumberAdded,
  MagistratPhoneNumberDeleted,
  MagistratPhoneNumbers,
  MagistratPhoneNumberUpdated,
  PhoneNumberAlreadySaved,
  TooManyPhoneNumbers,
  UnknownPhoneNumber,
} from './magistrat-phone-numbers';

function phoneNumbers(numbers: readonly string[] = []) {
  return MagistratPhoneNumbers.from({
    magistratId: 'magistrat-1',
    phoneNumbers: numbers.map((number, index) => ({ id: `phone-${index}`, number })),
  });
}

describe('MagistratPhoneNumbers', () => {
  it.each([
    { input: '06 12 34 56 78', saved: '0612345678' },
    { input: '06.12.34.56.78', saved: '0612345678' },
    { input: '06-12-34-56-78', saved: '0612345678' },
    { input: '+33 6 12 34 56 78', saved: '0612345678' },
    { input: '+262 262 12 34 56', saved: '+262262123456' },
  ])('adds $input as $saved', ({ input, saved }) => {
    const magistrat = phoneNumbers();

    magistrat.add({ authorId: 'user-1', id: 'phone-new', label: 'Conjointe', number: input });

    expect(magistrat.messages).toEqual([
      new MagistratPhoneNumberAdded('phone-new', 'magistrat-1', saved, 'Conjointe', 'user-1'),
    ]);
  });

  it.each(['06 12 34 56', '06 12 34 56 7a', '06+12345678', ''])(
    'refuses the invalid number "%s"',
    (number) => {
      expect(() => phoneNumbers().add({ authorId: 'user-1', id: 'phone-new', label: null, number })).toThrow(
        InvalidPhoneNumber,
      );
    },
  );

  it.each([
    {
      action: 'add',
      run: (magistrat: MagistratPhoneNumbers) =>
        magistrat.add({ authorId: 'user-1', id: 'phone-new', label: 'a'.repeat(51), number: '0700000000' }),
    },
    {
      action: 'update',
      run: (magistrat: MagistratPhoneNumbers) =>
        magistrat.update({ authorId: 'user-1', id: 'phone-0', label: 'a'.repeat(51), number: '0612345678' }),
    },
  ])('refuses to $action a label of more than 50 characters', ({ run }) => {
    expect(() => run(phoneNumbers(['0612345678']))).toThrow(InvalidPhoneNumberLabel);
  });

  it('refuses a number already saved, whatever its writing', () => {
    const magistrat = phoneNumbers(['0612345678']);

    expect(() =>
      magistrat.add({ authorId: 'user-1', id: 'phone-new', label: null, number: '+33 6 12 34 56 78' }),
    ).toThrow(PhoneNumberAlreadySaved);
  });

  it('refuses an eleventh number', () => {
    const magistrat = phoneNumbers(Array.from({ length: 10 }, (_, index) => `061234567${index}`));

    expect(() =>
      magistrat.add({ authorId: 'user-1', id: 'phone-new', label: null, number: '0700000000' }),
    ).toThrow(TooManyPhoneNumbers);
  });

  it('updates a number and its label', () => {
    const magistrat = phoneNumbers(['0612345678', '0123456789']);

    magistrat.update({ authorId: 'user-1', id: 'phone-1', label: 'Domicile', number: '01 98 76 54 32' });

    expect(magistrat.messages).toEqual([
      new MagistratPhoneNumberUpdated('phone-1', '0198765432', 'Domicile', 'user-1'),
    ]);
  });

  it('updates the label of a number without changing it', () => {
    const magistrat = phoneNumbers(['0612345678']);

    magistrat.update({ authorId: 'user-1', id: 'phone-0', label: 'Portable', number: '06 12 34 56 78' });

    expect(magistrat.messages).toEqual([
      new MagistratPhoneNumberUpdated('phone-0', '0612345678', 'Portable', 'user-1'),
    ]);
  });

  it('refuses to update a number into another saved one', () => {
    const magistrat = phoneNumbers(['0612345678', '0123456789']);

    expect(() =>
      magistrat.update({ authorId: 'user-1', id: 'phone-1', label: null, number: '06 12 34 56 78' }),
    ).toThrow(PhoneNumberAlreadySaved);
  });

  it('deletes a number', () => {
    const magistrat = phoneNumbers(['0612345678']);

    magistrat.delete({ id: 'phone-0' });

    expect(magistrat.messages).toEqual([new MagistratPhoneNumberDeleted('phone-0')]);
  });

  it.each([
    {
      action: 'update',
      run: (magistrat: MagistratPhoneNumbers) =>
        magistrat.update({ authorId: 'user-1', id: 'other', label: null, number: '0612345678' }),
    },
    { action: 'delete', run: (magistrat: MagistratPhoneNumbers) => magistrat.delete({ id: 'other' }) },
  ])('refuses to $action a number of another magistrat', ({ run }) => {
    expect(() => run(phoneNumbers(['0612345678']))).toThrow(UnknownPhoneNumber);
  });
});
