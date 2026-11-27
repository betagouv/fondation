export class AttachedMagistratEmailAlreadyDetached extends Error {}

export class AttachedMagistratEmailDetached {
  constructor(readonly id: string) {}
}

export type AttachedMagistratEmailEvent = AttachedMagistratEmailDetached;

export class AttachedMagistratEmail {
  readonly #messages: AttachedMagistratEmailEvent[] = [];

  private constructor(readonly id: string) {}

  get messages(): readonly AttachedMagistratEmailEvent[] {
    return this.#messages;
  }

  static from(props: { id: string }): AttachedMagistratEmail {
    return new AttachedMagistratEmail(props.id);
  }

  detach(): void {
    this.#messages.push(new AttachedMagistratEmailDetached(this.id));
  }
}
