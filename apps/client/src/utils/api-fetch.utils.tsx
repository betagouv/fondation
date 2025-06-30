export const apiFetch = async (url: string, options: RequestInit) => {
  const response = await fetch(`/api${url}`, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  // Check if response has content
  const contentType = response.headers.get('content-type');
  const hasContent = response.headers.get('content-length') !== '0';

  if (contentType && contentType.includes('application/json') && hasContent) {
    return response.json();
  }

  return null;
};
