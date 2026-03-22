import React, { useState, useEffect } from 'react';
import '../styles/StudySpaces.css';

const StudySpaces = () => {
  const [studySpaces, setStudySpaces] = useState([]);
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
  const [currentMemberId] = useState(1); // Replace with actual member ID from auth

  // Initialize data
  useEffect(() => {
    loadStudySpaces();
    loadTimeSlots();
    setSelectedDate(new Date().toISOString().split('T')[0]);
  }, []);

  const loadStudySpaces = async () => {
    try {
      setLoading(true);
      // Replace with actual API call
      const mockSpaces = [
        { id: 1, spaceName: 'Private Pod A1', capacity: 1, roomType: 'INDIVIDUAL', location: 'First Floor', floor: 1, facilities: ['WiFi', 'Power Socket', 'AC'] },
        { id: 2, spaceName: 'Private Pod A2', capacity: 1, roomType: 'INDIVIDUAL', location: 'First Floor', floor: 1, facilities: ['WiFi', 'Power Socket', 'AC'] },
        { id: 3, spaceName: 'Study Room B1', capacity: 4, roomType: 'GROUP', location: 'First Floor', floor: 1, facilities: ['WiFi', 'Whiteboard', 'Projector', 'AC'] },
        { id: 4, spaceName: 'Study Room B2', capacity: 4, roomType: 'DISCUSSION', location: 'First Floor', floor: 1, facilities: ['WiFi', 'Whiteboard', 'AC'] },
        { id: 5, spaceName: 'Silent Zone C1', capacity: 8, roomType: 'SILENT', location: 'Second Floor', floor: 2, facilities: ['WiFi', 'AC'] },
        { id: 6, spaceName: 'Group Study D1', capacity: 6, roomType: 'GROUP', location: 'Second Floor', floor: 2, facilities: ['WiFi', 'Whiteboard', 'Projector', 'AC'] },
        { id: 7, spaceName: 'Night Lab E1', capacity: 10, roomType: 'GROUP', location: 'Third Floor', floor: 3, facilities: ['WiFi', 'Power Sockets', 'AC', 'Coffee Machine'] },
      ];
      setStudySpaces(mockSpaces);
      setLoading(false);
    } catch (error) {
      console.error('Error loading study spaces:', error);
      setLoading(false);
    }
  };

  const loadTimeSlots = async () => {
    try {
      // Replace with actual API call
      const mockSlots = [
        { id: 1, slotName: 'Morning 1 (9-11 AM)', startTime: '09:00', endTime: '11:00', slotType: 'DAY', durationMinutes: 120 },
        { id: 2, slotName: 'Morning 2 (11 AM-1 PM)', startTime: '11:00', endTime: '13:00', slotType: 'DAY', durationMinutes: 120 },
        { id: 3, slotName: 'Afternoon 1 (1-3 PM)', startTime: '13:00', endTime: '15:00', slotType: 'DAY', durationMinutes: 120 },
        { id: 4, slotName: 'Afternoon 2 (3-5 PM)', startTime: '15:00', endTime: '17:00', slotType: 'DAY', durationMinutes: 120 },
        { id: 5, slotName: 'Evening 1 (5-7 PM)', startTime: '17:00', endTime: '19:00', slotType: 'DAY', durationMinutes: 120 },
        { id: 6, slotName: 'Night 1 (7-9 PM)', startTime: '19:00', endTime: '21:00', slotType: 'NIGHT', durationMinutes: 120 },
        { id: 7, slotName: 'Night 2 (9-11 PM)', startTime: '21:00', endTime: '23:00', slotType: 'NIGHT', durationMinutes: 120 },
      ];
      setTimeSlots(mockSlots);
    } catch (error) {
      console.error('Error loading time slots:', error);
    }
  };

  const searchAvailableSpaces = async () => {
    if (!selectedTimeSlot || !selectedDate) {
      alert('Please select both date and time slot');
      return;
    }

    try {
      setLoading(true);
      // Replace with actual API call: GET /api/study-spaces/available?timeSlotId=&date=
      const filtered = studySpaces.filter(space => {
        if (selectedSpaceType !== 'ALL' && space.roomType !== selectedSpaceType) return false;
        // In real app, would check availability from server
        return true;
      });
      setAvailableSpaces(filtered);
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
    if (bookingType === 'GROUP' && groupSize > selectedSpace.capacity) {
      alert(`Group size cannot exceed space capacity of ${selectedSpace.capacity}`);
      return;
    }

    try {
      setLoading(true);
      // Replace with actual API call: POST /api/study-spaces/bookings
      const bookingData = {
        memberId: currentMemberId,
        studySpaceId: selectedSpace.id,
        timeSlotId: selectedTimeSlot,
        bookingDate: selectedDate,
        bookingType: bookingType,
        groupSize: bookingType === 'SOLO' ? 1 : groupSize,
        notes: notes,
      };

      console.log('Booking submitted:', bookingData);
      alert('Study space booked successfully!');
      setShowBookingForm(false);
      setSelectedSpace(null);
      setBookingType('SOLO');
      setGroupSize(1);
      setNotes('');
      setLoading(false);
    } catch (error) {
      alert('Error booking study space: ' + error.message);
      setLoading(false);
    }
  };

  const getRoomTypeBadgeClass = (roomType) => {
    switch(roomType) {
      case 'INDIVIDUAL': return 'badge-individual';
      case 'GROUP': return 'badge-group';
      case 'SILENT': return 'badge-silent';
      case 'DISCUSSION': return 'badge-discussion';
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
              <option value="INDIVIDUAL">Individual Pods</option>
              <option value="GROUP">Group Study</option>
              <option value="SILENT">Silent Zone</option>
              <option value="DISCUSSION">Discussion Room</option>
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
                {space.facilities.map((facility, idx) => (
                  <span key={idx} className="facility-tag">{facility}</span>
                ))}
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
