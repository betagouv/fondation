export type RègleSnapshot = {
  group: string;
  name: string;
  value: boolean;
};

export class Règle {
  private constructor(
    private readonly _group: string,
    private readonly _name: string,
    private readonly _value: boolean,
  ) {}

  get group(): string {
    return this._group;
  }

  get name(): string {
    return this._name;
  }

  get value(): boolean {
    return this._value;
  }

  snapshot(): RègleSnapshot {
    return {
      group: this._group,
      name: this._name,
      value: this._value,
    };
  }

  static create(group: string, name: string, value: boolean): Règle {
    return new Règle(group, name, value);
  }

  static fromSnapshot(snapshot: RègleSnapshot): Règle {
    return new Règle(snapshot.group, snapshot.name, snapshot.value);
  }
}
