import React, { useState, useEffect } from 'react';
import '../styles/MyBookings.css';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [currentMemberId] = useState(1); // Replace with actual member ID from auth
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

  useEffect(() => {
    loadUserBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, filterStatus]);

  const loadUserBookings = async () => {
    try {
      setLoading(true);
      // Replace with actual API call: GET /api/study-spaces/members/{memberId}/bookings
      const mockBookings = [
        {
          id: 1,
          spaceName: 'Study Room B1',
          slotName: 'Morning 1 (9-11 AM)',
          bookingDate: '2026-03-25',
          status: 'COMPLETED',
          bookingType: 'SOLO',
          groupSize: 1,
          spaceName: 'Study Room B1',
          averageRating: 4.5,
          canBeCancelled: false,
        },
        {
          id: 2,
          spaceName: 'Private Pod A1',
          slotName: 'Afternoon 1 (1-3 PM)',
          bookingDate: '2026-03-26',
          status: 'CONFIRMED',
          bookingType: 'SOLO',
          groupSize: 1,
          averageRating: null,
          canBeCancelled: true,
        },
        {
          id: 3,
          spaceName: 'Group Study D1',
          slotName: 'Night 1 (7-9 PM)',
          bookingDate: '2026-03-27',
          status: 'CONFIRMED',
          bookingType: 'GROUP',
          groupSize: 3,
          averageRating: null,
          canBeCancelled: true,
        },
        {
          id: 4,
          spaceName: 'Silent Zone C1',
          slotName: 'Morning 2 (11 AM-1 PM)',
          bookingDate: '2026-03-22',
          status: 'CANCELLED',
          bookingType: 'SOLO',
          groupSize: 1,
          averageRating: null,
          canBeCancelled: false,
        },
      ];
      setBookings(mockBookings);
      setLoading(false);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setLoading(false);
    }
  };

  const filterBookings = () => {
    if (filterStatus === 'ALL') {
      setFilteredBookings(bookings);
    } else if (filterStatus === 'UPCOMING') {
      setFilteredBookings(bookings.filter(b => b.status === 'CONFIRMED' && new Date(b.bookingDate) > new Date()));
    } else if (filterStatus === 'PAST') {
      setFilteredBookings(bookings.filter(b => b.status === 'COMPLETED' && new Date(b.bookingDate) <= new Date()));
    } else {
      setFilteredBookings(bookings.filter(b => b.status === filterStatus));
    }
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'CONFIRMED': return 'badge-confirmed';
      case 'COMPLETED': return 'badge-completed';
      case 'CANCELLED': return 'badge-cancelled';
      case 'NO_SHOW': return 'badge-no-show';
      default: return '';
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

    try {
      setLoading(true);
      // Replace with actual API call: PUT /api/study-spaces/bookings/{id}/cancel
      const cancellationData = {
        reason: cancelReason,
      };

      console.log('Cancellation submitted:', cancellationData);
      
      // Update booking status locally
      setBookings(bookings.map(b => 
        b.id === bookingToCancel.id 
          ? { ...b, status: 'CANCELLED', canBeCancelled: false }
          : b
      ));

      alert('Booking cancelled successfully!');
      setShowCancelDialog(false);
      setCancelReason('');
      setBookingToCancel(null);
      setLoading(false);
    } catch (error) {
      alert('Error cancelling booking: ' + error.message);
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
    try {
      setLoading(true);
      // Replace with actual API call: POST /api/study-spaces/bookings/{id}/feedback
      const feedbackPayload = {
        rating: feedbackData.rating,
        cleanlinessRating: feedbackData.cleanlinessRating,
        noiseLevel: feedbackData.noiseLevel,
        comment: feedbackData.comment,
      };

      console.log('Feedback submitted:', feedbackPayload);
      alert('Thank you for your feedback!');
      setShowFeedbackForm(false);
      setSelectedBooking(null);
      setFeedbackData({
        rating: 5,
        cleanlinessRating: 5,
        noiseLevel: 'QUIET',
        comment: '',
      });
      setLoading(false);
    } catch (error) {
      alert('Error submitting feedback: ' + error.message);
      setLoading(false);
    }
  };

  const getTimeUntilBooking = (bookingDate) => {
    const now = new Date();
    const booking = new Date(bookingDate);
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
        <h1>📅 My Study Space Bookings</h1>
        <p>View and manage your study space reservations</p>
      </div>

      {/* Filter Section */}
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

      {/* Bookings List */}
      <div className="bookings-list">
        {loading ? (
          <div className="loading">Loading your bookings...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="empty-state">
            <p>No bookings found for this category.</p>
            <p className="hint">Start by booking a study space from the "Study Spaces" section.</p>
          </div>
        ) : (
          filteredBookings.map(booking => (
            <div key={booking.id} className="booking-card">
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
                    <span className="label">📅 Date</span>
                    <span className="value">{new Date(booking.bookingDate).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">🕐 Time Slot</span>
                    <span className="value">{booking.slotName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">👥 Booking Type</span>
                    <span className="value">
                      {booking.bookingType === 'SOLO' ? 'Solo' : `Group (${booking.groupSize} people)`}
                    </span>
                  </div>
                  {booking.averageRating && (
                    <div className="detail-item">
                      <span className="label">⭐ Your Rating</span>
                      <span className="value rating">{booking.averageRating}/5.0</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="booking-actions">
                {booking.canBeCancelled && (
                  <button 
                    className="secondary-button danger"
                    onClick={() => handleCancelBooking(booking)}
                  >
                    Cancel Booking
                  </button>
                )}
                {booking.status === 'COMPLETED' && !booking.averageRating && (
                  <button 
                    className="primary-button"
                    onClick={() => handleLeaveFeedback(booking)}
                  >
                    Leave Feedback
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Feedback Form Modal */}
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
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      className={`star ${star <= feedbackData.rating ? 'filled' : ''}`}
                      onClick={() => setFeedbackData({...feedbackData, rating: star})}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Cleanliness Rating *</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      className={`star ${star <= feedbackData.cleanlinessRating ? 'filled' : ''}`}
                      onClick={() => setFeedbackData({...feedbackData, cleanlinessRating: star})}
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
                  onChange={(e) => setFeedbackData({...feedbackData, noiseLevel: e.target.value})}
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
                  onChange={(e) => setFeedbackData({...feedbackData, comment: e.target.value})}
                  placeholder="Share your experience..."
                  rows="4"
                />
              </div>

              <div className="modal-actions">
                <button 
                  className="secondary-button" 
                  onClick={() => setShowFeedbackForm(false)}
                >
                  Skip
                </button>
                <button 
                  className="primary-button" 
                  onClick={submitFeedback}
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Dialog */}
      {showCancelDialog && bookingToCancel && (
        <div className="modal-overlay" onClick={() => setShowCancelDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Cancel Booking</h2>
              <button className="close-btn" onClick={() => setShowCancelDialog(false)}>×</button>
            </div>

            <div className="cancellation-form">
              <div className="warning-box">
                <p>⚠️ You are about to cancel your booking for <strong>{bookingToCancel.spaceName}</strong> on <strong>{new Date(bookingToCancel.bookingDate).toLocaleDateString()}</strong></p>
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
                <button 
                  className="secondary-button" 
                  onClick={() => setShowCancelDialog(false)}
                >
                  Keep Booking
                </button>
                <button 
                  className="danger-button" 
                  onClick={submitCancellation}
                  disabled={loading}
                >
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
