export abstract class HttpException extends Error {
  abstract readonly response: Response;
  abstract readonly statusCode: number;
}

class HttpExceptionImpl extends HttpException {
  readonly statusCode: number;

  constructor(readonly response: Response) {
    super(`HTTP Request failed with status ${response.status}`);

    this.statusCode = response.status;
  }
}

class UnauthorizedHttpException extends HttpExceptionImpl {}

export function httpAssert(response: Response): Response {
  if (response.ok) return response;

  const Exception = response.status == 401 ? UnauthorizedHttpException : HttpExceptionImpl;
  throw new Exception(response);
}
