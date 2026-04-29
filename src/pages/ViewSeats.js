import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSeatsApi } from '../services/studentApi';
import '../styles/ViewSeats.css';

const ViewSeats = () => {
  const { user } = useAuth();
  const [seatsData, setSeatsData] = useState({
    BOYS: { Regular: [], Silent: [] },
    GIRLS: { Regular: [], Silent: [] },
  });

  useEffect(() => {
    const loadSeats = async () => {
      try {
        const response = await getSeatsApi();
        const seats = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : [];
        const mapped = {
          BOYS: { Regular: [], Silent: [] },
          GIRLS: { Regular: [], Silent: [] },
        };

        seats.forEach((seat) => {
          const gender = String(seat.gender || '').toUpperCase();
          const section = String(seat.section || '').toUpperCase();
          const status = String(seat.status || '').toUpperCase();

          const sideKey = gender === 'GIRL' || gender === 'GIRLS' ? 'GIRLS' : 'BOYS';
          const sectionKey = section === 'SILENT' ? 'Silent' : 'Regular';
          mapped[sideKey][sectionKey].push({
            seat: seat.seatNumber,
            available: status === 'AVAILABLE',
          });
        });

        Object.values(mapped).forEach((sections) => {
          Object.values(sections).forEach((list) => {
            list.sort((a, b) => a.seat.localeCompare(b.seat, undefined, { numeric: true }));
          });
        });

        setSeatsData(mapped);
      } catch (error) {
        console.error('Error loading seats', error);
      }
    };

    loadSeats();
  }, []);

  const resolveStudentSide = () => {
    const gender = String(user?.gender || '').toUpperCase();
    if (gender.startsWith('GIRL')) return 'GIRLS';
    if (gender.startsWith('BOY')) return 'BOYS';

    const seatNumber = String(user?.seatNumber || '').toUpperCase();
    if (seatNumber.startsWith('G-')) return 'GIRLS';
    if (seatNumber.startsWith('B-')) return 'BOYS';
    return null;
  };

  // Show only the logged-in student's side
  const studentSide = resolveStudentSide();
  const availableSeats = studentSide ? seatsData[studentSide] : { Regular: [], Silent: [] };

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
      occupancyRate: totalSeats > 0 ? Math.round((occupiedCount / totalSeats) * 100) : 0,
    };
  }, [availableSeats]);

  return (
    <div className="view-seats-container">
      <div className="page-header">
        <h1>💺 {studentSide === 'BOYS' ? '👦' : '👧'} {(studentSide || 'STUDENT')} Side - Seating Chart</h1>
        <p>View available seats in your seating section</p>
      </div>
      {!studentSide && (
        <div className="empty-state">
          <p>Unable to determine your side from profile. Please logout and login again.</p>
        </div>
      )}

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
