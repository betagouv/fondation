import { DAYS } from '../../../utils/time';

const KEPT_FOR = 30 * DAYS;

export function normalizedEmail(email: string): string {
  return email.toLowerCase();
}

export function oldestKeptAttemptAt(now: Date): Date {
  return new Date(now.getTime() - KEPT_FOR);
}

export class InactiveMagistrat extends Error {}

export class UnrecognisedMagistratEmailAlreadyHandled extends Error {}

export class UnrecognisedMagistratEmailAttached {
  constructor(
    readonly authorId: string,
    readonly email: string,
    readonly id: string,
    readonly magistratId: string,
  ) {}
}

export class UnrecognisedMagistratEmailDismissed {
  constructor(readonly id: string) {}
}

export type UnrecognisedMagistratEmailEvent =
  | UnrecognisedMagistratEmailAttached
  | UnrecognisedMagistratEmailDismissed;

export class UnrecognisedMagistratEmail {
  readonly #messages: UnrecognisedMagistratEmailEvent[] = [];

  private constructor(
    readonly id: string,
    private readonly email: string,
  ) {}

  get messages(): readonly UnrecognisedMagistratEmailEvent[] {
    return this.#messages;
  }

  static from(props: { email: string; id: string }): UnrecognisedMagistratEmail {
    return new UnrecognisedMagistratEmail(props.id, props.email);
  }

  attachTo(command: { authorId: string; magistrat: { id: string; status: 'ACTIVE' | 'INACTIVE' } }): void {
    if (command.magistrat.status !== 'ACTIVE') throw new InactiveMagistrat();
    this.#messages.push(
      new UnrecognisedMagistratEmailAttached(command.authorId, this.email, this.id, command.magistrat.id),
    );
  }

  dismiss(): void {
    this.#messages.push(new UnrecognisedMagistratEmailDismissed(this.id));
  }
}
