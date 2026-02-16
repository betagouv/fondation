export class FailedToStartCommand extends Error {
  constructor(
    readonly command: string,
    cause?: unknown,
  ) {
    super(undefined, { cause });
  }
}
