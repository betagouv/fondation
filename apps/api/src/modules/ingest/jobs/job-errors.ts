export class FailedToStartJob extends Error {
  constructor(
    readonly jobId: number,
    cause?: unknown,
  ) {
    super(undefined, { cause });
  }
}

export class FailedToCancelJob extends Error {
  constructor(
    readonly jobId: number,
    cause?: unknown,
  ) {
    super(undefined, { cause });
  }
}
