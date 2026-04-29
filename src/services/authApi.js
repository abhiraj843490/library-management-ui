const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
const AUTH_ENDPOINT = `${API_BASE_URL}/api/auth`;

const parseJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch (_) {
    return null;
  }
};

export const loginApi = async (email, password) => {
  const response = await fetch(`${AUTH_ENDPOINT}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const result = await parseJsonSafely(response);

  if (!response.ok) {
    const message = result?.message || 'Login failed';
    throw new Error(message);
  }

  return result;
};
