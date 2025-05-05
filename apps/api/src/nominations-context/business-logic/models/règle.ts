import { z } from 'zod';

export type RègleSnapshot = {
  group: string;
  name: string;
  value: boolean;
};

export class Règle {
  private _value: boolean;

  private constructor(
    private readonly _group: string,
    private readonly _name: string,
    value: boolean,
  ) {
    this.setValue(value);
  }

  àJourDesRèglesModifiées(nouvellesRègles: Règle[]) {
    const règleChangée = nouvellesRègles.find(
      (nouvellesRègle) =>
        nouvellesRègle.group === this.group &&
        nouvellesRègle.name === this.name,
    );
    if (règleChangée) this.changeValue(règleChangée.value);
  }

  changeValue(value: boolean) {
    this.setValue(value);
  }

  get group(): string {
    return this._group;
  }

  get name(): string {
    return this._name;
  }

  get value(): boolean {
    return this._value;
  }
  setValue(value: boolean) {
    this._value = z.boolean().parse(value);
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
