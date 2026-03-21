import { useState } from 'react';
import { useLibrary } from '../App';
import './Members.css';

export default function Members() {
  const { members, addMember, updateMember, deleteMember, statusTone } = useLibrary();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    membership: 'Student',
    status: 'Active',
  });

  const filteredMembers = members
    .filter(m => {
      const query = searchTerm.toLowerCase();
      return (
        m.name.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query) ||
        m.phone.includes(query) ||
        m.id.toLowerCase().includes(query)
      );
    })
    .filter(m => filterStatus === 'All' || m.status === filterStatus);

  const membershipTypes = ['Student', 'Faculty', 'Staff', 'Researcher', 'Visitor'];
  const statusOptions = ['Active', 'Inactive', 'Review', 'Suspended'];

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingId) {
      updateMember(editingId, formData);
      setEditingId(null);
    } else {
      addMember(formData);
    }

    setFormData({
      name: '',
      email: '',
      phone: '',
      membership: 'Student',
    });
    setShowForm(false);
  };

  const handleEdit = (member) => {
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone,
      membership: member.membership,
      status: member.status,
    });
    setEditingId(member.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      membership: 'Student',
      status: 'Active',
    });
  };

  return (
    <div className="members-container">
      <section className="page-header">
        <div>
          <p className="eyebrow">Member Management</p>
          <h1>Members Directory</h1>
          <p className="page-description">
            Manage library members, track their borrowing history, and maintain contact information.
          </p>
        </div>
        <button
          className="primary-button"
          onClick={() => !showForm ? setShowForm(true) : handleCancel()}
        >
          {showForm ? 'Cancel' : '+ Add New Member'}
        </button>
      </section>

      {showForm && (
        <article className="panel form-panel">
          <h2>{editingId ? 'Edit Member' : 'Add New Member'}</h2>
          <form onSubmit={handleSubmit} className="member-form">
            <div className="form-row">
              <label>
                <span>Name *</span>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter member name"
                  required
                />
              </label>

              <label>
                <span>Email *</span>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                  required
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                <span>Phone</span>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </label>

              <label>
                <span>Membership Type</span>
                <select
                  value={formData.membership}
                  onChange={(e) => setFormData({ ...formData, membership: e.target.value })}
                >
                  {membershipTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="form-row">
              <label>
                <span>Member Status</span>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-button">
                {editingId ? 'Update Member' : 'Add Member'}
              </button>
              <button type="button" className="secondary-button" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        </article>
      )}

      <section className="members-controls">
        <label className="search-field">
          <span className="sr-only">Search members</span>
          <input
            type="search"
            placeholder="Search by name, email, phone, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </label>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="All">All Status</option>
          {statusOptions.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </section>

      <div className="members-grid">
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member) => (
            <article key={member.id} className="member-card">
              <div className="member-header">
                <div>
                  <h3>{member.name}</h3>
                  <p className="member-id">{member.id}</p>
                </div>
                <span className={`badge ${statusTone[member.status]}`}>
                  {member.status}
                </span>
              </div>

              <div className="member-info">
                <p><strong>Email:</strong> {member.email}</p>
                {member.phone && <p><strong>Phone:</strong> {member.phone}</p>}
                <p><strong>Type:</strong> {member.membership}</p>
                {member.membershipDate && (
                  <p><strong>Member Since:</strong> {new Date(member.membershipDate).toLocaleDateString()}</p>
                )}
              </div>

              <div className="member-stats">
                <div className="stat">
                  <span>Books Borrowed</span>
                  <strong>{member.borrowedCount}</strong>
                </div>
              </div>

              <div className="member-actions">
                <button
                  className="secondary-button"
                  onClick={() => handleEdit(member)}
                >
                  Edit
                </button>
                <button
                  className="danger-button"
                  onClick={() => {
                    if (window.confirm(`Delete "${member.name}"?`)) {
                      deleteMember(member.id);
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">
            No members found {searchTerm && `matching "${searchTerm}"`}
          </div>
        )}
      </div>
    </div>
  );
}
