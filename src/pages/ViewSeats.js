import React, { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/ViewSeats.css';

const ViewSeats = () => {
  const { user } = useAuth();

  // Generate seats for both sides
  const allAvailableSeats = useMemo(() => {
    const seats = {
      BOYS: {
        Regular: Array.from({ length: 35 }, (_, i) => ({ seat: `B-${i + 1}`, available: Math.random() > 0.6 })),
        Silent: Array.from({ length: 15 }, (_, i) => ({ seat: `B-${35 + i + 1}`, available: Math.random() > 0.7 })),
      },
      GIRLS: {
        Regular: Array.from({ length: 35 }, (_, i) => ({ seat: `G-${i + 1}`, available: Math.random() > 0.5 })),
        Silent: Array.from({ length: 15 }, (_, i) => ({ seat: `G-${35 + i + 1}`, available: Math.random() > 0.65 })),
      },
    };
    return seats;
  }, []);

  // Get only the student's side
  const studentSide = user?.side || 'BOYS';
  const availableSeats = allAvailableSeats[studentSide];

  // Calculate statistics
  const stats = useMemo(() => {
    let totalSeats = 0;
    let availableCount = 0;
    let occupiedCount = 0;

    Object.values(availableSeats).forEach(section => {
      section.forEach(seat => {
        totalSeats++;
        if (seat.available) {
          availableCount++;
        } else {
          occupiedCount++;
        }
      });
    });

    return {
      totalSeats,
      availableCount,
      occupiedCount,
      occupancyRate: Math.round((occupiedCount / totalSeats) * 100),
    };
  }, [availableSeats]);

  return (
    <div className="view-seats-container">
      <div className="page-header">
        <h1>💺 {studentSide === 'BOYS' ? '👦' : '👧'} {studentSide} Side - Seating Chart</h1>
        <p>View available seats in your seating section</p>
      </div>

      {/* Statistics */}
      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-icon">🪑</div>
          <div className="stat-content">
            <div className="stat-value">{stats.availableCount}</div>
            <div className="stat-label">Available Seats</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.occupiedCount}</div>
            <div className="stat-label">Occupied Seats</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{stats.occupancyRate}%</div>
            <div className="stat-label">Occupancy Rate</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalSeats}</div>
            <div className="stat-label">Total Seats</div>
          </div>
        </div>
      </div>

      {/* Seating Chart */}
      <div className="seats-grid-container">
        {Object.entries(availableSeats).map(([section, seats]) => (
          <div key={section} className="section-block">
            <h3>{section === 'Regular' ? '🔊 Regular Section' : '🔇 Silent Section'}</h3>
            <p className="section-description">
              {section === 'Regular' ? 'Moderate noise allowed • Collaborative environment' : 'Quiet environment • Individual focus'}
            </p>
            
            <div className="seats-display">
              {seats.map((seatObj, idx) => (
                <div
                  key={idx}
                  className={`seat-indicator ${seatObj.available ? 'available' : 'occupied'}`}
                  title={`Seat ${seatObj.seat}: ${seatObj.available ? 'Available' : 'Occupied'}`}
                >
                  <span className="seat-number">{seatObj.seat}</span>
                  <span className="seat-status">{seatObj.available ? '○' : '●'}</span>
                </div>
              ))}
            </div>

            <div className="section-stats">
              <div className="stat-item">
                <span className="stat-label">Available:</span>
                <span className="stat-value available">{seats.filter(s => s.available).length}/{seats.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Occupancy:</span>
                <span className="stat-value occupied">
                  {Math.round((seats.filter(s => !s.available).length / seats.length) * 100)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="legend-section">
        <h3>Legend</h3>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-indicator available">○</span>
            <span>Available - Ready to book</span>
          </div>
          <div className="legend-item">
            <span className="legend-indicator occupied">●</span>
            <span>Occupied - Currently in use</span>
          </div>
        </div>
      </div>

      {/* Info Box */}
      
    </div>
  );
};

export default ViewSeats;
