import { createContext, useContext, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import pages and components
import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import Members from './pages/Members';
import Transactions from './pages/Transactions';
import Fines from './pages/Fines';
import Reports from './pages/Reports';
import Navigation from './components/Navigation';

// Create Library Context
const LibraryContext = createContext();

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within LibraryProvider');
  }
  return context;
};

const initialBooks = [
  {
    id: 'BK-1001',
    title: 'The Midnight Library',
    author: 'Matt Haig',
    isbn: '9780857072077',
    category: 'Fiction',
    totalCopies: 6,
    availableCopies: 2,
    shelf: 'A-12',
    description: 'A mesmerizing novel about all the choices we make.',
    publicationYear: 2020,
  },
  {
    id: 'BK-1002',
    title: 'Atomic Habits',
    author: 'James Clear',
    isbn: '9780735211292',
    category: 'Self Growth',
    totalCopies: 8,
    availableCopies: 5,
    shelf: 'B-04',
    description: 'Transform your habits and revolutionize your life.',
    publicationYear: 2018,
  },
  {
    id: 'BK-1003',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    isbn: '9780132350884',
    category: 'Technology',
    totalCopies: 5,
    availableCopies: 1,
    shelf: 'C-08',
    description: 'A guide to writing code that is clear and maintainable.',
    publicationYear: 2008,
  },
  {
    id: 'BK-1004',
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    isbn: '9780062316097',
    category: 'History',
    totalCopies: 4,
    availableCopies: 3,
    shelf: 'D-02',
    description: 'A brief history of humankind.',
    publicationYear: 2014,
  },
];

const initialMembers = [
  {
    id: 'MB-201',
    name: 'Ananya Singh',
    email: 'ananya.singh@email.com',
    phone: '9876543210',
    membership: 'Student',
    membershipDate: '2024-01-15',
    borrowedCount: 2,
    status: 'Active',
  },
  {
    id: 'MB-202',
    name: 'Rahul Mehta',
    email: 'rahul.mehta@email.com',
    phone: '9876543211',
    membership: 'Faculty',
    membershipDate: '2023-06-20',
    borrowedCount: 1,
    status: 'Active',
  },
  {
    id: 'MB-203',
    name: 'Priya Sharma',
    email: 'priya.sharma@email.com',
    phone: '9876543212',
    membership: 'Researcher',
    membershipDate: '2024-02-10',
    borrowedCount: 0,
    status: 'Review',
  },
];

const initialLoans = [
  {
    id: 'LN-301',
    bookId: 'BK-1001',
    memberId: 'MB-201',
    issuedOn: '2026-03-18',
    dueOn: '2026-03-25',
    returnedOn: null,
    status: 'Due Soon',
  },
  {
    id: 'LN-302',
    bookId: 'BK-1003',
    memberId: 'MB-202',
    issuedOn: '2026-03-14',
    dueOn: '2026-03-20',
    returnedOn: null,
    status: 'Overdue',
  },
  {
    id: 'LN-303',
    bookId: 'BK-1002',
    memberId: 'MB-201',
    issuedOn: '2026-03-20',
    dueOn: '2026-03-29',
    returnedOn: null,
    status: 'Issued',
  },
];

const initialFines = [
  {
    id: 'FN-401',
    memberId: 'MB-202',
    loanId: 'LN-302',
    amount: 50,
    status: 'Unpaid',
    createdOn: '2026-03-21',
    reason: 'Overdue book return',
  },
];

const statusTone = {
  Active: 'positive',
  Review: 'warning',
  Issued: 'neutral',
  'Due Soon': 'warning',
  Overdue: 'danger',
  Available: 'positive',
  Low: 'warning',
  Paid: 'positive',
  Unpaid: 'danger',
  Pending: 'warning',
};

export function LibraryProvider({ children }) {
  const [books, setBooks] = useState(initialBooks);
  const [members, setMembers] = useState(initialMembers);
  const [loans, setLoans] = useState(initialLoans);
  const [fines, setFines] = useState(initialFines);

  // Books operations
  const addBook = (bookData) => {
    const newBook = {
      id: `BK-${1000 + books.length + 1}`,
      ...bookData,
      availableCopies: bookData.totalCopies,
    };
    setBooks([...books, newBook]);
    return newBook;
  };

  const updateBook = (bookId, updates) => {
    setBooks(books.map(b => b.id === bookId ? { ...b, ...updates } : b));
  };

  const deleteBook = (bookId) => {
    setBooks(books.filter(b => b.id !== bookId));
  };

  // Members operations
  const addMember = (memberData) => {
    const newMember = {
      id: `MB-${200 + members.length + 1}`,
      ...memberData,
      borrowedCount: 0,
      status: 'Active',
      membershipDate: new Date().toISOString().slice(0, 10),
    };
    setMembers([...members, newMember]);
    return newMember;
  };

  const updateMember = (memberId, updates) => {
    setMembers(members.map(m => m.id === memberId ? { ...m, ...updates } : m));
  };

  const deleteMember = (memberId) => {
    setMembers(members.filter(m => m.id !== memberId));
  };

  // Loan operations
  const issueBook = (bookId, memberId) => {
    const book = books.find(b => b.id === bookId);
    const member = members.find(m => m.id === memberId);

    if (!book || !member || book.availableCopies < 1) {
      return null;
    }

    const issuedOn = new Date();
    const dueOn = new Date(issuedOn);
    dueOn.setDate(dueOn.getDate() + 14);

    const newLoan = {
      id: `LN-${300 + loans.length + 1}`,
      bookId,
      memberId,
      issuedOn: issuedOn.toISOString().slice(0, 10),
      dueOn: dueOn.toISOString().slice(0, 10),
      returnedOn: null,
      status: 'Issued',
    };

    setLoans([newLoan, ...loans]);
    updateBook(bookId, { availableCopies: book.availableCopies - 1 });
    updateMember(memberId, { borrowedCount: member.borrowedCount + 1 });
    
    return newLoan;
  };

  const returnBook = (loanId) => {
    const loan = loans.find(l => l.id === loanId);

    if (!loan) {
      return false;
    }

    const returnedOn = new Date().toISOString().slice(0, 10);
    const dueDate = new Date(loan.dueOn);
    const today = new Date();
    const isOverdue = today > dueDate;

    setLoans(loans.map(l => 
      l.id === loanId 
        ? { ...l, returnedOn, status: 'Returned' } 
        : l
    ));

    const book = books.find(b => b.id === loan.bookId);
    if (book) {
      updateBook(loan.bookId, { availableCopies: book.availableCopies + 1 });
    }

    const member = members.find(m => m.id === loan.memberId);
    if (member && member.borrowedCount > 0) {
      updateMember(loan.memberId, { borrowedCount: member.borrowedCount - 1 });
    }

    if (isOverdue) {
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      const fineAmount = daysOverdue * 10;
      
      const newFine = {
        id: `FN-${400 + fines.length + 1}`,
        memberId: loan.memberId,
        loanId: loan.id,
        amount: fineAmount,
        status: 'Unpaid',
        createdOn: returnedOn,
        reason: `Overdue by ${daysOverdue} days`,
      };
      setFines([newFine, ...fines]);
    }

    return true;
  };

  // Fine operations
  const payFine = (fineId) => {
    setFines(fines.map(f => f.id === fineId ? { ...f, status: 'Paid' } : f));
  };

  const getLoansByMember = (memberId) => {
    return loans.filter(l => l.memberId === memberId);
  };

  const getBookLoans = (bookId) => {
    return loans.filter(l => l.bookId === bookId);
  };

  const calculateStats = () => {
    const totalBooks = books.reduce((sum, b) => sum + b.totalCopies, 0);
    const availableBooks = books.reduce((sum, b) => sum + b.availableCopies, 0);
    const overdueLoans = loans.filter(l => {
      if (l.returnedOn) return false;
      return new Date() > new Date(l.dueOn);
    }).length;
    const activeMembers = members.filter(m => m.status === 'Active').length;
    const unpaidFines = fines.filter(f => f.status === 'Unpaid').length;

    return {
      totalBooks,
      availableBooks,
      borrowedBooks: totalBooks - availableBooks,
      overdueLoans,
      activeMembers,
      totalMembers: members.length,
      unpaidFines,
      totalLoans: loans.length,
      completedLoans: loans.filter(l => l.returnedOn).length,
    };
  };

  const value = {
    books,
    members,
    loans,
    fines,
    statusTone,
    addBook,
    updateBook,
    deleteBook,
    addMember,
    updateMember,
    deleteMember,
    issueBook,
    returnBook,
    payFine,
    getLoansByMember,
    getBookLoans,
    calculateStats,
  };

  return (
    <LibraryContext.Provider value={value}>
      {children}
    </LibraryContext.Provider>
  );
}

function AppContent() {
  return (
    <main className="app-shell">
      <Navigation />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/books" element={<Books />} />
        <Route path="/members" element={<Members />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/fines" element={<Fines />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </main>
  );
}

export default function App() {
  return (
    <Router>
      <LibraryProvider>
        <AppContent />
      </LibraryProvider>
    </Router>
  );
}
