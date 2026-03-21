import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

export default function Navigation() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <span className="nav-icon">📚</span>
          Genius Tech Library System
        </Link>

        <ul className="nav-menu">
          <li>
            <Link to="/" className={`nav-link ${isActive('/')}`}>
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/books" className={`nav-link ${isActive('/books')}`}>
              Books
            </Link>
          </li>
          <li>
            <Link to="/members" className={`nav-link ${isActive('/members')}`}>
              Members
            </Link>
          </li>
          <li>
            <Link to="/transactions" className={`nav-link ${isActive('/transactions')}`}>
              Transactions
            </Link>
          </li>
          <li>
            <Link to="/fines" className={`nav-link ${isActive('/fines')}`}>
              Fines
            </Link>
          </li>
          <li>
            <Link to="/reports" className={`nav-link ${isActive('/reports')}`}>
              Reports
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
