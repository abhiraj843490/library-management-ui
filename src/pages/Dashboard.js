import { useMemo } from 'react';
import { useLibrary } from '../App';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

export default function Dashboard() {
  const { members } = useLibrary();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Define helper functions first
  const memberStatus = (status) => {
    if (status === 'Active') return 'Active ✓';
    if (status === 'Review') return 'Pending ⏳';
    return 'Inactive';
  };

  const getMemberStatus = (status) => {
    switch(status) {
      case 'Active': return 'active';
      case 'Review': return 'warning';
      default: return 'neutral';
    }
  };

  const stats = useMemo(() => {
    if (isAdmin) {
      const activeMembers = members.filter(m => m.status === 'Active').length;
      const reviewMembers = members.filter(m => m.status === 'Review').length;
      const totalMembers = members.length;

      return [
        {
          label: 'Active Students',
          value: activeMembers,
          caption: 'Currently enrolled',
          color: 'positive',
        },
        {
          label: 'Total Students',
          value: totalMembers,
          caption: 'All registrations',
          color: 'primary',
        },
        {
          label: 'Under Review',
          value: reviewMembers,
          caption: 'Awaiting approval',
          color: 'warning',
        },
        {
          label: 'Total Seats',
          value: 100,
          caption: '50 Boys + 50 Girls',
          color: 'neutral',
        },
      ];
    } else {
      // Student view
      const studentData = members.find(m => m.id === user?.id) || user;
      return [
        {
          label: 'Your Seating Side',
          value: studentData?.side || 'BOYS',
          caption: 'Allocated side',
          color: 'primary',
        },
        {
          label: 'Seat Number',
          value: studentData?.seatNumber || 'B-00',
          caption: 'Your seat',
          color: 'positive',
        },
        {
          label: 'Status',
          value: memberStatus(studentData?.status || 'Active'),
          caption: 'Current status',
          color: 'neutral',
        },
        {
          label: 'Subscription',
          value: '₹500',
          caption: 'Monthly fee',
          color: 'neutral',
        },
      ];
    }
  }, [members, isAdmin, user]);

  const activeMembersList = isAdmin
    ? members
        .filter(m => m.status === 'Active')
        .sort((a, b) => new Date(b.membershipDate) - new Date(a.membershipDate))
        .slice(0, 5)
    : members.filter(m => m.id === user?.id).slice(0, 1);

  return (
    <div className="dashboard-container">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">System Overview</p>
          <h1>{isAdmin ? 'Admin Dashboard' : 'My Dashboard'}</h1>
          <p className="hero-copy">
            {isAdmin
              ? 'Manage student enrollments, seat allocations, and system analytics.'
              : 'View your seat information and booking details.'}
          </p>
        </div>
      </section>

      <section className="stats-grid" aria-label="Study space summary">
        {stats.map((stat) => (
          <article key={stat.label} className={`stat-card stat-${stat.color}`}>
            <span className="stat-label">{stat.label}</span>
            <strong className="stat-value">{stat.value}</strong>
            <small className="stat-caption">{stat.caption}</small>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-head compact">
            <div>
              <p className="panel-label">Recently</p>
              <h2>{isAdmin ? 'Active Students' : 'My Information'}</h2>
            </div>
          </div>

          <div className="recent-loans">
            {activeMembersList.length > 0 ? (
              activeMembersList.map((member) => (
                <div key={member.id} className="loan-item">
                  <div className="loan-info">
                    <strong>{member.name}</strong>
                    <p>{member.email}</p>
                    <small>{member.id}</small>
                  </div>
                  <div className="loan-status">
                    <span className={`badge ${getMemberStatus(member.status)}`}>
                      {member.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">No members found</div>
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panel-head compact">
            <div>
              <p className="panel-label">Systems</p>
              <h2>Quick Stats</h2>
            </div>
          </div>

          <div className="quick-stats">
            {isAdmin ? (
              <>
                <div className="quick-stat">
                  <span>Total Students</span>
                  <strong>{members.length}</strong>
                </div>
                <div className="quick-stat">
                  <span>Active Students</span>
                  <strong>{members.filter(m => m.status === 'Active').length}</strong>
                </div>
                <div className="quick-stat">
                  <span>Total Seats</span>
                  <strong>100</strong>
                </div>
                <div className="quick-stat">
                  <span>Pending Review</span>
                  <strong>{members.filter(m => m.status === 'Review').length}</strong>
                </div>
              </>
            ) : (
              <>
                <div className="quick-stat">
                  <span>Your Seat</span>
                  <strong>{user?.seatNumber || 'B-00'}</strong>
                </div>
                <div className="quick-stat">
                  <span>Monthly Fee</span>
                  <strong>₹8,500</strong>
                </div>
                <div className="quick-stat">
                  <span>Status</span>
                  <strong>{user?.status || 'Active'}</strong>
                </div>
                <div className="quick-stat">
                  <span>Enrollment</span>
                  <strong>{user?.enrollment || '2026-01-10'}</strong>
                </div>
              </>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
