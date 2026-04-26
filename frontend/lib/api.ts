const API_BASE_URL = '/backend-api';

export async function apiPost<T>(path: string, body?: object, isFormData = false): Promise<T> {
  const options: RequestInit = {
    method: 'POST',
    headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
    body: isFormData ? (body as FormData) : JSON.stringify(body ?? {}),
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch {
    throw new Error('Cannot reach backend through the Next.js proxy. Make sure FastAPI is running on port 8000 and restart the frontend dev server.');
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const errorText = errorBody ? '' : await response.text().catch(() => '');
    throw new Error(errorBody?.detail || errorText || `API error: ${response.status}`);
  }
  return response.json();
}

export async function apiGet<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`);
  } catch {
    throw new Error('Cannot reach backend through the Next.js proxy. Make sure FastAPI is running on port 8000 and restart the frontend dev server.');
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const errorText = errorBody ? '' : await response.text().catch(() => '');
    throw new Error(errorBody?.detail || errorText || `API error: ${response.status}`);
  }
  return response.json();
}
