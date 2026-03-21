import { useState, useMemo } from 'react';
import { useLibrary } from '../App';
import './Books.css';

export default function Books() {
  const { books, addBook, updateBook, deleteBook, statusTone } = useLibrary();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Fiction',
    totalCopies: 1,
    shelf: '',
    description: '',
    publicationYear: new Date().getFullYear(),
  });

  const filteredBooks = useMemo(() => {
    let result = books;

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(b =>
        b.title.toLowerCase().includes(query) ||
        b.author.toLowerCase().includes(query) ||
        b.isbn.toLowerCase().includes(query) ||
        b.id.toLowerCase().includes(query)
      );
    }

    if (filterCategory !== 'All') {
      result = result.filter(b => b.category === filterCategory);
    }

    return result;
  }, [books, searchTerm, filterCategory]);

  const categories = useMemo(() => {
    const cats = new Set(books.map(b => b.category));
    return ['All', ...Array.from(cats).sort()];
  }, [books]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title || !formData.author) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingId) {
      updateBook(editingId, formData);
      setEditingId(null);
    } else {
      addBook(formData);
    }

    setFormData({
      title: '',
      author: '',
      isbn: '',
      category: 'Fiction',
      totalCopies: 1,
      shelf: '',
      description: '',
      publicationYear: new Date().getFullYear(),
    });
    setShowForm(false);
  };

  const handleEdit = (book) => {
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      totalCopies: book.totalCopies,
      shelf: book.shelf,
      description: book.description,
      publicationYear: book.publicationYear,
    });
    setEditingId(book.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      title: '',
      author: '',
      isbn: '',
      category: 'Fiction',
      totalCopies: 1,
      shelf: '',
      description: '',
      publicationYear: new Date().getFullYear(),
    });
  };

  return (
    <div className="books-container">
      <section className="page-header">
        <div>
          <p className="eyebrow">Catalog Management</p>
          <h1>Book Inventory</h1>
          <p className="page-description">
            Manage your library's book collection, track availability, and maintain catalog information.
          </p>
        </div>
        <button
          className="primary-button"
          onClick={() => !showForm ? setShowForm(true) : handleCancel()}
        >
          {showForm ? 'Cancel' : '+ Add New Book'}
        </button>
      </section>

      {showForm && (
        <article className="panel form-panel">
          <h2>{editingId ? 'Edit Book' : 'Add New Book'}</h2>
          <form onSubmit={handleSubmit} className="book-form">
            <div className="form-row">
              <label>
                <span>Title *</span>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter book title"
                  required
                />
              </label>

              <label>
                <span>Author *</span>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="Enter author name"
                  required
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                <span>ISBN</span>
                <input
                  type="text"
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  placeholder="Enter ISBN"
                />
              </label>

              <label>
                <span>Publication Year</span>
                <input
                  type="number"
                  value={formData.publicationYear}
                  onChange={(e) => setFormData({ ...formData, publicationYear: parseInt(e.target.value) })}
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                <span>Category</span>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option>Fiction</option>
                  <option>Non-Fiction</option>
                  <option>Self Growth</option>
                  <option>Technology</option>
                  <option>History</option>
                  <option>Science</option>
                  <option>Biography</option>
                </select>
              </label>

              <label>
                <span>Total Copies</span>
                <input
                  type="number"
                  min="1"
                  value={formData.totalCopies}
                  onChange={(e) => setFormData({ ...formData, totalCopies: parseInt(e.target.value) })}
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                <span>Shelf Location</span>
                <input
                  type="text"
                  value={formData.shelf}
                  onChange={(e) => setFormData({ ...formData, shelf: e.target.value })}
                  placeholder="e.g., A-12"
                />
              </label>
            </div>

            <label>
              <span>Description</span>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter book description"
                rows="3"
              ></textarea>
            </label>

            <div className="form-actions">
              <button type="submit" className="primary-button">
                {editingId ? 'Update Book' : 'Add Book'}
              </button>
              <button type="button" className="secondary-button" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        </article>
      )}

      <section className="books-controls">
        <label className="search-field">
          <span className="sr-only">Search books</span>
          <input
            type="search"
            placeholder="Search by title, author, ISBN, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </label>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="filter-select"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </section>

      <div className="books-list">
        {filteredBooks.length > 0 ? (
          filteredBooks.map((book) => {
            const availabilityState = 
              book.availableCopies === 0 ? 'Not Available' :
              book.availableCopies > 2 ? 'Available' : 'Low';

            return (
              <article key={book.id} className="book-card-full">
                <div className="book-details">
                  <div className="book-header">
                    <h3>{book.title}</h3>
                    <span className={`badge ${statusTone[availabilityState]}`}>
                      {availabilityState}
                    </span>
                  </div>

                  <div className="book-meta-info">
                    <p><strong>Author:</strong> {book.author}</p>
                    <p><strong>Category:</strong> {book.category}</p>
                    {book.isbn && <p><strong>ISBN:</strong> {book.isbn}</p>}
                    {book.publicationYear && <p><strong>Year:</strong> {book.publicationYear}</p>}
                    {book.shelf && <p><strong>Shelf:</strong> {book.shelf}</p>}
                  </div>

                  {book.description && (
                    <p className="book-description">{book.description}</p>
                  )}

                  <div className="book-stats">
                    <span className="stat"><strong>{book.totalCopies}</strong> Total Copies</span>
                    <span className="stat"><strong>{book.availableCopies}</strong> Available</span>
                    <span className="stat"><strong>{book.totalCopies - book.availableCopies}</strong> Borrowed</span>
                  </div>
                </div>

                <div className="book-actions">
                  <button
                    className="secondary-button"
                    onClick={() => handleEdit(book)}
                  >
                    Edit
                  </button>
                  <button
                    className="danger-button"
                    onClick={() => {
                      if (window.confirm(`Delete "${book.title}"?`)) {
                        deleteBook(book.id);
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <div className="empty-state">
            No books found {searchTerm && `matching "${searchTerm}"`}
          </div>
        )}
      </div>
    </div>
  );
}
