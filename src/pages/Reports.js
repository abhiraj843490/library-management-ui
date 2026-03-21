import { useMemo } from 'react';
import { useLibrary } from '../App';
import './Reports.css';

export default function Reports() {
  const { books, members, loans, fines } = useLibrary();

  const reports = useMemo(() => {
    const today = new Date();

    // Category distribution
    const categoryDist = {};
    books.forEach(book => {
      categoryDist[book.category] = (categoryDist[book.category] || 0) + 1;
    });

    // Member distribution
    const membershipDist = {};
    members.forEach(member => {
      membershipDist[member.membership] = (membershipDist[member.membership] || 0) + 1;
    });

    // Overdue analysis
    const overdueLoans = loans.filter(l => {
      if (l.returnedOn) return false;
      return new Date(l.dueOn) < today;
    });

    const duesSoon = loans.filter(l => {
      if (l.returnedOn) return false;
      const dueDate = new Date(l.dueOn);
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 7 && daysUntilDue > 0;
    });

    // Most borrowed books
    const bookBorrowCount = {};
    loans.forEach(loan => {
      bookBorrowCount[loan.bookId] = (bookBorrowCount[loan.bookId] || 0) + 1;
    });

    const mostBorrowed = Object.entries(bookBorrowCount)
      .map(([bookId, count]) => ({
        bookId,
        title: books.find(b => b.id === bookId)?.title,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Most active members
    const memberLoans = {};
    loans.forEach(loan => {
      memberLoans[loan.memberId] = (memberLoans[loan.memberId] || 0) + 1;
    });

    const mostActive = Object.entries(memberLoans)
      .map(([memberId, count]) => ({
        memberId,
        name: members.find(m => m.id === memberId)?.name,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Book availability
    const availabilityStats = {
      lowStock: books.filter(b => b.availableCopies < 2).length,
      outOfStock: books.filter(b => b.availableCopies === 0).length,
      wellStocked: books.filter(b => b.availableCopies > 3).length,
    };

    // Fine statistics
    const fineStats = {
      unpaidFines: fines.filter(f => f.status === 'Unpaid').length,
      totalUnpaid: fines.filter(f => f.status === 'Unpaid').reduce((sum, f) => sum + f.amount, 0),
      totalPaid: fines.filter(f => f.status === 'Paid').reduce((sum, f) => sum + f.amount, 0),
    };

    return {
      categoryDist,
      membershipDist,
      overdueLoans: overdueLoans.length,
      duesSoon: duesSoon.length,
      mostBorrowed,
      mostActive,
      availabilityStats,
      fineStats,
    };
  }, [books, members, loans, fines]);

  return (
    <div className="reports-container">
      <section className="page-header">
        <div>
          <p className="eyebrow">Analytics & Reports</p>
          <h1>Library Reports</h1>
          <p className="page-description">
            Comprehensive analytics and insights into library operations and member activity.
          </p>
        </div>
      </section>

      <section className="reports-grid">
        <article className="report-card">
          <h3>📚 Catalog Analysis</h3>
          <div className="report-content">
            <h4>Books by Category</h4>
            <ul className="report-list">
              {Object.entries(reports.categoryDist)
                .sort((a, b) => b[1] - a[1])
                .map(([category, count]) => (
                  <li key={category}>
                    <span>{category}</span>
                    <strong>{count} books</strong>
                  </li>
                ))}
            </ul>
          </div>
        </article>

        <article className="report-card">
          <h3>🧑‍🤝 Member Demographics</h3>
          <div className="report-content">
            <h4>Members by Type</h4>
            <ul className="report-list">
              {Object.entries(reports.membershipDist)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => (
                  <li key={type}>
                    <span>{type}</span>
                    <strong>{count} members</strong>
                  </li>
                ))}
            </ul>
          </div>
        </article>

        <article className="report-card highlight">
          <h3>⚠️ Overdue Review</h3>
          <div className="report-content">
            <div className="metric">
              <span>Overdue Loans</span>
              <strong className="danger">{reports.overdueLoans}</strong>
            </div>
            <div className="metric">
              <span>Due in Next 7 Days</span>
              <strong className="warning">{reports.duesSoon}</strong>
            </div>
            <div className="metric">
              <span>Action Required</span>
              <strong>{reports.overdueLoans + reports.duesSoon}</strong>
            </div>
          </div>
        </article>

        <article className="report-card">
          <h3>📊 Availability Status</h3>
          <div className="report-content">
            <div className="metric">
              <span>Well Stocked (3 copies)</span>
              <strong className="positive">{reports.availabilityStats.wellStocked}</strong>
            </div>
            <div className="metric">
              <span>Low Stock (1-3 copies)</span>
              <strong className="warning">{reports.availabilityStats.lowStock}</strong>
            </div>
            <div className="metric">
              <span>Out of Stock</span>
              <strong className="danger">{reports.availabilityStats.outOfStock}</strong>
            </div>
          </div>
        </article>

        <article className="report-card">
          <h3>💰 Fine Collections</h3>
          <div className="report-content">
            <div className="metric">
              <span>Unpaid Fines</span>
              <strong className="danger">₹{reports.fineStats.totalUnpaid}</strong>
            </div>
            <div className="metric">
              <span>Paid Amount</span>
              <strong className="positive">₹{reports.fineStats.totalPaid}</strong>
            </div>
            <div className="metric">
              <span>Pending Count</span>
              <strong>{reports.fineStats.unpaidFines}</strong>
            </div>
          </div>
        </article>

        <article className="report-card">
          <h3>📈 Overall Summary</h3>
          <div className="report-content">
            <div className="metric">
              <span>Total Books</span>
              <strong>{books.length}</strong>
            </div>
            <div className="metric">
              <span>Total Members</span>
              <strong>{members.length}</strong>
            </div>
            <div className="metric">
              <span>Total Loans</span>
              <strong>{loans.length}</strong>
            </div>
            <div className="metric">
              <span>Active Loans</span>
              <strong>{loans.filter(l => !l.returnedOn).length}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="reports-detailed">
        <article className="detailed-card">
          <h3>🏆 Most Borrowed Books</h3>
          <table className="detailed-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Book Title</th>
                <th>Times Borrowed</th>
              </tr>
            </thead>
            <tbody>
              {reports.mostBorrowed.map((item, idx) => (
                <tr key={item.bookId}>
                  <td className="rank">#{idx + 1}</td>
                  <td>{item.title}</td>
                  <td className="highlight-value">{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {reports.mostBorrowed.length === 0 && (
            <p className="empty-msg">No borrowing data available</p>
          )}
        </article>

        <article className="detailed-card">
          <h3>⭐ Most Active Members</h3>
          <table className="detailed-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Member Name</th>
                <th>Books Borrowed</th>
              </tr>
            </thead>
            <tbody>
              {reports.mostActive.map((item, idx) => (
                <tr key={item.memberId}>
                  <td className="rank">#{idx + 1}</td>
                  <td>{item.name}</td>
                  <td className="highlight-value">{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {reports.mostActive.length === 0 && (
            <p className="empty-msg">No member activity data available</p>
          )}
        </article>
      </section>
    </div>
  );
}
