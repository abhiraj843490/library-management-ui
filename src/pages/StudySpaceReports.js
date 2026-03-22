import React, { useState, useMemo } from 'react';
import '../styles/StudySpaceReports.css';

const StudySpaceReports = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSpaceId, setSelectedSpaceId] = useState('');

  // Mock data - Replace with API calls
  const studySpaces = [
    { 
      id: 1, 
      spaceName: 'Boys Seating - Individual Seats', 
      side: 'BOYS', 
      capacity: 50,
      sections: [
        { section: 'Regular', seats: 35 },
        { section: 'Silent', seats: 15 }
      ]
    },
    { 
      id: 2, 
      spaceName: 'Girls Seating - Individual Seats', 
      side: 'GIRLS', 
      capacity: 50,
      sections: [
        { section: 'Regular', seats: 35 },
        { section: 'Silent', seats: 15 }
      ]
    },
  ];

  const occupancyData = [
    { spaceId: 1, spaceName: 'Boys - Regular Section', section: 'Regular', slot: 'Morning 1', booked: 28, capacity: 35, occupancy: 80 },
    { spaceId: 1, spaceName: 'Boys - Silent Section', section: 'Silent', slot: 'Morning 1', booked: 12, capacity: 15, occupancy: 80 },
    { spaceId: 2, spaceName: 'Girls - Regular Section', section: 'Regular', slot: 'Morning 1', booked: 30, capacity: 35, occupancy: 86 },
    { spaceId: 2, spaceName: 'Girls - Silent Section', section: 'Silent', slot: 'Morning 1', booked: 14, capacity: 15, occupancy: 93 },
    { spaceId: 1, spaceName: 'Boys - Regular Section', section: 'Regular', slot: 'Night 1', booked: 32, capacity: 35, occupancy: 91 },
    { spaceId: 1, spaceName: 'Boys - Silent Section', section: 'Silent', slot: 'Night 1', booked: 15, capacity: 15, occupancy: 100 },
    { spaceId: 2, spaceName: 'Girls - Regular Section', section: 'Regular', slot: 'Night 1', booked: 33, capacity: 35, occupancy: 94 },
    { spaceId: 2, spaceName: 'Girls - Silent Section', section: 'Silent', slot: 'Night 1', booked: 15, capacity: 15, occupancy: 100 },
  ];

  const spaceRatings = [
    { spaceId: 1, spaceName: 'Boys Seating', totalBookings: 450, activeStudents: 48, avgUtilization: 85 },
    { spaceId: 2, spaceName: 'Girls Seating', totalBookings: 475, activeStudents: 47, avgUtilization: 89 },
  ];

  const timeSlotPopularity = [
    { slot: 'Morning 1 (9-11 AM)', bookings: 58, avgOccupancy: 83, type: 'DAY' },
    { slot: 'Morning 2 (11 AM-1 PM)', bookings: 62, avgOccupancy: 85, type: 'DAY' },
    { slot: 'Afternoon 1 (1-3 PM)', bookings: 48, avgOccupancy: 72, type: 'DAY' },
    { slot: 'Afternoon 2 (3-5 PM)', bookings: 55, avgOccupancy: 79, type: 'DAY' },
    { slot: 'Evening 1 (5-7 PM)', bookings: 68, avgOccupancy: 92, type: 'DAY' },
    { slot: 'Night 1 (7-9 PM)', bookings: 80, avgOccupancy: 97, type: 'NIGHT' },
    { slot: 'Night 2 (9-11 PM)', bookings: 75, avgOccupancy: 94, type: 'NIGHT' },
  ];

  const sideStats = useMemo(() => {
    return [
      { side: 'BOYS', totalSeats: 50, regularSeats: 35, silentSeats: 15 },
      { side: 'GIRLS', totalSeats: 50, regularSeats: 35, silentSeats: 15 },
    ];
  }, []);

  const overallStats = useMemo(() => {
    const totalBookings = occupancyData.reduce((sum, item) => sum + item.booked, 0);
    const totalCapacity = occupancyData.reduce((sum, item) => sum + item.capacity, 0);
    const avgOccupancy = totalCapacity > 0 ? Math.round((totalBookings / totalCapacity) * 100) : 0;
    
    return {
      totalSeats: 100, // 50 Boys + 50 Girls
      totalBookingsToday: totalBookings,
      peakOccupancy: Math.max(...occupancyData.map(d => d.occupancy), 0),
      averageOccupancy: avgOccupancy,
    };
  }, []);

  const getOccupancyBar = (occupancy) => {
    let color = '#4caf50'; // Green
    if (occupancy >= 80) color = '#ff6b6b'; // Red
    else if (occupancy >= 60) color = '#ffa500'; // Orange
    
    return (
      <div className="occupancy-bar">
        <div 
          className="occupancy-fill" 
          style={{ width: `${occupancy}%`, backgroundColor: color }}
        />
        <span className="occupancy-label">{occupancy}%</span>
      </div>
    );
  };

  return (
    <div className="study-space-reports-container">
      <div className="page-header">
        <h1>📊 Study Space Analytics & Reports</h1>
        <p>Monitor usage, occupancy, and feedback across all study facilities</p>
      </div>

      {/* Overall Statistics */}
      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-icon">�</div>
          <div className="stat-content">
            <div className="stat-value">{overallStats.totalSeats}</div>
            <div className="stat-label">Total Individual Seats</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-value">{overallStats.totalBookingsToday}</div>
            <div className="stat-label">Seats Occupied Today</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-value">{overallStats.averageOccupancy}%</div>
            <div className="stat-label">Avg. Seat Utilization</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <div className="stat-value">{overallStats.peakOccupancy}%</div>
            <div className="stat-label">Peak Occupancy</div>
          </div>
        </div>
      </div>

      {/* Time Slot Popularity */}
      <div className="report-section">
        <h2>⏰ Time Slot Popularity & Occupancy</h2>
        <div className="time-slot-chart">
          {timeSlotPopularity.map((slot, idx) => (
            <div key={idx} className="time-slot-row">
              <div className="slot-info">
                <div className="slot-name">{slot.slot}</div>
                <div className="slot-type">{slot.type}</div>
              </div>
              <div className="slot-stats">
                <span className="bookings">{slot.bookings} bookings</span>
              </div>
              <div className="slot-occupancy">
                {getOccupancyBar(slot.avgOccupancy)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seating Side Statistics */}
      <div className="report-section">
        <h2>👥 Seating Allocation (Boys & Girls)</h2>
        <div className="room-type-grid">
          {sideStats.map((sideStat, idx) => (
            <div key={idx} className="room-type-card">
              <h3>{sideStat.side} Side</h3>
              <div className="type-detail">
                <span className="label">Total Seats:</span>
                <span className="value">{sideStat.totalSeats}</span>
              </div>
              <div className="type-detail">
                <span className="label">Regular Section:</span>
                <span className="value">{sideStat.regularSeats} seats</span>
              </div>
              <div className="type-detail">
                <span className="label">Silent Section:</span>
                <span className="value">{sideStat.silentSeats} seats</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Space Ratings & Reviews */}
      <div className="report-section">
        <h2>📊 Seating Utilization & Active Students</h2>
        <div className="ratings-table">
          <div className="table-header">
            <div className="col-space">Seating Side</div>
            <div className="col-rating">Monthly Bookings</div>
            <div className="col-bookings">Active Students</div>
            <div className="col-reviews">Avg. Utilization</div>
          </div>
          {spaceRatings.map((space, idx) => (
            <div key={idx} className="table-row">
              <div className="col-space">
                <span className="space-name">{space.spaceName}</span>
              </div>
              <div className="col-rating">
                <span className="booking-count">{space.totalBookings}</span>
              </div>
              <div className="col-bookings">
                <span className="booking-count">{space.activeStudents}</span>
              </div>
              <div className="col-reviews">
                <span className="review-count">{space.avgUtilization}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Occupancy (Sections) */}
      <div className="report-section">
        <h2>📍 Today's Seat Availability (by Section)</h2>
        <div className="occupancy-list">
          {occupancyData.map((data, idx) => (
            <div key={idx} className="occupancy-item">
              <div className="occupancy-header">
                <h4>{data.spaceName} ({data.section})</h4>
                <span className="slot-badge">{data.slot}</span>
              </div>
              <div className="occupancy-stats">
                <span className="booked-count">{data.booked}/{data.capacity} seats occupied</span>
                {getOccupancyBar(data.occupancy)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Trends */}
      <div className="report-section">
        <h2>📊 Peak Hour Analysis</h2>
        <div className="trends-info">
          <div className="trend-card">
            <h3>⏰ Busiest Time Slots</h3>
            <p>Highest seat occupancy during:</p>
            <ul>
              <li><strong>Day Peak: </strong>Evening 1 (5-7 PM) - 92% occupied</li>
              <li><strong>Night Peak: </strong>Night 1 (7-9 PM) - 97% occupied</li>
            </ul>
          </div>
          
          <div className="trend-card">
            <h3>👥 Seating Preference</h3>
            <ol>
              <li>Girls Side - 89% average utilization</li>
              <li>Boys Side - 85% average utilization</li>
              <li>Silent sections more preferred during exam season</li>
            </ol>
          </div>
          
          <div className="trend-card">
            <h3>💡 Recommendations</h3>
            <ul>
              <li>Evening slots require early booking - consider dynamic pricing</li>
              <li>Monitor silent section saturation - plan for expansion</li>
              <li>Track student check-in/check-out for attendance validation</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Feedback Summary */}
      <div className="report-section">
        <h2>💬 Monthly Subscription & Check-in Status</h2>
        <div className="feedback-summary">
          <div className="feedback-stat">
            <div className="feedback-icon">💳</div>
            <div className="feedback-content">
              <h4>Fee Collection</h4>
              <p className="rating">₹8,500/month</p>
              <p className="description">Average subscription per student</p>
            </div>
          </div>
          
          <div className="feedback-stat">
            <div className="feedback-icon">✅</div>
            <div className="feedback-content">
              <h4>Active Subscriptions</h4>
              <p className="rating">95 Students</p>
              <p className="description">Currently enrolled (Boys: 48, Girls: 47)</p>
            </div>
          </div>
          
          <div className="feedback-stat">
            <div className="feedback-icon">🕐</div>
            <div className="feedback-content">
              <h4>Auto Check-In/Out</h4>
              <p>100% Accuracy</p>
              <p className="description">System-based time tracking enabled</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="action-items">
        <h3>✅ Administrative Tasks</h3>
        <ul>
          <li>Send renewal reminders to 5 students with expiring subscriptions (next 7 days)</li>
          <li>Onboard 3 new students waiting for seat allocation</li>
          <li>Process fee payments from 8 students with pending invoices</li>
          <li>Review silent section - exceeding 90% capacity during peak hours</li>
        </ul>
      </div>
    </div>
  );
};

export default StudySpaceReports;
