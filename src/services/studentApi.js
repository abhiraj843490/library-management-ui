const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
const STUDENTS_ENDPOINT = `${API_BASE_URL}/api/students`;
const SEATS_ENDPOINT = `${API_BASE_URL}/api/seats`;

const buildHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const parseJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch (_) {
    return null;
  }
};

const request = async (url, options = {}, fallbackMessage = 'Request failed') => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...buildHeaders(),
      ...(options.headers || {}),
    },
  });

  const result = await parseJsonSafely(response);

  if (!response.ok) {
    const message = result?.message || `${fallbackMessage} (${response.status})`;
    throw new Error(message);
  }

  return result;
};

export const getStudentsApi = () => request(STUDENTS_ENDPOINT, { method: 'GET' }, 'Failed to fetch students');
export const getStudentByIdApi = (studentId) =>
  request(`${STUDENTS_ENDPOINT}/${studentId}`, { method: 'GET' }, 'Failed to fetch student details');

export const createStudentApi = (payload) =>
  request(
    STUDENTS_ENDPOINT,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    'Enrollment failed'
  );

export const updateStudentApi = (studentId, payload) =>
  request(
    `${STUDENTS_ENDPOINT}/${studentId}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    'Update failed'
  );

export const getSeatsApi = () => request(SEATS_ENDPOINT, { method: 'GET' }, 'Failed to fetch seats');
