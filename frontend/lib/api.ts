const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

function fullUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE_URL}${path}`;
}

export async function apiRequest(path: string, options: RequestInit = {}) {
  const url = fullUrl(path);

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {};
  } catch (error) {
    console.error('API request failed:', {
      url,
      apiBaseUrl: API_BASE_URL,
      error,
    });
    throw error;
  }
}

export async function apiPost<T>(path: string, body?: object | FormData): Promise<T> {
  const isFormData = body instanceof FormData;
  const options: RequestInit = {
    method: 'POST',
    headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
    body: isFormData ? body : JSON.stringify(body ?? {}),
  };

  return apiRequest(path, options) as Promise<T>;
}

export async function apiGet<T>(path: string): Promise<T> {
  return apiRequest(path) as Promise<T>;
}

export { API_BASE_URL };
