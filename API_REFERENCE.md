# Genius Tech Library System - API Reference & Data Structure

This document describes the data structure and API endpoints for the Genius Tech Library System.

---

## 📊 Data Structures

### 1. Book Object

```javascript
{
  id: "BK-1001",                    // Auto-generated ID format: BK-XXXX
  title: "The Midnight Library",    // Book title (required)
  author: "Matt Haig",              // Author name (required)
  isbn: "9780857072077",            // ISBN code (optional)
  category: "Fiction",               // Category (required)
  totalCopies: 6,                   // Total copies in library
  availableCopies: 2,               // Currently available (auto-calculated)
  shelf: "A-12",                    // Shelf location (optional)
  description: "A mesmerizing...",  // Book description (optional)
  publicationYear: 2020             // Publication year (optional)
}
```

**Categories Available**:
- Fiction
- Non-Fiction
- Self Growth
- Technology
- History
- Science
- Biography

---

### 2. Member Object

```javascript
{
  id: "MB-201",                     // Auto-generated ID format: MB-XXX
  name: "Ananya Singh",             // Member name (required)
  email: "ananya.singh@email.com",  // Email address (required)
  phone: "9876543210",              // Phone number (optional)
  membership: "Student",             // Type (required)
  membershipDate: "2024-01-15",     // Date joined (auto-set)
  borrowedCount: 2,                 // Currently borrowed books (auto-updated)
  status: "Active"                  // Status (auto-set)
}
```

**Membership Types**:
- Student
- Faculty
- Staff
- Researcher
- Visitor

**Member Status**:
- Active (can borrow)
- Inactive (cannot borrow)
- Review (under review)
- Suspended (blocked)

---

### 3. Loan Object

```javascript
{
  id: "LN-301",                     // Auto-generated ID format: LN-XXX
  bookId: "BK-1001",                // Reference to Book
  memberId: "MB-201",               // Reference to Member
  issuedOn: "2026-03-18",           // Loan date (auto-set)
  dueOn: "2026-03-25",              // Due date (+14 days from issue)
  returnedOn: null,                 // Return date (null if not returned)
  status: "Issued"                  // Status (auto-calculated)
}
```

**Loan Status** (Auto-calculated):
- **Issued**: Book borrowed, not due yet
- **Due Soon**: Due within next 3 days (warning)
- **Overdue**: Past due date (requires action)
- **Returned**: Book returned by member

**Status Logic**:
```javascript
if (returnedOn) {
  status = "Returned"
} else if (dueOn < today) {
  status = "Overdue"
} else if (daysUntilDue <= 3) {
  status = "Due Soon"
} else {
  status = "Issued"
}
```

---

### 4. Fine Object

```javascript
{
  id: "FN-401",                      // Auto-generated ID format: FN-XXX
  memberId: "MB-202",                // Reference to Member
  loanId: "LN-302",                  // Reference to Loan
  amount: 50,                        // Fine amount (calculated)
  status: "Unpaid",                  // Status (Paid/Unpaid)
  createdOn: "2026-03-21",           // When fine was created
  reason: "Overdue book return"      // Reason description
}
```

**Fine Calculation**:
```javascript
daysOverdue = floor((today - dueDate) / (1000 * 60 * 60 * 24))
amount = daysOverdue * 10  // ₹10 per day
```

**Fine Status**:
- **Unpaid**: Outstanding fine
- **Paid**: Fine paid and cleared

---

## 🔌 API Endpoints (For Backend Integration)

### Books Endpoints

**GET /api/books**
```javascript
// Get all books
Response: [{
  id: "BK-1001",
  title: "...",
  ...
}]
```

**GET /api/books/:id**
```javascript
// Get specific book
Response: {
  id: "BK-1001",
  ...
}
```

**POST /api/books**
```javascript
// Add new book
Body: {
  title: "New Book",
  author: "Author Name",
  category: "Fiction",
  totalCopies: 5,
  ...
}
Response: {
  id: "BK-XXXX",
  ...
}
```

**PUT /api/books/:id**
```javascript
// Update book
Body: {
  title: "Updated Title",
  available Copies: 3,
  ...
}
Response: {
  id: "BK-1001",
  ...
}
```

**DELETE /api/books/:id**
```javascript
// Delete book
Response: { success: true }
```

---

### Members Endpoints

**GET /api/members**
```javascript
// Get all members
Response: [{
  id: "MB-201",
  name: "...",
  ...
}]
```

**GET /api/members/:id**
```javascript
// Get specific member
Response: {
  id: "MB-201",
  ...
}
```

**POST /api/members**
```javascript
// Register new member
Body: {
  name: "Member Name",
  email: "email@example.com",
  phone: "9876543210",
  membership: "Student"
}
Response: {
  id: "MB-XXX",
  ...
}
```

**PUT /api/members/:id**
```javascript
// Update member
Body: {
  status: "Suspended",
  ...
}
Response: {
  id: "MB-201",
  ...
}
```

**DELETE /api/members/:id**
```javascript
// Delete member
Response: { success: true }
```

---

### Loans/Transactions Endpoints

**GET /api/loans**
```javascript
// Get all loans
Response: [{
  id: "LN-301",
  status: "Issued",
  ...
}]
```

**POST /api/loans**
```javascript
// Issue book (create loan)
Body: {
  bookId: "BK-1001",
  memberId: "MB-201"
}
Response: {
  id: "LN-XXX",
  issuedOn: "2026-03-21",
  dueOn: "2026-04-04",
  ...
}
```

**PUT /api/loans/:id/return**
```javascript
// Return book
Response: {
  id: "LN-301",
  returnedOn: "2026-03-28",
  status: "Returned",
  fineGenerated: {
    id: "FN-XXX",
    amount: 30,
    ...
  }
}
```

**GET /api/loans/member/:memberId**
```javascript
// Get loans for specific member
Response: [{
  id: "LN-301",
  bookId: "BK-1001",
  ...
}]
```

**GET /api/loans/book/:bookId**
```javascript
// Get all loans for specific book
Response: [{
  id: "LN-301",
  memberId: "MB-201",
  ...
}]
```

---

### Fines Endpoints

**GET /api/fines**
```javascript
// Get all fines
Response: [{
  id: "FN-401",
  status: "Unpaid",
  ...
}]
```

**GET /api/fines/member/:memberId**
```javascript
// Get fines for specific member
Response: [{
  id: "FN-401",
  ...
}]
```

**PUT /api/fines/:id/pay**
```javascript
// Mark fine as paid
Response: {
  id: "FN-401",
  status: "Paid",
  paidOn: "2026-03-21",
  ...
}
```

---

### Statistics/Reports Endpoints

**GET /api/stats**
```javascript
// Get library statistics
Response: {
  totalBooks: 250,
  availableBooks: 150,
  totalMembers: 80,
  activeMembers: 75,
  totalLoans: 245,
  activeLoans: 45,
  overdueLoans: 3,
  unpaidFines: 5,
  totalUnpaidAmount: 450
}
```

**GET /api/reports/books-by-category**
```javascript
// Books distribution by category
Response: {
  "Fiction": 45,
  "Technology": 32,
  "Self Growth": 28,
  ...
}
```

**GET /api/reports/members-by-type**
```javascript
// Members distribution by type
Response: {
  "Student": 45,
  "Faculty": 20,
  "Researcher": 10,
  ...
}
```

**GET /api/reports/most-borrowed**
```javascript
// Top 5 borrowed books
Response: [{
  bookId: "BK-1001",
  title: "The Midnight Library",
  count: 12
}, ...]
```

**GET /api/reports/most-active-members**
```javascript
// Top 5 active members
Response: [{
  memberId: "MB-201",
  name: "Ananya Singh",
  borrowedBooks: 8
}, ...]
```

---

## 🔄 Transaction Workflows

### Issue Book Workflow
```
POST /api/loans
├─ Validate: Book exists & has availability
├─ Validate: Member exists & is active
├─ Create Loan
│  ├─ Set issuedOn = today
│  ├─ Set dueOn = today + 14 days
│  ├─ Set status = "Issued"
│  └─ Set returnedOn = null
├─ Update Book
│  └─ availableCopies = availableCopies - 1
└─ Update Member
   └─ borrowedCount = borrowedCount + 1
```

### Return Book Workflow
```
PUT /api/loans/:id/return
├─ Get Loan details
├─ Update Loan
│  ├─ Set returnedOn = today
│  └─ Set status = "Returned"
├─ Update Book
│  └─ availableCopies = availableCopies + 1
├─ Update Member
│  └─ borrowedCount = borrowedCount - 1
└─ IF (today > dueDate)
   ├─ Calculate: daysOverdue
   ├─ Calculate: amount = daysOverdue × 10
   └─ POST /api/fines
      └─ Create Fine record
```

---

## 🔐 Error Responses

### Standard Error Response
```javascript
{
  success: false,
  error: "Error message",
  code: "ERROR_CODE",
  timestamp: "2026-03-21T10:30:00Z"
}
```

### Common Errors

**400 Bad Request**
```javascript
{
  error: "Invalid input data",
  code: "INVALID_INPUT"
}
```

**404 Not Found**
```javascript
{
  error: "Book not found",
  code: "RESOURCE_NOT_FOUND"
}
```

**409 Conflict**
```javascript
{
  error: "Book not available",
  code: "NO_AVAILABILITY"
}
```

**422 Unprocessable Entity**
```javascript
{
  error: "Validation failed",
  code: "VALIDATION_ERROR",
  details: {
    title: "Title is required",
    author: "Author is required"
  }
}
```

---

## 📝 Validation Rules

### Books
- `title`: Required, string, 1-255 characters
- `author`: Required, string, 1-255 characters
- `isbn`: Optional, string, valid ISBN format
- `category`: Required, must be in allowed categories
- `totalCopies`: Required, number >= 1
- `shelf`: Optional, string
- `description`: Optional, string
- `publicationYear`: Optional, number (1000-current year)

### Members
- `name`: Required, string, 2-255 characters
- `email`: Required, valid email format, unique
- `phone`: Optional, string, valid phone format
- `membership`: Required, must be valid type
- `status`: Auto-set, must be valid status

### Loans
- `bookId`: Required, must exist
- `memberId`: Required, must exist
- `issuedOn`: Auto-set to current date
- `dueOn`: Auto-calculated (issuedOn + 14 days)
- `returnedOn`: Optional, null until returned

### Fines
- `memberId`: Required
- `loanId`: Required, unique
- `amount`: Calculated (daysOverdue × 10)
- `status`: Auto-set, Paid/Unpaid

---

## 🔗 Relationship Diagram

```
Member (1) ──────── (Many) Loan
  └─ Has many loans
  
Book (1) ──────── (Many) Loan
  └─ Can have multiple loans over time
  
Loan (1) ──────── (One) Fine
  └─ May generate a fine
  
Member (1) ──────── (Many) Fine
  └─ Can have multiple fines
```

---

## 🔄 Integration Steps

To integrate with a backend API:

1. **Replace imports**:
   ```javascript
   // Remove initial data
   // const initialBooks = [...]
   // Add API imports
   import { fetchBooks, addBook, updateBook, deleteBook } from './api'
   ```

2. **Update context provider**:
   ```javascript
   useEffect(() => {
     const loadData = async () => {
       const booksData = await fetchBooks()
       setBooks(booksData)
     }
     loadData()
   }, [])
   ```

3. **Modify CRUD operations**:
   ```javascript
   const addBook = async (bookData) => {
     const newBook = await api.post('/books', bookData)
     setBooks([...books, newBook])
   }
   ```

4. **Handle async operations**:
   ```javascript
   const issueBook = async (bookId, memberId) => {
     try {
       const loan = await api.post('/loans', {
         bookId,
         memberId
       })
       // Update UI
     } catch (error) {
       // Show error
     }
   }
   ```

---

## 📦 Example Implementation

### Fetch All Books
```javascript
const response = await fetch('/api/books')
const books = await response.json()
setBooks(books)
```

### Add New Book
```javascript
const newBook = {
  title: "New Book",
  author: "Author Name",
  category: "Fiction",
  totalCopies: 5
}
const response = await fetch('/api/books', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newBook)
})
const result = await response.json()
```

### Issue Book
```javascript
const loan = await fetch('/api/loans', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    bookId: "BK-1001",
    memberId: "MB-201"
  })
})
```

### Return Book
```javascript
const response = await fetch('/api/loans/LN-301/return', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' }
})
const updatedLoan = await response.json()
// Check if fine was generated
if (updatedLoan.fineGenerated) {
  // Show fine message
}
```

---

## 🔐 Authentication (Future)

Add to request headers when implementing:
```javascript
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
}
```

---

**Last Updated**: March 2026  
**API Version**: 1.0
