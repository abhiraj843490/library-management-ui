const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
const STUDY_SPACE_BASE = `${API_BASE_URL}/api/study-spaces`;

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

export const getMemberBookingsApi = (memberId) =>
  request(
    `${STUDY_SPACE_BASE}/members/${encodeURIComponent(memberId)}/bookings`,
    { method: 'GET' },
    'Failed to fetch bookings'
  );

export const getTimeSlotsApi = () =>
  request(
    `${STUDY_SPACE_BASE}/time-slots`,
    { method: 'GET' },
    'Failed to fetch time slots'
  );

export const getAvailableSpacesApi = ({ memberId, bookingDate, timeSlotId, roomType }) => {
  const params = new URLSearchParams({
    memberId: String(memberId),
    bookingDate,
    timeSlotId: String(timeSlotId),
  });
  if (roomType && roomType !== 'ALL') {
    params.set('roomType', roomType);
  }
  return request(
    `${STUDY_SPACE_BASE}/available?${params.toString()}`,
    { method: 'GET' },
    'Failed to fetch available spaces'
  );
};

export const createBookingApi = (payload) =>
  request(
    `${STUDY_SPACE_BASE}/bookings`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    'Failed to create booking'
  );

export const cancelBookingApi = (bookingId, payload) =>
  request(
    `${STUDY_SPACE_BASE}/bookings/${encodeURIComponent(bookingId)}/cancel`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    'Failed to cancel booking'
  );

export const submitBookingFeedbackApi = (bookingId, payload) =>
  request(
    `${STUDY_SPACE_BASE}/bookings/${encodeURIComponent(bookingId)}/feedback`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    'Failed to submit feedback'
  );
