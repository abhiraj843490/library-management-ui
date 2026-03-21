import { useMemo } from 'react';
import { useLibrary } from '../App';
import './Dashboard.css';

export default function Dashboard() {
  const { books, members, loans, fines } = useLibrary();

  const stats = useMemo(() => {
    const today = new Date();
    const overdueLoans = loans.filter(l => {
      if (l.returnedOn) return false;
      return new Date(l.dueOn) < today;
    });

    const duesSoonLoans = loans.filter(l => {
      if (l.returnedOn) return false;
      const dueDate = new Date(l.dueOn);
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 3 && daysUntilDue > 0;
    });

    const totalBooks = books.reduce((sum, b) => sum + b.totalCopies, 0);
    const availableBooks = books.reduce((sum, b) => sum + b.availableCopies, 0);
    const activeMembers = members.filter(m => m.status === 'Active').length;
    const unpaidFines = fines.filter(f => f.status === 'Unpaid').length;
    const totalFines = fines.filter(f => f.status === 'Unpaid').reduce((sum, f) => sum + f.amount, 0);

    return [
      {
        label: 'Total Books',
        value: totalBooks,
        caption: `${books.length} titles`,
        color: 'primary',
      },
      {
        label: 'Available Copies',
        value: availableBooks,
        caption: 'Ready to issue',
        color: 'positive',
      },
      {
        label: 'Active Members',
        value: activeMembers,
        caption: `of ${members.length} total`,
        color: 'neutral',
      },
      {
        label: 'Overdue Loans',
        value: overdueLoans.length,
        caption: 'Need follow-up',
        color: 'danger',
      },
      {
        label: 'Due Soon (3 Days)',
        value: duesSoonLoans.length,
        caption: 'Reminders needed',
        color: 'warning',
      },
      {
        label: 'Unpaid Fines',
        value: `₹${totalFines}`,
        caption: `${unpaidFines} pending`,
        color: 'danger',
      },
    ];
  }, [books, members, loans, fines]);

  const recentLoans = loans
    .filter(l => !l.returnedOn)
    .sort((a, b) => new Date(b.issuedOn) - new Date(a.issuedOn))
    .slice(0, 5);

  const getBookTitle = (bookId) => {
    return books.find(b => b.id === bookId)?.title || 'Unknown Book';
  };

  const getMemberName = (memberId) => {
    return members.find(m => m.id === memberId)?.name || 'Unknown Member';
  };

  return (
    <div className="dashboard-container">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">Library Operations</p>
          <h1>Dashboard</h1>
          <p className="hero-copy">
            Overview of library operations, book inventory, and member activity.
          </p>
        </div>
      </section>

      <section className="stats-grid" aria-label="Library summary">
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
              <p className="panel-label">Recent Activity</p>
              <h2>Active Loans</h2>
            </div>
          </div>

          <div className="recent-loans">
            {recentLoans.length > 0 ? (
              recentLoans.map((loan) => {
                const dueDate = new Date(loan.dueOn);
                const today = new Date();
                const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                const isOverdue = daysUntilDue < 0;

                return (
                  <div key={loan.id} className="loan-item">
                    <div className="loan-info">
                      <strong>{getBookTitle(loan.bookId)}</strong>
                      <p>{getMemberName(loan.memberId)}</p>
                      <small>{loan.id}</small>
                    </div>
                    <div className="loan-status">
                      {isOverdue ? (
                        <span className={`badge danger`}>Overdue by {Math.abs(daysUntilDue)} days</span>
                      ) : daysUntilDue <= 3 ? (
                        <span className={`badge warning`}>Due in {daysUntilDue} days</span>
                      ) : (
                        <span className={`badge neutral`}>Due on {loan.dueOn}</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">No active loans</div>
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
            <div className="quick-stat">
              <span>Books in Circulation</span>
              <strong>{books.reduce((sum, b) => sum + b.totalCopies - b.availableCopies, 0)}</strong>
            </div>
            <div className="quick-stat">
              <span>Total Members</span>
              <strong>{members.length}</strong>
            </div>
            <div className="quick-stat">
              <span>Total Transactions</span>
              <strong>{loans.length}</strong>
            </div>
            <div className="quick-stat">
              <span>Completed Loans</span>
              <strong>{loans.filter(l => l.returnedOn).length}</strong>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
