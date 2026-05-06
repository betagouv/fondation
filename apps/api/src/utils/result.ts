export type Result<Success, Failure> =
  | { success: false; errors: Failure[] }
  | { success: true; data: Success[] };

export type DetailedFailure<Failure> = { success: true } | { success: false; errors: Failure[] };

export class ResultBuilder<Success, Failure> {
  #success: boolean = true;
  #data = [] as Success[];
  #errors = [] as Failure[];

  get success(): boolean {
    return this.#success;
  }

  get data(): readonly Success[] {
    return this.#data;
  }

  get errors(): readonly Failure[] {
    return this.#errors;
  }

  fail(error: Failure): void {
    this.#success = false;

    this.#errors.push(error);
  }

  push(data: Success): void {
    if (this.#success) this.#data.push(data);
  }

  build(): Result<Success, Failure> {
    if (this.#success) return { success: true, data: this.#data };

    return { success: false, errors: this.#errors };
  }
}
