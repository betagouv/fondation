import { HttpException } from './http-exception';

export class ValidationError extends Error {}

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
