import React, { useState, useMemo, useEffect, useCallback } from 'react';
import '../styles/Students.css';
import {
  extractStudentsFromResponse,
  normalizeStudent,
  toApiStudentCreatePayload,
  toApiStudentUpdatePayload,
} from '../interfaces/studentResponse';
import { createStudentApi, getStudentsApi, updateStudentApi } from '../services/studentApi';

const Students = () => {
  const [activeTab, setActiveTab] = useState('manage');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'BOYS',
    seatSection: 'Regular',
  });
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [updatingStudentId, setUpdatingStudentId] = useState(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const result = await getStudentsApi();
      const studentsData = extractStudentsFromResponse(result);
      setStudents(studentsData.map(normalizeStudent));
    } catch (error) {
      setLoadError(error.message || 'Unable to load students');
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const availableSeats = useMemo(() => {
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

  const stats = useMemo(() => {
    const active = students.filter(s => s.subscriptionStatus === 'Active').length;
    const paidFees = students.filter(s => s.feeStatus === 'Paid').length;
    const pendingFees = students.filter(s => s.feeStatus === 'Pending').length;
    const totalRevenue = students.reduce((sum, s) => sum + (s.feeStatus === 'Paid' ? s.monthlyFee : 0), 0);

    return { active, paidFees, pendingFees, totalRevenue };
  }, [students]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const updateStudentStatus = async (student, updates, successMessage) => {
    const apiId = student.studentId ?? student.id;
    if (!apiId) {
      console.log('Student id not found for update');
      return;
    }

    setUpdatingStudentId(apiId);
    try {
      let updatedFromApi = null;
      try {
        const result = await updateStudentApi(apiId, toApiStudentUpdatePayload(student, updates));
        if (result?.data && !Array.isArray(result.data)) {
          updatedFromApi = normalizeStudent(result.data);
        } else if (result && !Array.isArray(result)) {
          updatedFromApi = normalizeStudent(result);
        }
      } catch (_) {
        updatedFromApi = null;
      }

      setStudents(prev =>
        prev.map(s => {
          const currentId = s.studentId ?? s.id;
          if (String(currentId) !== String(apiId)) return s;
          return updatedFromApi ? { ...s, ...updatedFromApi } : { ...s, ...updates };
        })
      );

      if (successMessage) {
        console.log(successMessage);
      }
    } catch (error) {
      console.log(error.message || 'Unable to update student');
    } finally {
      setUpdatingStudentId(null);
    }
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      console.log('Please fill all required fields');
      return;
    }

    const availableSeat = availableSeats[formData.gender][formData.seatSection]
      .find(s => s.available);

    if (!availableSeat) {
      console.log(`No available seats in ${formData.gender} - ${formData.seatSection} section`);
      return;
    }

    setIsEnrolling(true);
    try {
      await createStudentApi(toApiStudentCreatePayload(formData, availableSeat.seat));

      await fetchStudents();
      setFormData({ name: '', email: '', phone: '', gender: 'BOYS', seatSection: 'Regular' });
    } catch (error) {
      console.log(error.message || 'Unable to enroll student');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleProcessPayment = (studentId) => {
    const targetStudent = students.find(s => String(s.studentId ?? s.id) === String(studentId));
    if (!targetStudent) return;
    updateStudentStatus(targetStudent, { feeStatus: 'Paid' }, 'Payment status updated');
  };

  const handleCheckIn = (studentId) => {
    const targetStudent = students.find(s => String(s.studentId ?? s.id) === String(studentId));
    if (!targetStudent) return;
    const now = new Date().toLocaleString('en-IN');
    updateStudentStatus(targetStudent, { checkedIn: true, currentCheckIn: now, currentCheckOut: null }, 'Check-in updated');
  };

  const handleCheckOut = (studentId) => {
    const targetStudent = students.find(s => String(s.studentId ?? s.id) === String(studentId));
    if (!targetStudent) return;
    const now = new Date().toLocaleString('en-IN');
    updateStudentStatus(targetStudent, { checkedIn: false, currentCheckOut: now }, 'Check-out updated');
  };

  const handleRemoveStudent = (studentId) => {
    const targetStudent = students.find(s => String(s.studentId ?? s.id) === String(studentId));
    if (!targetStudent) return;

    // if (window.confirm('Are you sure you want to remove this student?')) {
      updateStudentStatus(targetStudent, { active: false, subscriptionStatus: 'Inactive' }, 'Student marked inactive');
    // }
  };

  return (
    <div className="students-container">
      <div className="page-header">
        <h1>📚 Student Management & Seat Allocation</h1>
        <p>Manage student enrollments, seat assignments, and fees</p>
      </div>

      {/* Statistics */}
      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Active Students</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💳</div>
          <div className="stat-content">
            <div className="stat-value">₹{stats.totalRevenue.toLocaleString('en-IN')}</div>
            <div className="stat-label">Monthly Revenue</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.paidFees}</div>
            <div className="stat-label">Fees Paid</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">{stats.pendingFees}</div>
            <div className="stat-label">Pending Fees</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button 
          className={`tab-button ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => setActiveTab('manage')}
        >
          📋 Manage Students
        </button>
        <button 
          className={`tab-button ${activeTab === 'enroll' ? 'active' : ''}`}
          onClick={() => setActiveTab('enroll')}
        >
          ➕ Enroll New Student
        </button>
        <button 
          className={`tab-button ${activeTab === 'seats' ? 'active' : ''}`}
          onClick={() => setActiveTab('seats')}
        >
          💺 View Seats
        </button>
      </div>

      {/* Manage Students Tab */}
      {activeTab === 'manage' && (
        <div className="tab-content">
          <div className="filters">
            <input type="text" placeholder="Search by name or ID..." className="search-input" />
            <select className="filter-select">
              <option value="">All Students</option>
              <option value="BOYS">Boys Side</option>
              <option value="GIRLS">Girls Side</option>
            </select>
            <select className="filter-select">
              <option value="">All Fee Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          <div className="students-list">
            {isLoading && <p>Loading students...</p>}

            {!isLoading && loadError && (
              <div>
                <p>{loadError}</p>
                <button className="btn btn-primary" onClick={fetchStudents}>
                  Retry
                </button>
              </div>
            )}

            {!isLoading && !loadError && students.length === 0 && <p>No students found.</p>}

            {!isLoading && !loadError && students.map(student => {
              const rowId = student.studentId ?? student.id;
              const isUpdatingRow = String(updatingStudentId) === String(rowId);

              return (
              <div key={rowId || student.email} className="student-card">
                <div className="student-header">
                  <div className="student-info">
                    <h3>{student.name}</h3>
                    <p className="student-id">{student.id}</p>
                  </div>
                  <div className="student-badges">
                    <span className={`badge side-badge ${student.gender.toLowerCase()}`}>
                      {student.gender === 'BOYS' ? '👦' : '👧'} {student.gender} - {student.seatSection}
                    </span>
                    <span className={`badge status-badge ${student.subscriptionStatus.toLowerCase()}`}>
                      {student.subscriptionStatus}
                    </span>
                  </div>
                </div>

                <div className="student-details">
                  <div className="detail-group">
                    <span className="detail-label">Seat:</span>
                    <span className="detail-value">{student.seatNumber}</span>
                  </div>
                  <div className="detail-group">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{student.email}</span>
                  </div>
                  <div className="detail-group">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{student.phone}</span>
                  </div>
                  <div className="detail-group">
                    <span className="detail-label">Expiry:</span>
                    <span className="detail-value">{student.subscriptionExpiry}</span>
                  </div>
                </div>

                <div className="fee-section">
                  <div className="fee-info">
                    <span>Monthly Fee: ₹{student.monthlyFee}</span>
                    <span className={`fee-status ${student.feeStatus.toLowerCase()}`}>
                      {student.feeStatus}
                    </span>
                  </div>
                  {student.feeStatus === 'Pending' && (
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleProcessPayment(rowId)}
                      disabled={isUpdatingRow}
                    >
                      💳 Process Payment
                    </button>
                  )}
                </div>

                <div className="checkin-section">
                  {student.currentCheckIn && (
                    <div className="checkin-info">
                      <span>Check-In: {student.currentCheckIn}</span>
                      {student.currentCheckOut && (
                        <span>Check-Out: {student.currentCheckOut}</span>
                      )}
                    </div>
                  )}
                  <div className="checkin-buttons">
                    <button 
                      className="btn btn-success"
                      onClick={() => handleCheckIn(rowId)}
                      disabled={(student.currentCheckIn && !student.currentCheckOut) || isUpdatingRow}
                    >
                      ✅ Check-In
                    </button>
                    <button 
                      className="btn btn-warning"
                      onClick={() => handleCheckOut(rowId)}
                      disabled={!student.currentCheckIn || student.currentCheckOut || isUpdatingRow}
                    >
                      ⏹️ Check-Out
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleRemoveStudent(rowId)}
                      disabled={isUpdatingRow}
                    >
                      🗑️ Remove
                    </button>
                  </div>
                </div>
              </div>
            )})}
          </div>
        </div>
      )}

      {/* Enroll New Student Tab */}
      {activeTab === 'enroll' && (
        <div className="tab-content">
          <div className="enrollment-form">
            <h2>Add New Student</h2>
            <form onSubmit={handleEnrollStudent}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter student name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div className="form-group">
                <label>Seating Side *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                >
                  <option value="BOYS">👦 Boys Side</option>
                  <option value="GIRLS">👧 Girls Side</option>
                </select>
              </div>

              <div className="form-group">
                <label>Section Preference *</label>
                <select
                  name="seatSection"
                  value={formData.seatSection}
                  onChange={handleInputChange}
                >
                  <option value="Regular">Regular (Moderate noise)</option>
                  <option value="Silent">Silent (Quiet environment)</option>
                </select>
              </div>

              <div className="form-info">
                <p>💡 <strong>Subscription Details:</strong></p>
                <ul>
                  <li>Monthly Fee: ₹8,500</li>
                  <li>Duration: 3 months (auto-renewable)</li>
                  <li>Individual seat allocation</li>
                  <li>Automatic check-in/check-out tracking</li>
                  <li>Access to both day and night slots</li>
                </ul>
              </div>

              <button type="submit" className="btn btn-primary btn-large" disabled={isEnrolling}>
                {isEnrolling ? '➕ Enrolling...' : '➕ Enroll Student'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* View Seats Tab */}
      {activeTab === 'seats' && (
        <div className="tab-content">
          <div className="seats-grid">
            {Object.entries(availableSeats).map(([side, sections]) => (
              <div key={side} className="side-section">
                <h3>{side === 'BOYS' ? '👦' : '👧'} {side} Side</h3>
                {Object.entries(sections).map(([section, seats]) => (
                  <div key={section} className="section-block">
                    <h4>{section} Section</h4>
                    <div className="seats-display">
                      {seats.map((seatObj, idx) => (
                        <div
                          key={idx}
                          className={`seat-indicator ${seatObj.available ? 'available' : 'occupied'}`}
                          title={`${seatObj.seat}: ${seatObj.available ? 'Available' : 'Occupied'}`}
                        >
                          {seatObj.available ? '?' : '?'}
                        </div>
                      ))}
                    </div>
                    <div className="section-stats">
                      Available: {seats.filter(s => s.available).length}/{seats.length}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
