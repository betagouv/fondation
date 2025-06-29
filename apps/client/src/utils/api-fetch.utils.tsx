export const apiFetch = async (url: string, options: RequestInit) => {
  const response = await fetch(`/api${url}`, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
};
