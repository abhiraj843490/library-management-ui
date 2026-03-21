import { useState, useMemo } from 'react';
import { useLibrary } from '../App';
import './Fines.css';

export default function Fines() {
  const { fines, members, loans, books, payFine, statusTone } = useLibrary();
  const [filterStatus, setFilterStatus] = useState('Unpaid');
  const [filterMember, setFilterMember] = useState('All');

  const filteredFines = useMemo(() => {
    let result = fines;

    if (filterStatus !== 'All') {
      result = result.filter(f => f.status === filterStatus);
    }

    if (filterMember !== 'All') {
      result = result.filter(f => f.memberId === filterMember);
    }

    return result.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn));
  }, [fines, filterStatus, filterMember]);

  const stats = useMemo(() => {
    const unpaid = fines.filter(f => f.status === 'Unpaid');
    const paid = fines.filter(f => f.status === 'Paid');
    const totalUnpaid = unpaid.reduce((sum, f) => sum + f.amount, 0);
    const totalPaid = paid.reduce((sum, f) => sum + f.amount, 0);

    return {
      totalUnpaid,
      totalPaid,
      totalAmount: totalUnpaid + totalPaid,
      unpaidCount: unpaid.length,
      paidCount: paid.length,
    };
  }, [fines]);

  const getMemberName = (memberId) => {
    return members.find(m => m.id === memberId)?.name || 'Unknown Member';
  };

  const getBookTitle = (bookId) => {
    return books.find(b => b.id === bookId)?.title || 'Unknown Book';
  };

  const getLoanInfo = (loanId) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return null;
    return {
      bookTitle: getBookTitle(loan.bookId),
      dueOn: loan.dueOn,
      returnedOn: loan.returnedOn,
    };
  };

  const handlePayFine = (fineId) => {
    const fine = fines.find(f => f.id === fineId);
    if (fine && window.confirm(`Mark fine of ₹${fine.amount} as paid?`)) {
      payFine(fineId);
      alert('Fine payment recorded successfully');
    }
  };

  return (
    <div className="fines-container">
      <section className="page-header">
        <div>
          <p className="eyebrow">Fine Management</p>
          <h1>Member Fines</h1>
          <p className="page-description">
            Track and manage fines for overdue books and other library charges.
          </p>
        </div>
      </section>

      <section className="fines-stats">
        <article className="stat-card">
          <span className="stat-label">Unpaid Fines</span>
          <strong className="stat-value danger">₹{stats.totalUnpaid}</strong>
          <small className="stat-caption">{stats.unpaidCount} pending</small>
        </article>

        <article className="stat-card">
          <span className="stat-label">Paid Fines</span>
          <strong className="stat-value positive">₹{stats.totalPaid}</strong>
          <small className="stat-caption">{stats.paidCount} completed</small>
        </article>

        <article className="stat-card">
          <span className="stat-label">Total Amount</span>
          <strong className="stat-value">₹{stats.totalAmount}</strong>
          <small className="stat-caption">All time total</small>
        </article>

        <article className="stat-card">
          <span className="stat-label">Collection Rate</span>
          <strong className="stat-value">
            {stats.totalAmount > 0 
              ? Math.round((stats.totalPaid / stats.totalAmount) * 100) 
              : 0}%
          </strong>
          <small className="stat-caption">Payment ratio</small>
        </article>
      </section>

      <section className="fines-controls">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="All">All Fines</option>
          <option value="Unpaid">Unpaid Only</option>
          <option value="Paid">Paid Only</option>
        </select>

        <select
          value={filterMember}
          onChange={(e) => setFilterMember(e.target.value)}
          className="filter-select"
        >
          <option value="All">All Members</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </section>

      <div className="fines-list">
        {filteredFines.length > 0 ? (
          filteredFines.map((fine) => {
            const loanInfo = getLoanInfo(fine.loanId);

            return (
              <article key={fine.id} className="fine-card">
                <div className="fine-header">
                  <div>
                    <h3>{getMemberName(fine.memberId)}</h3>
                    <p className="fine-id">{fine.id}</p>
                  </div>
                  <span className={`badge ${statusTone[fine.status]}`}>
                    {fine.status}
                  </span>
                </div>

                <div className="fine-details">
                  <p><strong>Amount:</strong> ₹{fine.amount}</p>
                  <p><strong>Reason:</strong> {fine.reason}</p>
                  {loanInfo && (
                    <>
                      <p><strong>Book:</strong> {loanInfo.bookTitle}</p>
                      <p><strong>Due Date:</strong> {loanInfo.dueOn}</p>
                    </>
                  )}
                  <p><strong>Created On:</strong> {new Date(fine.createdOn).toLocaleDateString()}</p>
                </div>

                {fine.status === 'Unpaid' && (
                  <button
                    className="primary-button"
                    onClick={() => handlePayFine(fine.id)}
                  >
                    Mark as Paid
                  </button>
                )}

                {fine.status === 'Paid' && (
                  <div className="fine-paid-note">
                    ✓ Payment received and recorded
                  </div>
                )}
              </article>
            );
          })
        ) : (
          <div className="empty-state">
            No fines found
          </div>
        )}
      </div>
    </div>
  );
}
