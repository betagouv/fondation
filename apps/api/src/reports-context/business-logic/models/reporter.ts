export class Reporter {
  constructor(private readonly _reporterId: string) {}

  public get reporterId(): string {
    return this._reporterId;
  }
}
