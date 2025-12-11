export class HttpException extends Error {
  readonly statusCode: number;
  readonly response: Response;

  constructor(props: { response: Response }) {
    super(`HTTP Request failed with status ${props.response.status}`);

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
    throw new HttpException({ response });
  }

  return response.json().catch(() => null);
}
