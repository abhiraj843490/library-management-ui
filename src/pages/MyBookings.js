import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { extractStudentsFromResponse } from '../interfaces/studentResponse';
import { getStudentsApi } from '../services/studentApi';
import {
  cancelBookingApi,
  getMemberBookingsApi,
  submitBookingFeedbackApi,
} from '../services/studySpaceApi';
import '../styles/MyBookings.css';

const extractBookingsFromResponse = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  return [];
};

const normalizeBooking = (booking = {}) => {
  const status = String(booking.status || 'CONFIRMED').toUpperCase();
  const bookingDate = booking.bookingDate || booking.date || booking.startDate || booking.startTime || '';
  const canBeCancelled =
    booking.canBeCancelled !== undefined
      ? Boolean(booking.canBeCancelled)
      : status === 'CONFIRMED' && Boolean(bookingDate) && new Date(bookingDate) > new Date();

  return {
    id: booking.id || booking.bookingId || booking.referenceId,
    spaceName:
      booking.spaceName ||
      booking.studySpaceName ||
      booking.studySpace?.spaceName ||
      booking.space?.spaceName ||
      'Study Space',
    slotName:
      booking.slotName ||
      booking.timeSlotName ||
      booking.timeSlot?.slotName ||
      booking.slot?.slotName ||
      '-',
    bookingDate,
    status,
    bookingType: String(booking.bookingType || 'SOLO').toUpperCase(),
    groupSize: Number(booking.groupSize || 1),
    averageRating:
      booking.averageRating !== undefined && booking.averageRating !== null
        ? Number(booking.averageRating)
        : booking.feedbackRating !== undefined && booking.feedbackRating !== null
          ? Number(booking.feedbackRating)
          : null,
    canBeCancelled,
  };
};

const parseNumericId = (value) => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [resolvingMemberId, setResolvingMemberId] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [feedbackData, setFeedbackData] = useState({
    rating: 5,
    cleanlinessRating: 5,
    noiseLevel: 'QUIET',
    comment: '',
  });
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [currentMemberId, setCurrentMemberId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const resolveMemberId = async () => {
      const directId = parseNumericId(user?.studentId) || parseNumericId(user?.id);
      if (directId) {
        if (isMounted) {
          setCurrentMemberId(directId);
          setLoadError('');
        }
        return;
      }

      if (!user) {
        if (isMounted) setCurrentMemberId(null);
        return;
      }

      try {
        setResolvingMemberId(true);
        const result = await getStudentsApi();
        const students = extractStudentsFromResponse(result);
        const authUserId = String(user?.id || '').trim();
        const authUserCode = String(user?.userCode || user?.studentCode || '').trim();
        const authEmail = String(user?.email || '').trim().toLowerCase();

        const matchedStudent = students.find((student) => {
          const studentId = String(student?.studentId ?? student?.id ?? '').trim();
          const studentUserCode = String(student?.userCode || student?.studentCode || '').trim();
          const studentEmail = String(student?.email || '').trim().toLowerCase();

          return (
            (authUserId && studentId && studentId === authUserId) ||
            (authUserCode && studentUserCode && studentUserCode === authUserCode) ||
            (authEmail && studentEmail && studentEmail === authEmail)
          );
        });

        const resolvedId = parseNumericId(matchedStudent?.studentId ?? matchedStudent?.id);
        if (isMounted) {
          setCurrentMemberId(resolvedId);
          if (!resolvedId) {
            setLoadError('Unable to map logged-in user to backend student id for bookings.');
          } else {
            setLoadError('');
          }
        }
      } catch (_) {
        if (isMounted) {
          setCurrentMemberId(null);
          setLoadError('Unable to resolve backend student id. Please verify student records.');
        }
      } finally {
        if (isMounted) {
          setResolvingMemberId(false);
        }
      }
    };

    resolveMemberId();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const loadUserBookings = async () => {
    if (!currentMemberId) {
      setBookings([]);
      return;
    }

    try {
      setLoading(true);
      setLoadError('');
      const result = await getMemberBookingsApi(currentMemberId);
      const list = extractBookingsFromResponse(result).map(normalizeBooking);
      setBookings(list);
    } catch (error) {
      setLoadError(error.message || 'Error loading bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resolvingMemberId) return;
    loadUserBookings();
  }, [currentMemberId, resolvingMemberId]);

  const filteredBookings = useMemo(() => {
    if (filterStatus === 'ALL') return bookings;
    if (filterStatus === 'UPCOMING') {
      return bookings.filter((b) => b.status === 'CONFIRMED' && new Date(b.bookingDate) > new Date());
    }
    return bookings.filter((b) => b.status === filterStatus);
  }, [bookings, filterStatus]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'badge-confirmed';
      case 'COMPLETED':
        return 'badge-completed';
      case 'CANCELLED':
        return 'badge-cancelled';
      case 'NO_SHOW':
        return 'badge-no-show';
      default:
        return '';
    }
  };

  const handleCancelBooking = (booking) => {
    if (!booking.canBeCancelled) {
      alert('This booking cannot be cancelled. Cancellations must be made at least 2 hours before the slot starts.');
      return;
    }
    setBookingToCancel(booking);
    setShowCancelDialog(true);
  };

  const submitCancellation = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a cancellation reason');
      return;
    }
    if (!bookingToCancel?.id) return;

    try {
      setLoading(true);
      await cancelBookingApi(bookingToCancel.id, { reason: cancelReason.trim() });

      alert('Booking cancelled successfully!');
      setShowCancelDialog(false);
      setCancelReason('');
      setBookingToCancel(null);
      await loadUserBookings();
    } catch (error) {
      alert('Error cancelling booking: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveFeedback = (booking) => {
    if (booking.status !== 'COMPLETED') {
      alert('Feedback can only be given for completed bookings');
      return;
    }
    setSelectedBooking(booking);
    setShowFeedbackForm(true);
  };

  const submitFeedback = async () => {
    if (!selectedBooking?.id) return;

    try {
      setLoading(true);
      await submitBookingFeedbackApi(selectedBooking.id, {
        rating: feedbackData.rating,
        cleanlinessRating: feedbackData.cleanlinessRating,
        noiseLevel: feedbackData.noiseLevel,
        comment: feedbackData.comment,
      });

      alert('Thank you for your feedback!');
      setShowFeedbackForm(false);
      setSelectedBooking(null);
      setFeedbackData({
        rating: 5,
        cleanlinessRating: 5,
        noiseLevel: 'QUIET',
        comment: '',
      });
      await loadUserBookings();
    } catch (error) {
      alert('Error submitting feedback: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const getTimeUntilBooking = (bookingDate) => {
    if (!bookingDate) return '-';
    const now = new Date();
    const booking = new Date(bookingDate);
    if (Number.isNaN(booking.getTime())) return '-';

    const diff = booking - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return 'Past';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days away`;
  };

  return (
    <div className="my-bookings-container">
      <div className="page-header">
        <h1>My Study Space Bookings</h1>
        <p>View and manage your study space reservations</p>
        {loadError && (
          <p>
            {loadError} <button onClick={loadUserBookings}>Retry</button>
          </p>
        )}
      </div>

      <div className="filter-section">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filterStatus === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterStatus('ALL')}
          >
            All Bookings ({bookings.length})
          </button>
          <button
            className={`filter-tab ${filterStatus === 'UPCOMING' ? 'active' : ''}`}
            onClick={() => setFilterStatus('UPCOMING')}
          >
            Upcoming
          </button>
          <button
            className={`filter-tab ${filterStatus === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setFilterStatus('COMPLETED')}
          >
            Completed
          </button>
          <button
            className={`filter-tab ${filterStatus === 'CANCELLED' ? 'active' : ''}`}
            onClick={() => setFilterStatus('CANCELLED')}
          >
            Cancelled
          </button>
        </div>
      </div>

      <div className="bookings-list">
        {loading ? (
          <div className="loading">Loading your bookings...</div>
        ) : resolvingMemberId ? (
          <div className="loading">Resolving your student profile...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="empty-state">
            <p>No bookings found for this category.</p>
            <p className="hint">Start by booking a study space from the "Study Spaces" section.</p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div key={booking.id || `${booking.spaceName}-${booking.bookingDate}`} className="booking-card">
              <div className="booking-header">
                <div className="booking-title">
                  <h3>{booking.spaceName}</h3>
                  <span className={`status-badge ${getStatusBadgeClass(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>
                <div className="booking-time-info">
                  <span className="time-until">{getTimeUntilBooking(booking.bookingDate)}</span>
                </div>
              </div>

              <div className="booking-details">
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Date</span>
                    <span className="value">
                      {booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : '-'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Time Slot</span>
                    <span className="value">{booking.slotName || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Booking Type</span>
                    <span className="value">
                      {booking.bookingType === 'SOLO' ? 'Solo' : `Group (${booking.groupSize} people)`}
                    </span>
                  </div>
                  {booking.averageRating !== null && (
                    <div className="detail-item">
                      <span className="label">Your Rating</span>
                      <span className="value rating">{booking.averageRating}/5.0</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="booking-actions">
                {booking.canBeCancelled && (
                  <button className="secondary-button danger" onClick={() => handleCancelBooking(booking)}>
                    Cancel Booking
                  </button>
                )}
                {booking.status === 'COMPLETED' && booking.averageRating === null && (
                  <button className="primary-button" onClick={() => handleLeaveFeedback(booking)}>
                    Leave Feedback
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showFeedbackForm && selectedBooking && (
        <div className="modal-overlay" onClick={() => setShowFeedbackForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Feedback for {selectedBooking.spaceName}</h2>
              <button className="close-btn" onClick={() => setShowFeedbackForm(false)}>×</button>
            </div>

            <div className="feedback-form">
              <div className="form-group">
                <label>Overall Rating *</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className={`star ${star <= feedbackData.rating ? 'filled' : ''}`}
                      onClick={() => setFeedbackData({ ...feedbackData, rating: star })}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Cleanliness Rating *</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className={`star ${star <= feedbackData.cleanlinessRating ? 'filled' : ''}`}
                      onClick={() => setFeedbackData({ ...feedbackData, cleanlinessRating: star })}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Noise Level</label>
                <select
                  value={feedbackData.noiseLevel}
                  onChange={(e) => setFeedbackData({ ...feedbackData, noiseLevel: e.target.value })}
                >
                  <option value="QUIET">Quiet</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="NOISY">Noisy</option>
                </select>
              </div>

              <div className="form-group">
                <label>Additional Comments</label>
                <textarea
                  value={feedbackData.comment}
                  onChange={(e) => setFeedbackData({ ...feedbackData, comment: e.target.value })}
                  placeholder="Share your experience..."
                  rows="4"
                />
              </div>

              <div className="modal-actions">
                <button className="secondary-button" onClick={() => setShowFeedbackForm(false)}>
                  Skip
                </button>
                <button className="primary-button" onClick={submitFeedback} disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCancelDialog && bookingToCancel && (
        <div className="modal-overlay" onClick={() => setShowCancelDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Cancel Booking</h2>
              <button className="close-btn" onClick={() => setShowCancelDialog(false)}>×</button>
            </div>

            <div className="cancellation-form">
              <div className="warning-box">
                <p>
                  You are about to cancel your booking for <strong>{bookingToCancel.spaceName}</strong> on{' '}
                  <strong>{bookingToCancel.bookingDate ? new Date(bookingToCancel.bookingDate).toLocaleDateString() : '-'}</strong>
                </p>
              </div>

              <div className="form-group">
                <label>Reason for Cancellation *</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please let us know why you're cancelling..."
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button className="secondary-button" onClick={() => setShowCancelDialog(false)}>
                  Keep Booking
                </button>
                <button className="danger-button" onClick={submitCancellation} disabled={loading}>
                  {loading ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
