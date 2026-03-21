import { useState, useMemo } from 'react';
import { useLibrary } from '../App';
import './Transactions.css';

export default function Transactions() {
  const { books, members, loans, issueBook, returnBook, statusTone } = useLibrary();
  const [selectedBookId, setSelectedBookId] = useState(books[0]?.id || '');
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || '');
  const [filterStatus, setFilterStatus] = useState('Issued');
  const [filterMember, setFilterMember] = useState('All');

  const filteredLoans = useMemo(() => {
    let result = loans;

    if (filterStatus !== 'All') {
      result = result.filter(l => {
        if (filterStatus === 'Issued') {
          return !l.returnedOn;
        } else if (filterStatus === 'Returned') {
          return l.returnedOn;
        }
        return true;
      });
    }

    if (filterMember !== 'All') {
      result = result.filter(l => l.memberId === filterMember);
    }

    return result.sort((a, b) => new Date(b.issuedOn) - new Date(a.issuedOn));
  }, [loans, filterStatus, filterMember]);

  const activeLoans = loans.filter(l => !l.returnedOn);
  const returnedLoans = loans.filter(l => l.returnedOn);

  const handleIssueBook = () => {
    if (!selectedBookId || !selectedMemberId) {
      alert('Please select both book and member');
      return;
    }

    const book = books.find(b => b.id === selectedBookId);
    const member = members.find(m => m.id === selectedMemberId);

    if (!book || !member) {
      alert('Invalid book or member selection');
      return;
    }

    if (book.availableCopies < 1) {
      alert('No copies available for this book');
      return;
    }

    const result = issueBook(selectedBookId, selectedMemberId);
    if (result) {
      alert(`Book "${book.title}" issued to ${member.name}`);
    }
  };

  const handleReturnBook = (loanId) => {
    const loan = loans.find(l => l.id === loanId);
    const book = books.find(b => b.id === loan.bookId);
    const member = members.find(m => m.id === loan.memberId);

    if (returnBook(loanId)) {
      alert(`Book "${book.title}" returned by ${member.name}`);
    }
  };

  const getDaysOverdue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diff = Math.floor((today - due) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const getBookById = (bookId) => books.find(b => b.id === bookId);
  const getMemberById = (memberId) => members.find(m => m.id === memberId);

  return (
    <div className="transactions-container">
      <section className="page-header">
        <div>
          <p className="eyebrow">Transaction Management</p>
          <h1>Books Transactions</h1>
          <p className="page-description">
            Issue books to members, process returns, and track all lending transactions.
          </p>
        </div>
      </section>

      <section className="transactions-grid">
        <article className="panel">
          <div className="panel-head compact">
            <p className="panel-label">New Transaction</p>
            <h2>Issue a Book</h2>
          </div>

          <form className="issue-form" onSubmit={(e) => { e.preventDefault(); handleIssueBook(); }}>
            <label>
              <span>Select Book *</span>
              <select
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
              >
                {books.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title} ({book.availableCopies} available)
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Select Member *</span>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
              >
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.membership})
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="primary-button"
              disabled={
                !books.find((b) => b.id === selectedBookId)?.availableCopies
              }
            >
              Issue Book
            </button>
          </form>

          {selectedBookId && selectedMemberId && (
            <div className="insight-card">
              <span>Selected Title</span>
              <strong>{getBookById(selectedBookId)?.title}</strong>
              <small>
                {getBookById(selectedBookId)?.availableCopies} copies available for{' '}
                {getMemberById(selectedMemberId)?.name}
              </small>
            </div>
          )}
        </article>

        <article className="panel">
          <div className="panel-head compact">
            <p className="panel-label">Statistics</p>
            <h2>Transaction Stats</h2>
          </div>

          <div className="stats-summary">
            <div className="stat-item">
              <span>Active Loans</span>
              <strong>{activeLoans.length}</strong>
            </div>
            <div className="stat-item">
              <span>Returned Books</span>
              <strong>{returnedLoans.length}</strong>
            </div>
            <div className="stat-item">
              <span>Total Transactions</span>
              <strong>{loans.length}</strong>
            </div>
            <div className="stat-item">
              <span>Overdue Items</span>
              <strong className="text-danger">
                {loans.filter(l => !l.returnedOn && new Date(l.dueOn) < new Date()).length}
              </strong>
            </div>
          </div>
        </article>
      </section>

      <section className="transactions-controls">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="All">All Loans</option>
          <option value="Issued">Active Loans</option>
          <option value="Returned">Returned Loans</option>
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

      <div className="transactions-table-wrapper">
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Loan ID</th>
              <th>Book</th>
              <th>Member</th>
              <th>Issued</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredLoans.map((loan) => {
              const book = getBookById(loan.bookId);
              const member = getMemberById(loan.memberId);
              const isOverdue = !loan.returnedOn && new Date(loan.dueOn) < new Date();
              const daysOverdue = isOverdue ? getDaysOverdue(loan.dueOn) : 0;
              const daysUntilDue = !loan.returnedOn ? getDaysUntilDue(loan.dueOn) : 0;

              let status = 'Issued';
              if (loan.returnedOn) {
                status = 'Returned';
              } else if (isOverdue) {
                status = 'Overdue';
              } else if (daysUntilDue <= 3) {
                status = 'Due Soon';
              }

              return (
                <tr key={loan.id} className={`loan-row ${status.toLowerCase()}`}>
                  <td><strong>{loan.id}</strong></td>
                  <td>{book?.title || 'Unknown'}</td>
                  <td>{member?.name || 'Unknown'}</td>
                  <td>{loan.issuedOn}</td>
                  <td>{loan.dueOn}</td>
                  <td>
                    <span className={`badge ${statusTone[status]}`}>
                      {status}
                      {isOverdue && ` (${daysOverdue}d)`}
                      {!isOverdue && daysUntilDue <= 3 && ` (${daysUntilDue}d)`}
                    </span>
                  </td>
                  <td>
                    {!loan.returnedOn && (
                      <button
                        className="secondary-button"
                        onClick={() => handleReturnBook(loan.id)}
                      >
                        Return Book
                      </button>
                    )}
                    {loan.returnedOn && (
                      <span className="text-muted">Returned on {loan.returnedOn}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredLoans.length === 0 && (
          <div className="empty-state">No transactions found</div>
        )}
      </div>
    </div>
  );
}
