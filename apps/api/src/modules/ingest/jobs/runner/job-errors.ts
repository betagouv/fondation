export class FailedToStartJob extends Error {
  constructor(
    readonly jobId: number,
    options: { cause?: unknown; message?: string } = {},
  ) {
    super(options.message, { cause: options.cause });
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
