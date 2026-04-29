const toUiGender = (value) => {
  const normalized = String(value || '').toUpperCase();
  if (normalized === 'BOY' || normalized === 'BOYS') return 'BOYS';
  if (normalized === 'GIRL' || normalized === 'GIRLS') return 'GIRLS';
  return 'BOYS';
};

const toUiSection = (value) => {
  const normalized = String(value || '').toUpperCase();
  if (normalized === 'SILENT') return 'Silent';
  return 'Regular';
};

const toUiStatus = (value, fallback) => {
  const normalized = String(value || '').toUpperCase();
  if (normalized === 'ACTIVE') return 'Active';
  if (normalized === 'INACTIVE') return 'Inactive';
  if (normalized === 'PAID') return 'Paid';
  if (normalized === 'PENDING') return 'Pending';
  return fallback;
};

const toApiGender = (value) => {
  const normalized = String(value || '').toUpperCase();
  if (normalized === 'BOYS' || normalized === 'BOY') return 'BOY';
  if (normalized === 'GIRLS' || normalized === 'GIRL') return 'GIRL';
  return 'BOY';
};

const toApiSection = (value) => {
  const normalized = String(value || '').toUpperCase();
  if (normalized === 'SILENT') return 'SILENT';
  return 'REGULAR';
};

const toApiSubscriptionStatus = (value) => {
  const normalized = String(value || '').toUpperCase();
  return normalized === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
};

const toApiFeeStatus = (value) => {
  const normalized = String(value || '').toUpperCase();
  return normalized === 'PAID' ? 'PAID' : 'PENDING';
};

export const normalizeStudent = (student = {}) => ({
  studentId: student.studentId || student.id || null,
  userCode: student.userCode || student.studentCode || '',
  id: student.userCode || student.studentCode || student.id || student.studentId || '',
  name: student.name || '',
  email: student.email || '',
  phone: student.phone || '',
  gender: toUiGender(student.gender),
  seatSection: toUiSection(student.seatSection),
  seatNumber: student.seatNumber || '-',
  enrollmentDate: student.enrollmentDate || '',
  subscriptionStatus: toUiStatus(student.subscriptionStatus, student.active ? 'Active' : 'Inactive'),
  subscriptionExpiry: student.subscriptionExpiry || '',
  monthlyFee: Number(student.monthlyFee || 0),
  feeStatus: toUiStatus(student.feeStatus, 'Pending'),
  currentCheckIn: student.currentCheckIn,
  currentCheckOut: student.currentCheckOut,
  active: student.active !== undefined ? Boolean(student.active) : true,
  checkedIn: student.checkedIn !== undefined ? Boolean(student.checkedIn) : Boolean(student.currentCheckIn && !student.currentCheckOut),
});


export const extractStudentsFromResponse = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.content)) {
    return response.data.content;
  }

  return [];
};

export const toApiStudentUpdatePayload = (student = {}, overrides = {}) => {
  const merged = { ...student, ...overrides };

  return {
    name: merged.name,
    email: merged.email,
    phone: merged.phone,
    gender: toApiGender(merged.gender),
    seatSection: toApiSection(merged.seatSection),
    seatNumber: merged.seatNumber,
    subscriptionStatus: toApiSubscriptionStatus(merged.subscriptionStatus),
    subscriptionExpiry: merged.subscriptionExpiry,
    feeStatus: toApiFeeStatus(merged.feeStatus),
    monthlyFee: Number(merged.monthlyFee || 0),
    checkedIn: Boolean(merged.checkedIn),
    active: merged.active !== undefined ? Boolean(merged.active) : true,
  };
};

export const toApiStudentCreatePayload = (formData = {}, seatNumber) => ({
  name: formData.name,
  email: formData.email,
  phone: formData.phone,
  gender: toApiGender(formData.gender),
  seatSection: toApiSection(formData.seatSection),
  ...(seatNumber ? { seatNumber } : {}),
});
