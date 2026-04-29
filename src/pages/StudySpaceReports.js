import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { extractStudentsFromResponse, normalizeStudent } from '../interfaces/studentResponse';
import { getSeatsApi, getStudentsApi } from '../services/studentApi';
import '../styles/StudySpaceReports.css';

const SLOT_DEFINITIONS = [
  { slot: 'Morning 1 (9-11 AM)', start: 9, end: 11, type: 'DAY' },
  { slot: 'Morning 2 (11 AM-1 PM)', start: 11, end: 13, type: 'DAY' },
  { slot: 'Afternoon 1 (1-3 PM)', start: 13, end: 15, type: 'DAY' },
  { slot: 'Afternoon 2 (3-5 PM)', start: 15, end: 17, type: 'DAY' },
  { slot: 'Evening 1 (5-7 PM)', start: 17, end: 19, type: 'DAY' },
  { slot: 'Night 1 (7-9 PM)', start: 19, end: 21, type: 'NIGHT' },
  { slot: 'Night 2 (9-11 PM)', start: 21, end: 23, type: 'NIGHT' },
];

const normalizeGender = (value) => {
  const normalized = String(value || '').toUpperCase();
  return normalized === 'GIRL' || normalized === 'GIRLS' ? 'GIRLS' : 'BOYS';
};

const normalizeSection = (value) => {
  const normalized = String(value || '').toUpperCase();
  return normalized === 'SILENT' ? 'Silent' : 'Regular';
};

const extractSeatsFromResponse = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  return [];
};

const parseDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  const localized = String(value).replace(',', '');
  const parsedLocalized = new Date(localized);
  if (!Number.isNaN(parsedLocalized.getTime())) return parsedLocalized;

  return null;
};

const isStudentActive = (student) => {
  const statusActive = String(student?.subscriptionStatus || '').toLowerCase() === 'active';
  const flagActive = student?.active !== false;
  return statusActive && flagActive;
};

const StudySpaceReports = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSpaceId, setSelectedSpaceId] = useState('');
  const [students, setStudents] = useState([]);
  const [seats, setSeats] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const fetchReportData = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const [studentsResult, seatsResult] = await Promise.all([getStudentsApi(), getSeatsApi()]);
      const studentsData = extractStudentsFromResponse(studentsResult).map(normalizeStudent);
      const seatsData = extractSeatsFromResponse(seatsResult);
      setStudents(studentsData);
      setSeats(seatsData);
    } catch (error) {
      setLoadError(error.message || 'Unable to load study space reports');
      setStudents([]);
      setSeats([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const studySpaces = useMemo(() => {
    const initial = {
      BOYS: { total: 0, regular: 0, silent: 0 },
      GIRLS: { total: 0, regular: 0, silent: 0 },
    };

    seats.forEach((seat) => {
      const gender = normalizeGender(seat.gender);
      const section = normalizeSection(seat.section || seat.seatSection);
      initial[gender].total += 1;
      if (section === 'Silent') initial[gender].silent += 1;
      else initial[gender].regular += 1;
    });

    return [
      {
        id: 1,
        spaceName: 'Boys Seating - Individual Seats',
        side: 'BOYS',
        capacity: initial.BOYS.total,
        sections: [
          { section: 'Regular', seats: initial.BOYS.regular },
          { section: 'Silent', seats: initial.BOYS.silent },
        ],
      },
      {
        id: 2,
        spaceName: 'Girls Seating - Individual Seats',
        side: 'GIRLS',
        capacity: initial.GIRLS.total,
        sections: [
          { section: 'Regular', seats: initial.GIRLS.regular },
          { section: 'Silent', seats: initial.GIRLS.silent },
        ],
      },
    ];
  }, [seats]);

  const occupancyData = useMemo(() => {
    const grouped = {
      'BOYS-Regular': { spaceId: 1, spaceName: 'Boys Section', section: 'Regular', booked: 0, capacity: 0 },
      'BOYS-Silent': { spaceId: 1, spaceName: 'Boys Section', section: 'Silent', booked: 0, capacity: 0 },
      'GIRLS-Regular': { spaceId: 2, spaceName: 'Girls Section', section: 'Regular', booked: 0, capacity: 0 },
      'GIRLS-Silent': { spaceId: 2, spaceName: 'Girls Section', section: 'Silent', booked: 0, capacity: 0 },
    };

    seats.forEach((seat) => {
      const gender = normalizeGender(seat.gender);
      const section = normalizeSection(seat.section || seat.seatSection);
      const status = String(seat.status || '').toUpperCase();
      const key = `${gender}-${section}`;
      grouped[key].capacity += 1;
      if (status === 'ALLOCATED') grouped[key].booked += 1;
    });

    return Object.values(grouped).map((item) => ({
      ...item,
      slot: 'Today',
      occupancy: item.capacity > 0 ? Math.round((item.booked / item.capacity) * 100) : 0,
    }));
  }, [seats]);

  const checkedInStudents = useMemo(() => {
    return students.filter((student) => {
      if (!isStudentActive(student)) return false;
      const isCheckedIn = Boolean(student.checkedIn || (student.currentCheckIn && !student.currentCheckOut));
      if (!isCheckedIn) return false;

      const checkInDate = parseDate(student.currentCheckIn);
      if (!checkInDate) return true;
      return checkInDate.toISOString().slice(0, 10) === selectedDate;
    });
  }, [students, selectedDate]);

  const timeSlotPopularity = useMemo(() => {
    const hourlyCounts = {};

    checkedInStudents.forEach((student) => {
      const checkInDate = parseDate(student.currentCheckIn);
      if (!checkInDate) return;
      const hour = checkInDate.getHours();
      hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
    });

    const totalSeats = seats.length || 1;
    return SLOT_DEFINITIONS.map((slotDef) => {
      let bookings = 0;
      for (let hour = slotDef.start; hour < slotDef.end; hour += 1) {
        bookings += hourlyCounts[hour] || 0;
      }
      const avgOccupancy = Math.min(100, Math.round((bookings / totalSeats) * 100));
      return {
        slot: slotDef.slot,
        bookings,
        avgOccupancy,
        type: slotDef.type,
      };
    });
  }, [checkedInStudents, seats.length]);

  const sideStats = useMemo(() => {
    return studySpaces.map((space) => ({
      side: space.side,
      totalSeats: space.capacity,
      regularSeats: space.sections.find((s) => s.section === 'Regular')?.seats || 0,
      silentSeats: space.sections.find((s) => s.section === 'Silent')?.seats || 0,
    }));
  }, [studySpaces]);

  const spaceRatings = useMemo(() => {
    const bySide = {
      BOYS: { totalBookings: 0, activeStudents: 0, avgUtilization: 0, totalSeats: 0, occupied: 0 },
      GIRLS: { totalBookings: 0, activeStudents: 0, avgUtilization: 0, totalSeats: 0, occupied: 0 },
    };

    students.forEach((student) => {
      const gender = normalizeGender(student.gender);
      if (isStudentActive(student)) bySide[gender].activeStudents += 1;
      if (isStudentActive(student) && student.currentCheckIn) bySide[gender].totalBookings += 1;
    });

    seats.forEach((seat) => {
      const gender = normalizeGender(seat.gender);
      const status = String(seat.status || '').toUpperCase();
      bySide[gender].totalSeats += 1;
      if (status === 'ALLOCATED') bySide[gender].occupied += 1;
    });

    Object.values(bySide).forEach((side) => {
      side.avgUtilization = side.totalSeats > 0 ? Math.round((side.occupied / side.totalSeats) * 100) : 0;
    });

    return [
      {
        spaceId: 1,
        spaceName: 'Boys Seating',
        totalBookings: bySide.BOYS.totalBookings,
        activeStudents: bySide.BOYS.activeStudents,
        avgUtilization: bySide.BOYS.avgUtilization,
      },
      {
        spaceId: 2,
        spaceName: 'Girls Seating',
        totalBookings: bySide.GIRLS.totalBookings,
        activeStudents: bySide.GIRLS.activeStudents,
        avgUtilization: bySide.GIRLS.avgUtilization,
      },
    ];
  }, [students, seats]);

  const overallStats = useMemo(() => {
    const totalSeats = seats.length;
    const totalBookingsToday = seats.filter((seat) => String(seat.status || '').toUpperCase() === 'ALLOCATED').length;
    const averageOccupancy = totalSeats > 0 ? Math.round((totalBookingsToday / totalSeats) * 100) : 0;
    const peakOccupancy = Math.max(...occupancyData.map((d) => d.occupancy), 0);

    return {
      totalSeats,
      totalBookingsToday,
      peakOccupancy,
      averageOccupancy,
    };
  }, [seats, occupancyData]);

  const filteredOccupancyData = useMemo(() => {
    if (!selectedSpaceId) return occupancyData;
    return occupancyData.filter((item) => String(item.spaceId) === String(selectedSpaceId));
  }, [occupancyData, selectedSpaceId]);

  const peakSlots = useMemo(() => {
    const sorted = [...timeSlotPopularity].sort((a, b) => b.avgOccupancy - a.avgOccupancy);
    const dayPeak = sorted.find((slot) => slot.type === 'DAY');
    const nightPeak = sorted.find((slot) => slot.type === 'NIGHT');
    return { dayPeak, nightPeak };
  }, [timeSlotPopularity]);

  const averageMonthlyFee = useMemo(() => {
    const feeStudents = students.filter((s) => Number(s.monthlyFee) > 0);
    if (feeStudents.length === 0) return 0;
    return Math.round(feeStudents.reduce((sum, s) => sum + Number(s.monthlyFee || 0), 0) / feeStudents.length);
  }, [students]);

  const getOccupancyBar = (occupancy) => {
    let color = '#4caf50';
    if (occupancy >= 80) color = '#ff6b6b';
    else if (occupancy >= 60) color = '#ffa500';

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
      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-icon">💺</div>
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

      <div className="report-section">
        <h2>Filters</h2>
        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="report-date">Date</label>
            <input
              id="report-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label htmlFor="report-side">Seating Side</label>
            <select
              id="report-side"
              value={selectedSpaceId}
              onChange={(e) => setSelectedSpaceId(e.target.value)}
            >
              <option value="">All Sides</option>
              {studySpaces.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.side}
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" onClick={fetchReportData} disabled={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        {loadError && <p>{loadError}</p>}
      </div>

      <div className="report-section">
        <h2>Time Slot Popularity & Occupancy</h2>
        <div className="time-slot-chart">
          {timeSlotPopularity.map((slot) => (
            <div key={slot.slot} className="time-slot-row">
              <div className="slot-info">
                <div className="slot-name">{slot.slot}</div>
                <div className="slot-type">{slot.type}</div>
              </div>
              <div className="slot-stats">
                <span className="bookings">{slot.bookings} check-ins</span>
              </div>
              <div className="slot-occupancy">
                {getOccupancyBar(slot.avgOccupancy)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="report-section">
        <h2>Seating Allocation (Boys & Girls)</h2>
        <div className="room-type-grid">
          {sideStats.map((sideStat) => (
            <div key={sideStat.side} className="room-type-card">
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

      <div className="report-section">
        <h2>Seating Utilization & Active Students</h2>
        <div className="ratings-table">
          <div className="table-header">
            <div className="col-space">Seating Side</div>
            <div className="col-rating">Check-ins</div>
            <div className="col-bookings">Active Students</div>
            <div className="col-reviews">Avg. Utilization</div>
          </div>
          {spaceRatings.map((space) => (
            <div key={space.spaceId} className="table-row">
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

      <div className="report-section">
        <h2>Today's Seat Availability (by Section)</h2>
        <div className="occupancy-list">
          {filteredOccupancyData.map((data) => (
            <div key={`${data.spaceId}-${data.section}`} className="occupancy-item">
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

      <div className="report-section">
        <h2>Peak Hour Analysis</h2>
        <div className="trends-info">
          <div className="trend-card">
            <h3>Busiest Time Slots</h3>
            <p>Highest observed check-in occupancy:</p>
            <ul>
              <li>
                <strong>Day Peak: </strong>
                {peakSlots.dayPeak ? `${peakSlots.dayPeak.slot} - ${peakSlots.dayPeak.avgOccupancy}%` : 'N/A'}
              </li>
              <li>
                <strong>Night Peak: </strong>
                {peakSlots.nightPeak ? `${peakSlots.nightPeak.slot} - ${peakSlots.nightPeak.avgOccupancy}%` : 'N/A'}
              </li>
            </ul>
          </div>

          <div className="trend-card">
            <h3>Seating Preference</h3>
            <ol>
              {spaceRatings
                .slice()
                .sort((a, b) => b.avgUtilization - a.avgUtilization)
                .map((side, idx) => (
                  <li key={side.spaceId}>
                    {idx + 1}. {side.spaceName} - {side.avgUtilization}% average utilization
                  </li>
                ))}
            </ol>
          </div>

          <div className="trend-card">
            <h3>Recommendations</h3>
            <ul>
              <li>Track occupancy spikes above 80% to adjust section policies.</li>
              <li>Focus renewal follow-ups for inactive students with allocated seats.</li>
              <li>Monitor silent section usage for future expansion planning.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="report-section">
        <h2>Monthly Subscription & Check-in Status</h2>
        <div className="feedback-summary">
          <div className="feedback-stat">
            <div className="feedback-icon">💳</div>
            <div className="feedback-content">
              <h4>Fee Collection</h4>
              <p className="rating">₹{averageMonthlyFee.toLocaleString('en-IN')}/month</p>
              <p className="description">Average subscription per student</p>
            </div>
          </div>

          <div className="feedback-stat">
            <div className="feedback-icon">✅</div>
            <div className="feedback-content">
              <h4>Active Subscriptions</h4>
              <p className="rating">{students.filter((s) => s.subscriptionStatus === 'Active').length} Students</p>
              <p className="description">
                Currently enrolled (Boys: {students.filter((s) => s.gender === 'BOYS').length},
                Girls: {students.filter((s) => s.gender === 'GIRLS').length})
              </p>
            </div>
          </div>

          <div className="feedback-stat">
            <div className="feedback-icon">🕐</div>
            <div className="feedback-content">
              <h4>Current Check-In</h4>
              <p>{checkedInStudents.length} students checked in</p>
              <p className="description">Live status from backend check-in/check-out data</p>
            </div>
          </div>
        </div>
      </div>

      <div className="action-items">
        <h3>Administrative Tasks</h3>
        <ul>
          <li>
            Send renewal reminders to {
              students.filter((s) => {
                if (!s.subscriptionExpiry) return false;
                const expiry = parseDate(s.subscriptionExpiry);
                if (!expiry) return false;
                const now = new Date();
                const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
                return diffDays >= 0 && diffDays <= 7;
              }).length
            } students with subscriptions expiring in next 7 days.
          </li>
          <li>
            Review {
              students.filter((s) => !s.seatNumber || s.seatNumber === '-').length
            } students waiting for seat allocation.
          </li>
          <li>
            Process fee payments for {
              students.filter((s) => s.feeStatus === 'Pending').length
            } students with pending invoices.
          </li>
          <li>
            Monitor {
              occupancyData.filter((s) => s.occupancy >= 90).length
            } sections currently at or above 90% occupancy.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default StudySpaceReports;
