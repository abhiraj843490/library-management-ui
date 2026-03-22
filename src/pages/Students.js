import React, { useState, useMemo } from 'react';
import '../styles/Students.css';

const Students = () => {
  const [activeTab, setActiveTab] = useState('manage');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'BOYS',
    seatSection: 'Regular',
  });
  const [students, setStudents] = useState([
    {
      id: 'STU-001',
      name: 'Aarav Kumar',
      email: 'aarav.kumar@email.com',
      phone: '9876543210',
      gender: 'BOYS',
      seatSection: 'Regular',
      seatNumber: 'B-15',
      enrollmentDate: '2026-01-10',
      subscriptionStatus: 'Active',
      subscriptionExpiry: '2026-04-10',
      monthlyFee: 8500,
      feeStatus: 'Paid',
      currentCheckIn: '2026-03-22 09:15',
      currentCheckOut: '2026-03-22 11:45',
    },
    {
      id: 'STU-002',
      name: 'Priya Sharma',
      email: 'priya.sharma@email.com',
      phone: '9876543211',
      gender: 'GIRLS',
      seatSection: 'Silent',
      seatNumber: 'G-08',
      enrollmentDate: '2026-01-20',
      subscriptionStatus: 'Active',
      subscriptionExpiry: '2026-04-20',
      monthlyFee: 8500,
      feeStatus: 'Pending',
      currentCheckIn: '2026-03-22 14:30',
      currentCheckOut: null,
    },
    {
      id: 'STU-003',
      name: 'Rahul Verma',
      email: 'rahul.verma@email.com',
      phone: '9876543212',
      gender: 'BOYS',
      seatSection: 'Silent',
      seatNumber: 'B-05',
      enrollmentDate: '2026-02-05',
      subscriptionStatus: 'Active',
      subscriptionExpiry: '2026-05-05',
      monthlyFee: 8500,
      feeStatus: 'Paid',
      currentCheckIn: null,
      currentCheckOut: null,
    },
  ]);

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

  const handleEnrollStudent = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      alert('Please fill all required fields');
      return;
    }

    const availableSeat = availableSeats[formData.gender][formData.seatSection]
      .find(s => s.available);

    if (!availableSeat) {
      alert(`No available seats in ${formData.gender} - ${formData.seatSection} section`);
      return;
    }

    const newStudent = {
      id: `STU-${(students.length + 1).toString().padStart(3, '0')}`,
      ...formData,
      seatNumber: availableSeat.seat,
      enrollmentDate: new Date().toISOString().split('T')[0],
      subscriptionStatus: 'Active',
      subscriptionExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      monthlyFee: 8500,
      feeStatus: 'Paid',
      currentCheckIn: null,
      currentCheckOut: null,
    };

    setStudents([...students, newStudent]);
    setFormData({ name: '', email: '', phone: '', gender: 'BOYS', seatSection: 'Regular' });
    alert(`Student enrolled successfully! Seat allocated: ${newStudent.seatNumber}`);
  };

  const handleProcessPayment = (studentId) => {
    setStudents(students.map(s => 
      s.id === studentId ? { ...s, feeStatus: 'Paid' } : s
    ));
    alert('Payment processed successfully!');
  };

  const handleCheckIn = (studentId) => {
    const now = new Date().toLocaleString('en-IN');
    setStudents(students.map(s => 
      s.id === studentId ? { ...s, currentCheckIn: now, currentCheckOut: null } : s
    ));
  };

  const handleCheckOut = (studentId) => {
    const now = new Date().toLocaleString('en-IN');
    setStudents(students.map(s => 
      s.id === studentId ? { ...s, currentCheckOut: now } : s
    ));
  };

  const handleRemoveStudent = (studentId) => {
    if (window.confirm('Are you sure you want to remove this student?')) {
      setStudents(students.filter(s => s.id !== studentId));
    }
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
            {students.map(student => (
              <div key={student.id} className="student-card">
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
                      onClick={() => handleProcessPayment(student.id)}
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
                      onClick={() => handleCheckIn(student.id)}
                      disabled={student.currentCheckIn && !student.currentCheckOut}
                    >
                      ✅ Check-In
                    </button>
                    <button 
                      className="btn btn-warning"
                      onClick={() => handleCheckOut(student.id)}
                      disabled={!student.currentCheckIn || student.currentCheckOut}
                    >
                      ⏹️ Check-Out
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleRemoveStudent(student.id)}
                    >
                      🗑️ Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
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

              <button type="submit" className="btn btn-primary btn-large">
                ➕ Enroll Student
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
                          {seatObj.available ? '○' : '●'}
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
