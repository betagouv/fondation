export async function apiFetch<T = unknown>(url: string, options: RequestInit): Promise<T | null> {
  const baseUrl = import.meta.env.PROD ? import.meta.env.VITE_API_URL : '';
  const fullUrl = `${baseUrl}/api${url}`;

  const response = await fetch(fullUrl, {
    ...options,
    credentials: 'include'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw Object.assign(new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`), {
      status: response.status,
      ...errorData
    });
  }

  const contentType = response.headers.get('content-type');
  const hasContent = response.headers.get('content-length') !== '0';

  if (contentType && contentType.includes('application/json') && hasContent)
    return (await response.json()) as T;

  return null;
}
