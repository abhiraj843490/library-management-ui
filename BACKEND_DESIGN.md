# Backend Design (Current App Functionality)

## 1. Scope Alignment

This design matches the current frontend routes and interactions in `src/App.js`:
- `/login`
- `/dashboard`
- `/students` (admin only)
- `/study-spaces`
- `/my-bookings` (student only)
- `/view-seats` (student only)
- `/study-space-reports`

The app is currently a **study-space management system with student administration**, not a full books/loans/fines flow.

---

## 2. Core Modules

1. Authentication and Authorization
2. Student Management
3. Study Space Catalog
4. Time Slot Management
5. Booking Management
6. Feedback and Ratings
7. Attendance (Check-in/Check-out)
8. Reporting Dashboard

---

## 3. Recommended Tech Stack

- Java 17+
- Spring Boot 3.x
- Spring Web
- Spring Data JPA
- Spring Security + JWT
- MySQL 8.x
- Flyway (schema migrations)
- Bean Validation (`jakarta.validation`)

---

## 4. Database Schema

Database name: `library_study_space_db`

### 4.1 users

```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_code VARCHAR(20) UNIQUE NOT NULL, -- ADM-001, STU-001
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('ADMIN','STUDENT') NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role (role),
    INDEX idx_email (email)
);
```

### 4.2 students

```sql
CREATE TABLE students (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    gender ENUM('BOYS','GIRLS') NOT NULL,
    seat_section ENUM('Regular','Silent') NOT NULL,
    seat_number VARCHAR(20),
    enrollment_date DATE NOT NULL,
    subscription_status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
    subscription_expiry DATE NOT NULL,
    monthly_fee DECIMAL(10,2) NOT NULL DEFAULT 8500.00,
    fee_status ENUM('Paid','Pending') NOT NULL DEFAULT 'Pending',
    current_check_in DATETIME NULL,
    current_check_out DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_students_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_student_seat (seat_number),
    INDEX idx_student_fee_status (fee_status),
    INDEX idx_student_subscription (subscription_status)
);
```

### 4.3 study_spaces

```sql
CREATE TABLE study_spaces (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    space_name VARCHAR(120) NOT NULL,
    room_type ENUM('INDIVIDUAL','GROUP','SILENT','DISCUSSION') NOT NULL,
    capacity INT NOT NULL,
    location VARCHAR(120) NOT NULL,
    floor_no INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_room_type (room_type),
    INDEX idx_floor (floor_no)
);
```

### 4.4 study_space_facilities

```sql
CREATE TABLE study_space_facilities (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    study_space_id BIGINT NOT NULL,
    facility_name VARCHAR(80) NOT NULL,
    CONSTRAINT fk_facility_space FOREIGN KEY (study_space_id) REFERENCES study_spaces(id) ON DELETE CASCADE,
    INDEX idx_facility_space (study_space_id)
);
```

### 4.5 time_slots

```sql
CREATE TABLE time_slots (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    slot_name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_type ENUM('DAY','NIGHT') NOT NULL,
    duration_minutes INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 4.6 bookings

```sql
CREATE TABLE bookings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    booking_code VARCHAR(20) UNIQUE NOT NULL,
    student_id BIGINT NOT NULL,
    study_space_id BIGINT NOT NULL,
    time_slot_id BIGINT NOT NULL,
    booking_date DATE NOT NULL,
    booking_type ENUM('SOLO','GROUP') NOT NULL,
    group_size INT NOT NULL DEFAULT 1,
    status ENUM('CONFIRMED','COMPLETED','CANCELLED','NO_SHOW') NOT NULL DEFAULT 'CONFIRMED',
    can_be_cancelled BOOLEAN NOT NULL DEFAULT TRUE,
    notes VARCHAR(500),
    cancelled_reason VARCHAR(500),
    cancelled_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_booking_space FOREIGN KEY (study_space_id) REFERENCES study_spaces(id) ON DELETE RESTRICT,
    CONSTRAINT fk_booking_slot FOREIGN KEY (time_slot_id) REFERENCES time_slots(id) ON DELETE RESTRICT,
    UNIQUE KEY uk_space_slot_date (study_space_id, time_slot_id, booking_date),
    INDEX idx_booking_student (student_id),
    INDEX idx_booking_status (status),
    INDEX idx_booking_date (booking_date)
);
```

### 4.7 booking_feedback

```sql
CREATE TABLE booking_feedback (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    booking_id BIGINT UNIQUE NOT NULL,
    rating INT NOT NULL,
    cleanliness_rating INT NOT NULL,
    noise_level ENUM('QUIET','MODERATE','NOISY') NOT NULL,
    comment VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_feedback_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT chk_clean_rating CHECK (cleanliness_rating BETWEEN 1 AND 5)
);
```

### 4.8 payment_transactions

```sql
CREATE TABLE payment_transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_code VARCHAR(30) UNIQUE NOT NULL,
    student_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('PAID','FAILED','PENDING') NOT NULL,
    payment_method ENUM('UPI','CARD','CASH','BANK_TRANSFER') NOT NULL,
    paid_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_payment_student (student_id),
    INDEX idx_payment_status (status)
);
```

---

## 5. API Design

Base URL: `/api`

### 5.1 Auth

- `POST /auth/login`
  - Request: `{ email, password }`
  - Response: `{ token, user: { id, name, role, ... } }`
- `GET /auth/me`
  - Returns profile from JWT.

### 5.2 Students (Admin)

- `GET /students`
  - Filters: `search`, `gender`, `feeStatus`, `subscriptionStatus`
- `POST /students`
  - Enroll new student and auto-assign seat (or allocate manually).
- `PUT /students/{id}`
  - Update phone, section, seat, status.
- `DELETE /students/{id}`
  - Remove student.
- `POST /students/{id}/payments`
  - Mark fee as paid and create `payment_transactions` row.
- `POST /students/{id}/check-in`
- `POST /students/{id}/check-out`

### 5.3 Seats and Capacity

- `GET /seats/availability`
  - Query: `gender`, `seatSection`
  - Returns available/occupied seat map.
- `POST /seats/assign`
  - Assign a seat to student.

### 5.4 Study Spaces

- `GET /study-spaces`
- `GET /study-spaces/{id}`
- `GET /study-spaces/available?date=YYYY-MM-DD&timeSlotId=1&roomType=GROUP`
- `GET /study-spaces/time-slots`

### 5.5 Bookings

- `POST /study-spaces/bookings`
  - Request: `{ studentId, studySpaceId, timeSlotId, bookingDate, bookingType, groupSize, notes }`
- `GET /study-spaces/members/{studentId}/bookings`
- `PUT /study-spaces/bookings/{bookingId}/cancel`
  - Request: `{ reason }`
- `POST /study-spaces/bookings/{bookingId}/feedback`
  - Request: `{ rating, cleanlinessRating, noiseLevel, comment }`

### 5.6 Reports and Dashboard

- `GET /dashboard/stats`
  - Admin: active students, total students, seats, pending payments.
  - Student: own seat details, status, subscription summary.
- `GET /reports/study-spaces/usage`
- `GET /reports/study-spaces/slots`
- `GET /reports/students/attendance`
- `GET /reports/payments/summary`

---

## 6. Business Rules

1. Login required for all APIs except `/auth/login`.
2. `ADMIN` role only for `/students/**` write operations.
3. Student can only view/cancel own bookings.
4. Booking cancel allowed only before configured cut-off (for example 2 hours before slot).
5. No double booking for same space + slot + date.
6. `GROUP` booking must satisfy `groupSize <= study_space.capacity`.
7. Feedback allowed only for `COMPLETED` booking and only once per booking.
8. Check-out cannot happen before check-in.
9. Seat assignment must match student gender zone and section.

---

## 7. Suggested Spring Boot Package Structure

```text
backend/
  src/main/java/com/geniustech/library/
    config/
      SecurityConfig.java
      JwtAuthFilter.java
      CorsConfig.java
    controller/
      AuthController.java
      StudentController.java
      StudySpaceController.java
      BookingController.java
      ReportController.java
      DashboardController.java
    service/
      AuthService.java
      StudentService.java
      SeatService.java
      StudySpaceService.java
      BookingService.java
      ReportService.java
    repository/
      UserRepository.java
      StudentRepository.java
      StudySpaceRepository.java
      TimeSlotRepository.java
      BookingRepository.java
      FeedbackRepository.java
      PaymentTransactionRepository.java
    entity/
      User.java
      Student.java
      StudySpace.java
      StudySpaceFacility.java
      TimeSlot.java
      Booking.java
      BookingFeedback.java
      PaymentTransaction.java
    dto/
      auth/
      student/
      booking/
      report/
    exception/
      GlobalExceptionHandler.java
      ResourceNotFoundException.java
      BusinessException.java
```

---

## 8. Response Contract

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "timestamp": "2026-03-22T12:00:00Z"
}
```

Error format:

```json
{
  "success": false,
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "details": {
    "field": "message"
  },
  "timestamp": "2026-03-22T12:00:00Z"
}
```

---

## 9. Migration Plan from Current Frontend Mock Data

1. Replace hardcoded `mockUsers` in `AuthContext` with `POST /api/auth/login`.
2. Replace local `students` state with backend CRUD in `Students.js`.
3. Replace mock space and slot data in `StudySpaces.js` with:
   - `GET /api/study-spaces`
   - `GET /api/study-spaces/time-slots`
4. Replace booking operations in `StudySpaces.js` and `MyBookings.js` with booking APIs.
5. Replace report mock metrics with `/api/reports/*` endpoints.
6. Add JWT in `Authorization: Bearer <token>` for protected routes.

---

## 10. Non-Functional Requirements

- Pagination support for students and bookings.
- Audit fields on all transaction-heavy tables.
- Soft delete optional for students/bookings if historical tracking is required.
- Index optimization on `bookings(booking_date, status, study_space_id, time_slot_id)`.
- Daily job to mark stale confirmed bookings as `NO_SHOW`.

---

## 11. Immediate Next Backend Deliverables

1. Create Flyway migration `V1__initial_schema.sql` with tables above.
2. Implement JWT auth (`/auth/login`, `/auth/me`).
3. Implement student CRUD + payment + attendance endpoints.
4. Implement study-space availability and booking APIs.
5. Implement cancellation + feedback APIs with validations.
6. Implement dashboard and report aggregate queries.

---

Last updated: 2026-03-22
