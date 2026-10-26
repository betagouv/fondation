import { HttpException } from './http-exception';

export class ValidationError extends Error {
  static messageOf(error: Error | null): string | null {
    return error instanceof ValidationError ? error.message : null;
  }

  static isOtherFailure(error: Error | null): boolean {
    return !!error && !(error instanceof ValidationError);
  }
}

/** a 400 or a 409 that names what the user must fix */
export async function withValidationError<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (error instanceof HttpException && [400, 409].includes(error.statusCode)) {
      const body = await error.response.json().catch(() => null);
      if (body?.validationError) throw new ValidationError(String(body.validationError));
    }

    throw error;
  }
}
