import { useCallback, useEffect, useMemo, useState } from 'react';
import { extractStudentsFromResponse, normalizeStudent } from '../interfaces/studentResponse';
import { getSeatsApi, getStudentsApi } from '../services/studentApi';
import './Reports.css';

export default function Reports() {
  const [students, setStudents] = useState([]);
  const [seats, setSeats] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const extractSeatsFromResponse = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.content)) return response.data.content;
    return [];
  };

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
      setLoadError(error.message || 'Unable to load reports');
      setStudents([]);
      setSeats([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const reports = useMemo(() => {
    const seatSectionDist = {};
    seats.forEach((seat) => {
      const section = String(seat.section || seat.seatSection || 'REGULAR').toUpperCase();
      const label = section === 'SILENT' ? 'Silent' : 'Regular';
      seatSectionDist[label] = (seatSectionDist[label] || 0) + 1;
    });

    const genderDist = {};
    students.forEach((student) => {
      genderDist[student.gender] = (genderDist[student.gender] || 0) + 1;
    });

    const inactiveStudents = students.filter((s) => s.subscriptionStatus === 'Inactive');
    const pendingFeeStudents = students.filter((s) => s.feeStatus === 'Pending');
    const paidFeeStudents = students.filter((s) => s.feeStatus === 'Paid');

    const topMonthlyFee = students
      .filter((s) => Number(s.monthlyFee) > 0)
      .map((s) => ({
        studentId: s.id || s.studentId || s.userCode,
        name: s.name,
        seatNumber: s.seatNumber,
        count: Number(s.monthlyFee || 0),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const recentEnrollments = students
      .filter((s) => s.enrollmentDate)
      .map((s) => ({
        studentId: s.id || s.studentId || s.userCode,
        name: s.name,
        seatNumber: s.seatNumber,
        count: s.enrollmentDate,
      }))
      .sort((a, b) => new Date(b.count) - new Date(a.count))
      .slice(0, 5);

    const availabilityStats = {
      available: seats.filter((s) => String(s.status || '').toUpperCase() === 'AVAILABLE').length,
      occupied: seats.filter((s) => String(s.status || '').toUpperCase() === 'ALLOCATED').length,
      blocked: seats.filter((s) => {
        const status = String(s.status || '').toUpperCase();
        return status === 'BLOCKED' || status === 'MAINTENANCE';
      }).length,
    };

    const feeStats = {
      pendingCount: pendingFeeStudents.length,
      totalPending: pendingFeeStudents.reduce((sum, s) => sum + Number(s.monthlyFee || 0), 0),
      totalPaid: paidFeeStudents.reduce((sum, s) => sum + Number(s.monthlyFee || 0), 0),
    };

    return {
      seatSectionDist,
      genderDist,
      inactiveStudents: inactiveStudents.length,
      pendingFees: pendingFeeStudents.length,
      topMonthlyFee,
      recentEnrollments,
      availabilityStats,
      feeStats,
    };
  }, [students, seats]);

  return (
    <div className="reports-container">
      <section className="page-header">
        <div>
          <p className="eyebrow">Analytics & Reports</p>
          <h1>Student & Seat Reports</h1>
          <p className="page-description">
            Comprehensive analytics and insights into student and seat operations.
          </p>
          {isLoading && <p className="page-description">Loading report data...</p>}
          {loadError && (
            <p className="page-description">
              {loadError} <button className="btn btn-primary" onClick={fetchReportData}>Retry</button>
            </p>
          )}
        </div>
      </section>

      <section className="reports-grid">
        <article className="report-card">
          <h3>Seat Distribution</h3>
          <div className="report-content">
            <h4>Seats by Section</h4>
            <ul className="report-list">
              {Object.entries(reports.seatSectionDist)
                .sort((a, b) => b[1] - a[1])
                .map(([section, count]) => (
                  <li key={section}>
                    <span>{section}</span>
                    <strong>{count} seats</strong>
                  </li>
                ))}
            </ul>
          </div>
        </article>

        <article className="report-card">
          <h3>Student Demographics</h3>
          <div className="report-content">
            <h4>Students by Side</h4>
            <ul className="report-list">
              {Object.entries(reports.genderDist)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => (
                  <li key={type}>
                    <span>{type}</span>
                    <strong>{count} students</strong>
                  </li>
                ))}
            </ul>
          </div>
        </article>

        <article className="report-card highlight">
          <h3>Student Status</h3>
          <div className="report-content">
            <div className="metric">
              <span>Inactive Students</span>
              <strong className="danger">{reports.inactiveStudents}</strong>
            </div>
            <div className="metric">
              <span>Pending Fees</span>
              <strong className="warning">{reports.pendingFees}</strong>
            </div>
            <div className="metric">
              <span>Action Required</span>
              <strong>{reports.inactiveStudents + reports.pendingFees}</strong>
            </div>
          </div>
        </article>

        <article className="report-card">
          <h3>📊 Seat Availability</h3>
          <div className="report-content">
            <div className="metric">
              <span>Available</span>
              <strong className="positive">{reports.availabilityStats.available}</strong>
            </div>
            <div className="metric">
              <span>Occupied</span>
              <strong className="warning">{reports.availabilityStats.occupied}</strong>
            </div>
            <div className="metric">
              <span>Blocked / Maintenance</span>
              <strong className="danger">{reports.availabilityStats.blocked}</strong>
            </div>
          </div>
        </article>

        <article className="report-card">
          <h3>💰 Fee Collections</h3>
          <div className="report-content">
            <div className="metric">
              <span>Pending Fees</span>
              <strong className="danger">₹{reports.feeStats.totalPending.toLocaleString('en-IN')}</strong>
            </div>
            <div className="metric">
              <span>Paid Amount</span>
              <strong className="positive">₹{reports.feeStats.totalPaid.toLocaleString('en-IN')}</strong>
            </div>
            <div className="metric">
              <span>Pending Count</span>
              <strong>{reports.feeStats.pendingCount}</strong>
            </div>
          </div>
        </article>

        <article className="report-card">
          <h3>📈 Overall Summary</h3>
          <div className="report-content">
            <div className="metric">
              <span>Total Students</span>
              <strong>{students.length}</strong>
            </div>
            <div className="metric">
              <span>Total Seats</span>
              <strong>{seats.length}</strong>
            </div>
            <div className="metric">
              <span>Active Students</span>
              <strong>{students.filter((s) => s.subscriptionStatus === 'Active').length}</strong>
            </div>
            <div className="metric">
              <span>Occupied Seats</span>
              <strong>{reports.availabilityStats.occupied}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="reports-detailed">
        <article className="detailed-card">
          <h3>🏆 Top Monthly Fee Students</h3>
          <table className="detailed-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student Name</th>
                <th>Monthly Fee</th>
              </tr>
            </thead>
            <tbody>
              {reports.topMonthlyFee.map((item, idx) => (
                <tr key={item.studentId}>
                  <td className="rank">#{idx + 1}</td>
                  <td>{item.name} ({item.seatNumber || '-'})</td>
                  <td className="highlight-value">₹{item.count.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {reports.topMonthlyFee.length === 0 && (
            <p className="empty-msg">No fee data available</p>
          )}
        </article>

        <article className="detailed-card">
          <h3>Recent Enrollments</h3>
          <table className="detailed-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student Name</th>
                <th>Enrollment Date</th>
              </tr>
            </thead>
            <tbody>
              {reports.recentEnrollments.map((item, idx) => (
                <tr key={item.studentId}>
                  <td className="rank">#{idx + 1}</td>
                  <td>{item.name} ({item.seatNumber || '-'})</td>
                  <td className="highlight-value">{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {reports.recentEnrollments.length === 0 && (
            <p className="empty-msg">No enrollment data available</p>
          )}
        </article>
      </section>
    </div>
  );
}
