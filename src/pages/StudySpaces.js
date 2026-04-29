import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  createBookingApi,
  getAvailableSpacesApi,
  getTimeSlotsApi,
} from '../services/studySpaceApi';
import '../styles/StudySpaces.css';

const extractList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  return [];
};

const StudySpaces = () => {
  const { user } = useAuth();
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [selectedSpaceType, setSelectedSpaceType] = useState('ALL');
  const [availableSpaces, setAvailableSpaces] = useState([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [bookingType, setBookingType] = useState('SOLO');
  const [groupSize, setGroupSize] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const currentMemberId = user?.studentId;

  // Initialize data
  useEffect(() => {
    loadTimeSlots();
    setSelectedDate(new Date().toISOString().split('T')[0]);
  }, []);

  const loadTimeSlots = async () => {
    try {
      const result = await getTimeSlotsApi();
      setTimeSlots(extractList(result));
    } catch (error) {
      console.error('Error loading time slots:', error);
    }
  };

  const searchAvailableSpaces = async () => {
    if (!selectedTimeSlot || !selectedDate) {
      alert('Please select both date and time slot');
      return;
    }
    if (!currentMemberId) {
      alert('Unable to identify logged-in student');
      return;
    }

    try {
      setLoading(true);
      const result = await getAvailableSpacesApi({
        memberId: currentMemberId,
        bookingDate: selectedDate,
        timeSlotId: selectedTimeSlot,
        roomType: selectedSpaceType,
      });
      setAvailableSpaces(extractList(result));
      setLoading(false);
    } catch (error) {
      console.error('Error searching available spaces:', error);
      setLoading(false);
    }
  };

  const handleBookSpace = (space) => {
    setSelectedSpace(space);
    setShowBookingForm(true);
  };

  const submitBooking = async () => {
    if (!currentMemberId) {
      alert('Unable to identify logged-in student');
      return;
    }
    if (bookingType === 'GROUP' && groupSize > selectedSpace.capacity) {
      alert(`Group size cannot exceed space capacity of ${selectedSpace.capacity}`);
      return;
    }

    try {
      setLoading(true);
      await createBookingApi({
        memberId: currentMemberId,
        studySpaceId: selectedSpace.id,
        timeSlotId: Number(selectedTimeSlot),
        bookingDate: selectedDate,
        bookingType,
        groupSize: bookingType === 'SOLO' ? 1 : groupSize,
        notes,
      });

      alert('Study space booked successfully!');
      setShowBookingForm(false);
      setSelectedSpace(null);
      setBookingType('SOLO');
      setGroupSize(1);
      setNotes('');
      await searchAvailableSpaces();
      setLoading(false);
    } catch (error) {
      alert('Error booking study space: ' + error.message);
      setLoading(false);
    }
  };

  const getRoomTypeBadgeClass = (roomType) => {
    switch(roomType) {
      case 'REGULAR': return 'badge-group';
      case 'SILENT': return 'badge-silent';
      default: return '';
    }
  };

  return (
    <div className="study-spaces-container">
      <div className="page-header">
        <h1>📚 Study Spaces & Time Slot Booking</h1>
        <p>Reserve your study space for focused learning</p>
      </div>

      {/* Search Filters */}
      <div className="search-section">
        <div className="filter-row">
          <div className="filter-group">
            <label>Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="filter-group">
            <label>Select Time Slot</label>
            <select value={selectedTimeSlot} onChange={(e) => setSelectedTimeSlot(e.target.value)}>
              <option value="">Choose a slot...</option>
              {timeSlots.map(slot => (
                <option key={slot.id} value={slot.id}>
                  {slot.slotName} ({slot.slotType})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Room Type</label>
            <select value={selectedSpaceType} onChange={(e) => setSelectedSpaceType(e.target.value)}>
              <option value="ALL">All Types</option>
              <option value="REGULAR">Regular</option>
              <option value="SILENT">Silent Zone</option>
            </select>
          </div>

          <button className="primary-button search-btn" onClick={searchAvailableSpaces} disabled={loading}>
            {loading ? 'Searching...' : 'Search Spaces'}
          </button>
        </div>
      </div>

      {/* Available Spaces Grid */}
      <div className="spaces-grid">
        {availableSpaces.length === 0 && selectedTimeSlot && !loading && (
          <div className="empty-state">
            <p>No spaces available for selected criteria. Try a different time slot or date.</p>
          </div>
        )}

        {availableSpaces.map(space => (
          <div key={space.id} className="space-card">
            <div className="space-header">
              <h3>{space.spaceName}</h3>
              <span className={`room-badge ${getRoomTypeBadgeClass(space.roomType)}`}>
                {space.roomType}
              </span>
            </div>

            <div className="space-details">
              <div className="detail-item">
                <span className="label">Capacity:</span>
                <span className="value">{space.capacity} person(s)</span>
              </div>
              <div className="detail-item">
                <span className="label">Location:</span>
                <span className="value">{space.location} (Floor {space.floor})</span>
              </div>
            </div>

            <div className="facilities">
              <strong>Facilities:</strong>
              <div className="facility-list">
                <span className="facility-tag">{space.roomType}</span>
                <span className="facility-tag">Seat</span>
              </div>
            </div>

            <button 
              className="primary-button"
              onClick={() => handleBookSpace(space)}
              disabled={loading}
            >
              Book This Space
            </button>
          </div>
        ))}
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && selectedSpace && (
        <div className="modal-overlay" onClick={() => setShowBookingForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Book: {selectedSpace.spaceName}</h2>
              <button className="close-btn" onClick={() => setShowBookingForm(false)}>×</button>
            </div>

            <div className="booking-form">
              <div className="form-group">
                <label>Booking Type</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input 
                      type="radio" 
                      value="SOLO" 
                      checked={bookingType === 'SOLO'}
                      onChange={(e) => {
                        setBookingType(e.target.value);
                        setGroupSize(1);
                      }}
                    />
                    Solo Study
                  </label>
                  <label className="radio-label">
                    <input 
                      type="radio" 
                      value="GROUP" 
                      checked={bookingType === 'GROUP'}
                      onChange={(e) => setBookingType(e.target.value)}
                      disabled={selectedSpace.capacity < 2}
                    />
                    Group Study
                  </label>
                </div>
              </div>

              {bookingType === 'GROUP' && (
                <div className="form-group">
                  <label>Number of People (Max {selectedSpace.capacity})</label>
                  <input 
                    type="number" 
                    min="2" 
                    max={selectedSpace.capacity}
                    value={groupSize}
                    onChange={(e) => setGroupSize(parseInt(e.target.value))}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Additional Notes (Optional)</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requests or notes..."
                  rows="3"
                />
              </div>

              <div className="booking-summary">
                <h4>Booking Summary</h4>
                <div className="summary-item">
                  <span>Space:</span>
                  <strong>{selectedSpace.spaceName}</strong>
                </div>
                <div className="summary-item">
                  <span>Date:</span>
                  <strong>{new Date(selectedDate).toLocaleDateString()}</strong>
                </div>
                <div className="summary-item">
                  <span>Time:</span>
                  <strong>{timeSlots.find(s => s.id === parseInt(selectedTimeSlot))?.slotName}</strong>
                </div>
                <div className="summary-item">
                  <span>Type:</span>
                  <strong>{bookingType === 'SOLO' ? 'Solo' : `Group (${groupSize} people)`}</strong>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  className="secondary-button" 
                  onClick={() => setShowBookingForm(false)}
                >
                  Cancel
                </button>
                <button 
                  className="primary-button" 
                  onClick={submitBooking}
                  disabled={loading}
                >
                  {loading ? 'Confirming...' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudySpaces;
