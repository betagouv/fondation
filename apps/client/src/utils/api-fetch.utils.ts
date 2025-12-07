export class HttpException extends Error {
  readonly statusCode: number;
  readonly response: Response;

  constructor(props: { response: Response; message: string | undefined }) {
    super(props.message || `HTTP Request failed with status ${props.response.status}`);

    this.statusCode = props.response.status;
    this.response = props.response;
  }
}

export async function apiFetch<T = unknown>(url: string, options: RequestInit): Promise<T | null> {
  const baseUrl = import.meta.env.PROD ? import.meta.env.VITE_API_URL : '';
  const fullUrl = `${baseUrl}/api${url}`;

  const response = await fetch(fullUrl, {
    ...options,
    credentials: 'include'
  });

  if (!response.ok) {
    const message = await response.json().then(
      (x) =>
        typeof x === 'object' && x !== null && 'message' in x && typeof x.message === 'string'
          ? x.message
          : undefined,
      () => undefined
    );

    throw new HttpException({ response, message });
  }

  return response.json().catch(() => null);
}
