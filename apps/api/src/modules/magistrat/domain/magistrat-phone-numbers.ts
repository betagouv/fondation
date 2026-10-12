export class MagistratPhoneNumberAdded {
  constructor(
    readonly id: string,
    readonly magistratId: string,
    readonly number: string,
    readonly label: string | null,
    readonly authorId: string,
  ) {}
}

export class MagistratPhoneNumberUpdated {
  constructor(
    readonly id: string,
    readonly number: string,
    readonly label: string | null,
    readonly authorId: string,
  ) {}
}

export class MagistratPhoneNumberDeleted {
  constructor(readonly id: string) {}
}

export type MagistratPhoneNumberEvent =
  | MagistratPhoneNumberAdded
  | MagistratPhoneNumberDeleted
  | MagistratPhoneNumberUpdated;

export class InvalidPhoneNumber extends Error {}
export class InvalidPhoneNumberLabel extends Error {}
export class PhoneNumberAlreadySaved extends Error {}
export class TooManyPhoneNumbers extends Error {}
export class UnknownPhoneNumber extends Error {}

export const MAX_LABEL_LENGTH = 50;
export const MAX_PHONE_NUMBER_DIGITS = 15;
export const MAX_PHONE_NUMBERS = 10;
export const MIN_PHONE_NUMBER_DIGITS = 10;

// a number is saved the way it is compared: digits only, with a leading + for an international one,
// +33 standing for 0 (the LOLFI numbers are compared by the same rule in SQL)
function normalizedPhoneNumber(input: string): string {
  if (!/^\+?[\d\s.-]+$/.test(input.trim())) throw new InvalidPhoneNumber();

  const number = input.replace(/[\s.-]/g, '').replace(/^\+330?/, '0');
  const digits = number.replace('+', '').length;
  if (digits < MIN_PHONE_NUMBER_DIGITS || digits > MAX_PHONE_NUMBER_DIGITS) throw new InvalidPhoneNumber();

  return number;
}

function checkLabel(label: string | null): void {
  if (label && label.length > MAX_LABEL_LENGTH) throw new InvalidPhoneNumberLabel();
}

export class MagistratPhoneNumbers {
  readonly #messages: MagistratPhoneNumberEvent[] = [];

  private constructor(
    readonly magistratId: string,
    private readonly phoneNumbers: { id: string; number: string }[],
  ) {}

  get messages(): readonly MagistratPhoneNumberEvent[] {
    return this.#messages;
  }

  static from(props: {
    magistratId: string;
    phoneNumbers: readonly { id: string; number: string }[];
  }): MagistratPhoneNumbers {
    return new MagistratPhoneNumbers(props.magistratId, [...props.phoneNumbers]);
  }

  add(command: { authorId: string; id: string; label: string | null; number: string }): void {
    const number = normalizedPhoneNumber(command.number);
    checkLabel(command.label);
    if (this.phoneNumbers.some((phoneNumber) => phoneNumber.number === number))
      throw new PhoneNumberAlreadySaved();
    if (this.phoneNumbers.length >= MAX_PHONE_NUMBERS) throw new TooManyPhoneNumbers();

    this.phoneNumbers.push({ id: command.id, number });
    this.#messages.push(
      new MagistratPhoneNumberAdded(command.id, this.magistratId, number, command.label, command.authorId),
    );
  }

  update(command: { authorId: string; id: string; label: string | null; number: string }): void {
    const phoneNumber = this.find(command.id);
    const number = normalizedPhoneNumber(command.number);
    checkLabel(command.label);
    if (this.phoneNumbers.some((other) => other !== phoneNumber && other.number === number))
      throw new PhoneNumberAlreadySaved();

    phoneNumber.number = number;
    this.#messages.push(new MagistratPhoneNumberUpdated(command.id, number, command.label, command.authorId));
  }

  delete(command: { id: string }): void {
    this.phoneNumbers.splice(this.phoneNumbers.indexOf(this.find(command.id)), 1);
    this.#messages.push(new MagistratPhoneNumberDeleted(command.id));
  }

  private find(id: string): { id: string; number: string } {
    const phoneNumber = this.phoneNumbers.find((phoneNumber) => phoneNumber.id === id);
    if (!phoneNumber) throw new UnknownPhoneNumber();
    return phoneNumber;
  }
}
