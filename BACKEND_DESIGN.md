# Library Management System - Spring Boot Backend Design

## 1. Database Schema Design

### Database: `library_management_db`

---

## 1.1 Tables Overview

```
Books (one-to-many) → Loans
Members (one-to-many) → Loans
Members (one-to-many) → Fines
Loans (one-to-many) → Fines
```

---

## 1.2 Detailed Table Schemas

### Table: `books`
```sql
CREATE TABLE books (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(20) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    total_copies INT NOT NULL DEFAULT 1,
    available_copies INT NOT NULL DEFAULT 1,
    shelf_location VARCHAR(50),
    description TEXT,
    publication_year INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_title (title),
    INDEX idx_author (author),
    INDEX idx_category (category),
    INDEX idx_isbn (isbn)
);
```

**Field Explanations**:
- `id`: Unique book identifier (primary key)
- `title`: Book title (searchable)
- `author`: Author name (searchable)
- `isbn`: International Standard Book Number (unique, indexed for quick lookup)
- `category`: Book category (e.g., Fiction, Science, History) - supports filtering
- `total_copies`: Total physical copies in the library
- `available_copies`: Number currently available for lending
- `shelf_location`: Physical location in library (e.g., "A3-15")
- `description`: Book summary/description
- `publication_year`: Year of publication
- `created_at`, `updated_at`: Audit timestamps

---

### Table: `members`
```sql
CREATE TABLE members (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    membership_type ENUM('STUDENT', 'FACULTY', 'STAFF', 'RESEARCHER', 'VISITOR') NOT NULL,
    membership_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    borrowed_count INT DEFAULT 0,
    status ENUM('ACTIVE', 'INACTIVE', 'REVIEW', 'SUSPENDED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_status (status),
    INDEX idx_membership_type (membership_type)
);
```

**Field Explanations**:
- `id`: Unique member identifier (primary key)
- `name`: Member's full name (searchable)
- `email`: Email address (unique, for communication)
- `phone`: Contact number
- `membership_type`: Type of membership (enum: Student, Faculty, etc.)
  - Useful for applying different borrowing limits
- `membership_date`: Registration date
- `borrowed_count`: Total books currently borrowed (denormalized for quick stats)
- `status`: Member status (Active/Inactive/Review/Suspended)
  - Suspended members cannot borrow
- `created_at`, `updated_at`: Audit timestamps

---

### Table: `loans`
```sql
CREATE TABLE loans (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    book_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    issued_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_on TIMESTAMP NOT NULL,
    returned_on TIMESTAMP NULL,
    status ENUM('ACTIVE', 'DUE_SOON', 'OVERDUE', 'RETURNED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE RESTRICT,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    INDEX idx_book_id (book_id),
    INDEX idx_member_id (member_id),
    INDEX idx_status (status),
    INDEX idx_issued_on (issued_on),
    INDEX idx_due_on (due_on),
    INDEX idx_active_loans (status, due_on) -- Composite index for performance
);
```

**Field Explanations**:
- `id`: Unique loan transaction identifier (primary key)
- `book_id`: Foreign key to `books` table (cascade on delete prevents orphaned books)
- `member_id`: Foreign key to `members` table (cascade delete removes all loans if member deleted)
- `issued_on`: When the book was issued
- `due_on`: When the book should be returned (automatically calculated: issued_on + 14 days)
- `returned_on`: Actual return date (NULL if not yet returned)
- `status`: Loan status (calculated based on dates)
  - `ACTIVE`: Issued, not overdue, within 3 days of due
  - `DUE_SOON`: Due within 3 days
  - `OVERDUE`: Past due date
  - `RETURNED`: Returned successfully
- `created_at`, `updated_at`: Audit timestamps

**Indexing Strategy**:
- `idx_active_loans`: Composite index for query finding active and overdue loans (common operation)

---

### Table: `fines`
```sql
CREATE TABLE fines (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    member_id BIGINT NOT NULL,
    loan_id BIGINT NOT NULL,
    amount_cents BIGINT NOT NULL, -- Store in cents to avoid floating point issues
    status ENUM('UNPAID', 'PAID') DEFAULT 'UNPAID',
    reason VARCHAR(255) NOT NULL, -- e.g., "Overdue by 5 days"
    created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paid_on TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
    INDEX idx_member_id (member_id),
    INDEX idx_loan_id (loan_id),
    INDEX idx_status (status),
    INDEX idx_created_on (created_on)
);
```

**Field Explanations**:
- `id`: Unique fine identifier (primary key)
- `member_id`: Foreign key to `members` table
- `loan_id`: Foreign key to `loans` table (which loan generated this fine)
- `amount_cents`: Fine amount in cents (₹10.50 = 1050 cents for precision without floating point)
- `status`: Payment status (Unpaid/Paid)
- `reason`: Description of fine (e.g., "Overdue by 5 days")
- `created_on`: When the fine was generated
- `paid_on`: When the fine was paid (NULL if unpaid)
- `updated_at`: Last update timestamp

**Why cents instead of decimal?**
- Avoids floating-point precision issues
- Standard practice in financial systems
- Easy to convert: divide by 100 for display as currency

---

## 2. Entity Relationships

```
┌─────────────┐
│    Books    │
├─────────────┤
│ id (PK)     │
│ title       │
│ author      │
│ isbn        │
│ category    │
│ total_copies│
│ avail_copies│
└──────┬──────┘
       │ (1:N)
       │
       ├─────────────────────────┐
       │                         │
   ┌───┴──────┐         ┌───────┴─┐
   │           │         │         │
┌──┴────────────────┐    │         │
│     Loans         │    │         │
├──────────────────┤┘    │         │
│ id (PK)          │     │         │
│ book_id (FK)─────┼─────┘         │
│ member_id (FK)───┼───────────┐   │
│ issued_on        │           │   │
│ due_on           │     ┌─────┴───┴────┐
│ returned_on      │     │              │
│ status           │     │              │
└───────────────┬──┘  ┌──┴──────────────┴──┐
                │     │     Members        │
                │     ├────────────────────┤
                │     │ id (PK)            │
                │     │ name               │
                │     │ email              │
                │     │ phone              │
                │     │ membership_type    │
                │     │ membership_date    │
                │     │ borrowed_count     │
                │     │ status             │
                │     └──────────────┬─────┘
                │                    │ (1:N)
                │                    │
                │    ┌───────────────┘
                │    │
            ┌───┴────┴──────────┐
            │      Fines        │
            ├───────────────────┤
            │ id (PK)           │
            │ member_id (FK)────┼─── Members
            │ loan_id (FK)──────┼─── Loans
            │ amount_cents      │
            │ status            │
            │ reason            │
            │ created_on        │
            │ paid_on           │
            └───────────────────┘
```

---

## 3. Relationship Rules

| Relation | Type | Cascade | Notes |
|----------|------|---------|-------|
| Books → Loans | 1:N | RESTRICT on delete | Cannot delete book with active loans |
| Members → Loans | 1:N | CASCADE on delete | Deleting member removes all loans |
| Members → Fines | 1:N | CASCADE on delete | Deleting member removes all fines |
| Loans → Fines | 1:N | CASCADE on delete | Deleting loan removes associated fines |

---

## 4. Database Normalization

**Normalization Level**: 3NF (Third Normal Form)

**Denormalized Fields** (necessary for performance):
- `members.borrowed_count`: Denormalized from COUNT(loans where returned_on IS NULL)
  - **Why**: Quick dashboard statistics without complex JOIN queries
  - **Update Strategy**: Update on issue/return of book

- `books.available_copies`: Denormalized from (total_copies - COUNT(active loans))
  - **Why**: Quick inventory checks without complex calculations
  - **Update Strategy**: Update when loan issued/returned

---

## 5. Sample Data Population

### Insert Sample Books
```sql
INSERT INTO books (title, author, isbn, category, total_copies, available_copies, shelf_location, description, publication_year) VALUES
('The Great Gatsby', 'F. Scott Fitzgerald', '978-0-7432-7356-5', 'Fiction', 3, 3, 'A1-12', 'A classic American novel', 1925),
('To Kill a Mockingbird', 'Harper Lee', '978-0-06-112008-4', 'Fiction', 2, 2, 'A2-05', 'A gripping tale of racial injustice', 1960),
('1984', 'George Orwell', '978-0-451-52493-2', 'Science Fiction', 4, 4, 'A3-18', 'Dystopian masterpiece', 1949),
('Sapiens', 'Yuval Noah Harari', '978-0-06-231609-7', 'Non-Fiction', 2, 2, 'B1-22', 'History of humankind', 2011);
```

### Insert Sample Members
```sql
INSERT INTO members (name, email, phone, membership_type, status) VALUES
('Abhiraj Singh', 'abhiraj@example.com', '9876543210', 'STUDENT', 'ACTIVE'),
('Dr. Sharma', 'dr.sharma@example.com', '9876543211', 'FACULTY', 'ACTIVE'),
('Priya Gupta', 'priya@example.com', '9876543212', 'STAFF', 'ACTIVE');
```

### Insert Sample Loans
```sql
INSERT INTO loans (book_id, member_id, issued_on, due_on, status) VALUES
(1, 1, '2026-03-10 10:00:00', '2026-03-24 10:00:00', 'ACTIVE'),
(3, 2, '2026-03-15 14:30:00', '2026-03-29 14:30:00', 'ACTIVE');
```

---

## 6. Spring Boot Backend Structure

### Project Structure
```
library-management-backend/
├── src/main/java/com/library/
│   ├── LmApplication.java (Main Spring Boot Application)
│   │
│   ├── config/
│   │   ├── DatabaseConfig.java
│   │   ├── SecurityConfig.java
│   │   └── CorsConfig.java
│   │
│   ├── controller/
│   │   ├── BookController.java
│   │   ├── MemberController.java
│   │   ├── LoanController.java
│   │   ├── FineController.java
│   │   └── ReportController.java
│   │
│   ├── service/
│   │   ├── BookService.java
│   │   ├── MemberService.java
│   │   ├── LoanService.java
│   │   ├── FineService.java
│   │   └── ReportService.java
│   │
│   ├── repository/
│   │   ├── BookRepository.java
│   │   ├── MemberRepository.java
│   │   ├── LoanRepository.java
│   │   └── FineRepository.java
│   │
│   ├── entity/
│   │   ├── Book.java
│   │   ├── Member.java
│   │   ├── Loan.java
│   │   └── Fine.java
│   │
│   ├── dto/
│   │   ├── BookDTO.java
│   │   ├── MemberDTO.java
│   │   ├── LoanDTO.java
│   │   ├── FineDTO.java
│   │   └── StatsDTO.java
│   │
│   ├── exception/
│   │   ├── ResourceNotFoundException.java
│   │   ├── InvalidOperationException.java
│   │   └── GlobalExceptionHandler.java
│   │
│   └── util/
│       ├── Constants.java
│       └── DateUtils.java
│
├── src/main/resources/
│   ├── application.properties
│   ├── application-dev.properties
│   └── application-prod.properties
│
├── src/test/java/...
├── pom.xml
└── README.md
```

---

## 7. Core Entities (JPA)

### Book Entity
```java
@Entity
@Table(name = "books", indexes = {
    @Index(name = "idx_title", columnList = "title"),
    @Index(name = "idx_author", columnList = "author"),
    @Index(name = "idx_category", columnList = "category"),
    @Index(name = "idx_isbn", columnList = "isbn")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String title;
    
    @Column(nullable = false)
    private String author;
    
    @Column(unique = true, nullable = false)
    private String isbn;
    
    @Column(nullable = false)
    private String category;
    
    @Column(nullable = false, columnDefinition = "INT DEFAULT 1")
    private Integer totalCopies;
    
    @Column(nullable = false, columnDefinition = "INT DEFAULT 1")
    private Integer availableCopies;
    
    @Column(name = "shelf_location")
    private String shelfLocation;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "publication_year")
    private Integer publicationYear;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "book", cascade = CascadeType.ALL)
    private List<Loan> loans = new ArrayList<>();
}
```

### Member Entity
```java
@Entity
@Table(name = "members", indexes = {
    @Index(name = "idx_name", columnList = "name"),
    @Index(name = "idx_email", columnList = "email"),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_membership_type", columnList = "membership_type")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Member {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(length = 20)
    private String phone;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "membership_type", nullable = false)
    private MembershipType membershipType;
    
    @Column(name = "membership_date", nullable = false)
    @CreationTimestamp
    private LocalDateTime membershipDate;
    
    @Column(name = "borrowed_count", columnDefinition = "INT DEFAULT 0")
    private Integer borrowedCount = 0;
    
    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('ACTIVE', 'INACTIVE', 'REVIEW', 'SUSPENDED') DEFAULT 'ACTIVE'")
    private MemberStatus status = MemberStatus.ACTIVE;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "member", cascade = CascadeType.ALL)
    private List<Loan> loans = new ArrayList<>();
    
    @OneToMany(mappedBy = "member", cascade = CascadeType.ALL)
    private List<Fine> fines = new ArrayList<>();
}

enum MembershipType {
    STUDENT, FACULTY, STAFF, RESEARCHER, VISITOR
}

enum MemberStatus {
    ACTIVE, INACTIVE, REVIEW, SUSPENDED
}
```

### Loan Entity
```java
@Entity
@Table(name = "loans", indexes = {
    @Index(name = "idx_book_id", columnList = "book_id"),
    @Index(name = "idx_member_id", columnList = "member_id"),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_active_loans", columnList = "status,due_on")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Loan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;
    
    @Column(name = "issued_on", nullable = false)
    @CreationTimestamp
    private LocalDateTime issuedOn;
    
    @Column(name = "due_on", nullable = false)
    private LocalDateTime dueOn;
    
    @Column(name = "returned_on")
    private LocalDateTime returnedOn;
    
    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('ACTIVE', 'DUE_SOON', 'OVERDUE', 'RETURNED') DEFAULT 'ACTIVE'")
    private LoanStatus status = LoanStatus.ACTIVE;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "loan", cascade = CascadeType.ALL)
    private List<Fine> fines = new ArrayList<>();
    
    // Calculated field - determine status based on current date
    @Transient
    public LoanStatus getCalculatedStatus() {
        if (returnedOn != null) return LoanStatus.RETURNED;
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime warningDate = dueOn.minusDays(3);
        if (now.isAfter(dueOn)) return LoanStatus.OVERDUE;
        if (now.isAfter(warningDate)) return LoanStatus.DUE_SOON;
        return LoanStatus.ACTIVE;
    }
}

enum LoanStatus {
    ACTIVE, DUE_SOON, OVERDUE, RETURNED
}
```

### Fine Entity
```java
@Entity
@Table(name = "fines", indexes = {
    @Index(name = "idx_member_id", columnList = "member_id"),
    @Index(name = "idx_loan_id", columnList = "loan_id"),
    @Index(name = "idx_status", columnList = "status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Fine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_id", nullable = false)
    private Loan loan;
    
    @Column(name = "amount_cents", nullable = false)
    private Long amountCents; // Store as cents for precision
    
    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('UNPAID', 'PAID') DEFAULT 'UNPAID'")
    private FineStatus status = FineStatus.UNPAID;
    
    @Column(nullable = false)
    private String reason;
    
    @Column(name = "created_on", nullable = false)
    @CreationTimestamp
    private LocalDateTime createdOn;
    
    @Column(name = "paid_on")
    private LocalDateTime paidOn;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Utility method to get amount in currency (rupees)
    @Transient
    public BigDecimal getAmountInRupees() {
        return BigDecimal.valueOf(amountCents).divide(BigDecimal.valueOf(100));
    }
}

enum FineStatus {
    UNPAID, PAID
}
```

---

## 8. Repository Interfaces (Spring Data JPA)

### BookRepository
```java
@Repository
public interface BookRepository extends JpaRepository<Book, Long> {
    Optional<Book> findByIsbn(String isbn);
    List<Book> findByTitleContainingIgnoreCase(String title);
    List<Book> findByAuthorContainingIgnoreCase(String author);
    List<Book> findByCategory(String category);
    List<Book> findByAvailableCopiesGreaterThan(Integer copies);
    
    @Query("SELECT DISTINCT b.category FROM Book b")
    List<String> findAllCategories();
}
```

### MemberRepository
```java
@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {
    Optional<Member> findByEmail(String email);
    List<Member> findByNameContainingIgnoreCase(String name);
    List<Member> findByStatus(MemberStatus status);
    List<Member> findByMembershipType(MembershipType membershipType);
    
    @Query("SELECT m FROM Member m WHERE m.status = 'SUSPENDED' AND m.borrowedCount > 0")
    List<Member> findSuspendedMembersWithPendingBooks();
}
```

### LoanRepository
```java
@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {
    List<Loan> findByMemberId(Long memberId);
    List<Loan> findByBookId(Long bookId);
    List<Loan> findByStatus(LoanStatus status);
    List<Loan> findByMemberIdAndReturnedOnIsNull(Long memberId);
    
    @Query("SELECT l FROM Loan l WHERE l.status IN ('ACTIVE', 'DUE_SOON', 'OVERDUE') AND l.returnedOn IS NULL")
    List<Loan> findActiveLikeLoans();
    
    @Query("SELECT l FROM Loan l WHERE l.dueOn < CURRENT_TIMESTAMP AND l.returnedOn IS NULL")
    List<Loan> findOverdueLoans();
    
    // For dashboard statistics
    @Query("SELECT COUNT(l) FROM Loan l WHERE l.returnedOn IS NULL AND l.member.id = ?1")
    long countActiveLoansForMember(Long memberId);
}
```

### FineRepository
```java
@Repository
public interface FineRepository extends JpaRepository<Fine, Long> {
    List<Fine> findByMemberId(Long memberId);
    List<Fine> findByLoanId(Long loanId);
    List<Fine> findByStatus(FineStatus status);
    List<Fine> findByMemberIdAndStatus(Long memberId, FineStatus status);
    
    @Query("SELECT SUM(f.amountCents) FROM Fine f WHERE f.status = 'UNPAID'")
    Optional<Long> getTotalUnpaidFinesInCents();
    
    @Query("SELECT SUM(f.amountCents) FROM Fine f WHERE f.status = 'PAID'")
    Optional<Long> getTotalPaidFinesInCents();
}
```

---

## 9. Service Layer (Business Logic)

### LoanService (Key Business Logic)
```java
@Service
@Transactional
public class LoanService {
    
    @Autowired
    private LoanRepository loanRepository;
    
    @Autowired
    private BookRepository bookRepository;
    
    @Autowired
    private MemberRepository memberRepository;
    
    @Autowired
    private FineRepository fineRepository;
    
    private static final Integer LOAN_DURATION_DAYS = 14;
    private static final Integer FINE_PER_DAY_CENTS = 1000; // ₹10 in cents
    
    public LoanDTO issueLoan(Long bookId, Long memberId) {
        Book book = bookRepository.findById(bookId)
            .orElseThrow(() -> new ResourceNotFoundException("Book not found"));
        
        Member member = memberRepository.findById(memberId)
            .orElseThrow(() -> new ResourceNotFoundException("Member not found"));
        
        // Validation checks
        if (book.getAvailableCopies() <= 0) {
            throw new InvalidOperationException("Book not available");
        }
        
        if (!member.getStatus().equals(MemberStatus.ACTIVE)) {
            throw new InvalidOperationException("Member account is not active");
        }
        
        // Create loan with auto-calculated due date
        LocalDateTime issuedOn = LocalDateTime.now();
        LocalDateTime dueOn = issuedOn.plusDays(LOAN_DURATION_DAYS);
        
        Loan loan = Loan.builder()
            .book(book)
            .member(member)
            .issuedOn(issuedOn)
            .dueOn(dueOn)
            .status(LoanStatus.ACTIVE)
            .build();
        
        // Update book inventory
        book.setAvailableCopies(book.getAvailableCopies() - 1);
        bookRepository.save(book);
        
        // Update member borrowed count
        member.setBorrowedCount(member.getBorrowedCount() + 1);
        memberRepository.save(member);
        
        Loan savedLoan = loanRepository.save(loan);
        return convertToDTO(savedLoan);
    }
    
    public LoanDTO returnLoan(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
            .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));
        
        if (loan.getReturnedOn() != null) {
            throw new InvalidOperationException("Loan already returned");
        }
        
        LocalDateTime returnedOn = LocalDateTime.now();
        loan.setReturnedOn(returnedOn);
        loan.setStatus(LoanStatus.RETURNED);
        
        // Check if overdue and generate fine
        if (returnedOn.isAfter(loan.getDueOn())) {
            long daysOverdue = ChronoUnit.DAYS.between(
                loan.getDueOn(),
                returnedOn
            );
            long fineAmountCents = daysOverdue * FINE_PER_DAY_CENTS;
            
            Fine fine = Fine.builder()
                .member(loan.getMember())
                .loan(loan)
                .amountCents(fineAmountCents)
                .reason("Overdue by " + daysOverdue + " days")
                .status(FineStatus.UNPAID)
                .build();
            
            fineRepository.save(fine);
        }
        
        // Update book inventory
        Book book = loan.getBook();
        book.setAvailableCopies(book.getAvailableCopies() + 1);
        bookRepository.save(book);
        
        // Update member borrowed count
        Member member = loan.getMember();
        member.setBorrowedCount(member.getBorrowedCount() - 1);
        memberRepository.save(member);
        
        Loan returnedLoan = loanRepository.save(loan);
        return convertToDTO(returnedLoan);
    }
}
```

---

## 10. API Endpoints Design

### Book Endpoints
```
GET     /api/books                        - Get all books (paginated)
GET     /api/books?title=&category=&page=
GET     /api/books/{id}                   - Get book details
POST    /api/books                        - Create new book
PUT     /api/books/{id}                   - Update book
DELETE  /api/books/{id}                   - Delete book
GET     /api/books/search?keyword=        - Search books
GET     /api/books/categories             - Get all categories
```

### Member Endpoints
```
GET     /api/members                      - Get all members (paginated)
GET     /api/members/{id}                 - Get member details
POST    /api/members                      - Register new member
PUT     /api/members/{id}                 - Update member info
DELETE  /api/members/{id}                 - Delete member
GET     /api/members/search?name=         - Search members
GET     /api/members/{id}/loans           - Get member's loans
GET     /api/members/{id}/fines           - Get member's fines
```

### Loan Endpoints
```
GET     /api/loans                        - Get all loans
GET     /api/loans?status=ACTIVE          - Filter loans by status
GET     /api/loans/{id}                   - Get loan details
POST    /api/loans/issue                  - Issue a book
  Body: { bookId, memberId }
PUT     /api/loans/{id}/return            - Return a book
GET     /api/loans/member/{memberId}      - Get member's loans
GET     /api/loans/overdue                - Get overdue loans
```

### Fine Endpoints
```
GET     /api/fines                        - Get all fines
GET     /api/fines?status=UNPAID          - Filter fines
GET     /api/fines/{id}                   - Get fine details
PUT     /api/fines/{id}/pay               - Mark fine as paid
GET     /api/fines/member/{memberId}      - Get member's fines
GET     /api/fines/stats                  - Get fine statistics
```

### Report Endpoints
```
GET     /api/reports/dashboard            - Dashboard statistics
GET     /api/reports/overdue-books        - Overdue items report
GET     /api/reports/member-activity      - Member activity report
GET     /api/reports/collection           - Fine collection report
GET     /api/reports/inventory            - Inventory status report
GET     /api/reports/popular-books        - Most borrowed books
```

---

## 11. pom.xml Dependencies

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>
    
    <groupId>com.library</groupId>
    <artifactId>library-management-backend</artifactId>
    <version>1.0.0</version>
    <name>Library Management System</name>
    
    <properties>
        <java.version>17</java.version>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
    
    <dependencies>
        <!-- Spring Boot Web -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        
        <!-- Spring Data JPA -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        
        <!-- MySQL Connector -->
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>
        
        <!-- Lombok for reducing boilerplate -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        
        <!-- Hibernate Validator -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        
        <!-- MapStruct for DTO conversion -->
        <dependency>
            <groupId>org.mapstruct</groupId>
            <artifactId>mapstruct</artifactId>
            <version>1.5.5.Final</version>
        </dependency>
        
        <!-- Testing -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <configuration>
                    <annotationProcessorPaths>
                        <path>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </path>
                    </annotationProcessorPaths>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

---

## 12. application.properties Configuration

```properties
# Server Configuration
server.port=8080
server.servlet.context-path=/api

# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/library_management_db
spring.datasource.username=root
spring.datasource.password=your_password
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA/Hibernate Configuration
spring.jpa.database-platform=org.hibernate.dialect.MySQL8Dialect
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.use_sql_comments=true

# Logging
logging.level.root=INFO
logging.level.com.library=DEBUG
logging.level.org.springframework.web=DEBUG
logging.level.org.hibernate.SQL=DEBUG

# Application Name
spring.application.name=Library Management API
```

---

## 13. Integration with React Frontend

### CORS Configuration
```java
@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                    .allowedOrigins("http://localhost:3000")
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                    .allowedHeaders("*")
                    .allowCredentials(true)
                    .maxAge(3600);
            }
        };
    }
}
```

### Response Format (DTO)
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp;
    private String error;
}
```

### BaseController Response Pattern
```java
@RestController
@RequestMapping("/api/books")
public class BookController {
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<BookDTO>>> getAllBooks() {
        return ResponseEntity.ok(
            ApiResponse.<List<BookDTO>>builder()
                .success(true)
                .message("Books retrieved successfully")
                .data(bookService.getAllBooks())
                .timestamp(LocalDateTime.now())
                .build()
        );
    }
}
```

---

## 14. Documentation & Setup

### Database Setup SQL
```sql
CREATE DATABASE IF NOT EXISTS library_management_db;
USE library_management_db;

-- Execute all CREATE TABLE scripts above
-- Then populate with sample data
```

### Backend Setup Steps
1. Clone/Create Spring Boot project
2. Configure MySQL database
3. Run `mvn clean install`
4. Configure `application.properties`
5. Run `mvn spring-boot:run`
6. API available at `http://localhost:8080/api`

### Frontend Integration
Update React service to call backend:
```javascript
// src/services/api.js
const API_URL = 'http://localhost:8080/api';

export const getBooks = async () => {
    const response = await fetch(`${API_URL}/books`);
    return response.json();
};
```

---

## 15. Key Design Decisions

| Decision | Reason |
|----------|--------|
| **MySQL over MongoDB** | Relational data with foreign keys and transactions needed |
| **JPA over Raw SQL** | ORM abstraction, type safety, automatic query generation |
| **Service Layer** | Centralized business logic, separation of concerns |
| **DTOs for Responses** | Hide internal entity structure from clients, versioning flexibility |
| **Amount in Cents** | Avoid floating-point precision issues in financial calculations |
| **Denormalization (available_copies, borrowed_count)** | Performance for frequent queries, updated on transaction |
| **Composite Indexes** | Optimize common query patterns (active loans, overdue detection) |
| **Soft Delete NOT used** | Physical deletion sufficient for library context |
| **Audit Timestamps** | Track creation/modification for compliance and debugging |

---

## 16. Database Migration Strategy

### Migration Tools
- **Flyway** or **Liquibase** for version control of schema changes
- Keep migrations in `src/main/resources/db/migration/`

### Example Flyway Migration
```sql
-- V1__Initial_Schema.sql
CREATE TABLE books (id BIGINT PRIMARY KEY AUTO_INCREMENT, ...);
CREATE TABLE members (id BIGINT PRIMARY KEY AUTO_INCREMENT, ...);
-- etc
```

---

## 17. Performance Optimization Tips

1. **Use FetchType.LAZY** for collections to avoid N+1 queries
2. **Composite Indexes** on frequently filtered columns
3. **Query Pagination** for large result sets
4. **Cache Member Status** in Redis for frequent checks
5. **Batch Operations** for bulk book issues/returns
6. **Read Replicas** for analytics queries

---

## 18. Security Considerations

1. **Input Validation** - Use `@Valid` annotations on DTOs
2. **SQL Injection Prevention** - Use named parameters with JPA
3. **Authentication** - Integrate Spring Security with JWT tokens
4. **Authorization** - Role-based access (Librarian, Member, Admin)
5. **Rate Limiting** - Prevent API abuse
6. **Audit Logging** - Track all data modifications

---

## Next Steps for Implementation

1. ✅ Review database schema and relationships
2. ✅ Set up Spring Boot project with dependencies
3. ✅ Create entities with JPA annotations
4. ✅ Build repository interfaces with custom queries
5. ✅ Implement service layer with business logic
6. ✅ Create REST controllers with proper error handling
7. ✅ Test endpoints with Postman/Insomnia
8. ✅ Implement authentication and authorization
9. ✅ Connect React frontend to backend APIs
10. ✅ Deploy to production (AWS RDS + EC2/Spring Cloud)

