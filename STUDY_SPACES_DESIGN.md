# Library Management System - Study Spaces & Time Slot Booking

## 1. Extended Database Schema for Study Spaces

### New Tables Overview
```
StudySpaces (one-to-many) → StudySpaceBookings
Members (one-to-many) → StudySpaceBookings
StudySpaceBookings (one-to-many) → BookingFeedback
```

---

## 1.1 New Table: `study_spaces`

```sql
CREATE TABLE study_spaces (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    space_name VARCHAR(255) NOT NULL,
    capacity INT NOT NULL DEFAULT 1,
    location VARCHAR(255),
    floor INT,
    room_type ENUM('INDIVIDUAL', 'GROUP', 'SILENT', 'DISCUSSION') NOT NULL,
    facilities TEXT, -- Comma-separated: WiFi, Power Socket, AC, etc.
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_room_type (room_type),
    INDEX idx_is_active (is_active),
    INDEX idx_floor (floor)
);
```

**Field Explanations**:
- `id`: Unique study space identifier
- `space_name`: Name/identifier of the study space (e.g., "Room A1", "Study Pod 3")
- `capacity`: Number of people that can use the space simultaneously
- `location`: Location description within library
- `floor`: Floor number for quick navigation
- `room_type`: Type of room (Individual = 1 person, Group = 2+ people, Silent = no talking, Discussion = collaborative)
- `facilities`: Available amenities (WiFi, Power outlets, Projector, Whiteboard, etc.)
- `is_active`: Whether space is available for booking

---

## 1.2 New Table: `time_slots`

```sql
CREATE TABLE time_slots (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    slot_name VARCHAR(100) NOT NULL UNIQUE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_type ENUM('DAY', 'NIGHT') NOT NULL,
    duration_minutes INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_slot_type (slot_type),
    INDEX idx_start_time (start_time)
);
```

**Sample Data**:
```sql
INSERT INTO time_slots (slot_name, start_time, end_time, slot_type, duration_minutes) VALUES
-- Day Slots (9 AM to 6 PM)
('Morning 1', '09:00:00', '11:00:00', 'DAY', 120),
('Morning 2', '11:00:00', '13:00:00', 'DAY', 120),
('Afternoon 1', '13:00:00', '15:00:00', 'DAY', 120),
('Afternoon 2', '15:00:00', '17:00:00', 'DAY', 120),
('Evening 1', '17:00:00', '19:00:00', 'DAY', 120),

-- Night Slots (7 PM to 11 PM)
('Night 1', '19:00:00', '21:00:00', 'NIGHT', 120),
('Night 2', '21:00:00', '23:00:00', 'NIGHT', 120);
```

**Field Explanations**:
- `id`: Unique time slot identifier
- `slot_name`: User-friendly name
- `start_time`: Time when slot starts
- `end_time`: Time when slot ends
- `slot_type`: DAY or NIGHT classification
- `duration_minutes`: Duration in minutes

---

## 1.3 New Table: `study_space_bookings`

```sql
CREATE TABLE study_space_bookings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    member_id BIGINT NOT NULL,
    study_space_id BIGINT NOT NULL,
    time_slot_id BIGINT NOT NULL,
    booking_date DATE NOT NULL,
    status ENUM('CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW') DEFAULT 'CONFIRMED',
    booking_type ENUM('SOLO', 'GROUP') NOT NULL,
    group_size INT DEFAULT 1,
    notes VARCHAR(255),
    booked_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelled_on TIMESTAMP NULL,
    cancellation_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (study_space_id) REFERENCES study_spaces(id) ON DELETE RESTRICT,
    FOREIGN KEY (time_slot_id) REFERENCES time_slots(id) ON DELETE RESTRICT,
    
    UNIQUE KEY unique_booking (study_space_id, time_slot_id, booking_date),
    INDEX idx_member_id (member_id),
    INDEX idx_study_space_id (study_space_id),
    INDEX idx_booking_date (booking_date),
    INDEX idx_status (status),
    INDEX idx_booked_on (booked_on),
    INDEX idx_search (member_id, booking_date, status)
);
```

**Field Explanations**:
- `id`: Unique booking identifier
- `member_id`: Which member made the booking
- `study_space_id`: Which study space
- `time_slot_id`: Which time slot
- `booking_date`: Date of booking (future date)
- `status`: Current status (Confirmed/Completed/Cancelled/No-show)
- `booking_type`: SOLO (individual) or GROUP (collaborative)
- `group_size`: Number of people in group booking
- `notes`: Special requests or notes
- `booked_on`: Timestamp of booking creation
- `cancelled_on`: When it was cancelled (NULL if not cancelled)
- `cancellation_reason`: Reason for cancellation
- `UNIQUE constraint`: One booking per space-slot-date combination

---

## 1.4 New Table: `booking_feedback`

```sql
CREATE TABLE booking_feedback (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    booking_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    cleanliness_rating INT CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
    noise_level VARCHAR(50), -- QUIET, MODERATE, NOISY
    comment TEXT,
    feedback_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (booking_id) REFERENCES study_space_bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    
    INDEX idx_booking_id (booking_id),
    INDEX idx_rating (rating)
);
```

**Field Explanations**:
- `id`: Unique feedback identifier
- `booking_id`: Which booking this feedback is for
- `member_id`: Who gave the feedback
- `rating`: Overall rating (1-5 stars)
- `cleanliness_rating`: Room cleanliness (1-5 stars)
- `noise_level`: Actual noise level experienced
- `comment`: Optional detailed feedback

---

## 1.5 Updated Table: `study_space_daily_stats`

```sql
CREATE TABLE study_space_daily_stats (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    study_space_id BIGINT NOT NULL,
    time_slot_id BIGINT NOT NULL,
    booking_date DATE NOT NULL,
    total_capacity INT NOT NULL,
    booked_seats INT DEFAULT 0,
    available_seats INT DEFAULT 0,
    occupancy_rate DECIMAL(5, 2) DEFAULT 0.00,
    no_show_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (study_space_id) REFERENCES study_spaces(id),
    FOREIGN KEY (time_slot_id) REFERENCES time_slots(id),
    UNIQUE KEY unique_daily_stat (study_space_id, time_slot_id, booking_date),
    INDEX idx_booking_date (booking_date),
    INDEX idx_occupancy (occupancy_rate)
);
```

---

## 2. Complete Entity Relationships Map

```
┌──────────────────────┐
│   Study Spaces       │
├──────────────────────┤
│ id (PK)              │
│ space_name           │
│ capacity             │
│ room_type            │
│ is_active            │
└──────┬───────────────┘
       │ (1:N)
       │
    ┌──┴──────────────────────────┐
    │                             │
┌───┴─────────────┐    ┌────────┴──────────────┐
│ Time Slots      │    │ Study Space Bookings  │
├─────────────────┤    ├───────────────────────┤
│ id (PK)         │─┐  │ id (PK)               │
│ slot_name       │ └──│ time_slot_id (FK)     │
│ start_time      │    │ study_space_id (FK)───┤──┘
│ end_time        │    │ member_id (FK)────┐   │
│ slot_type       │    │ booking_date      │   │
└─────────────────┘    │ status            │   │
                       │ group_size        │   │
                       └────┬──────────────┘   │
                            │ (1:N)            │
                            │          ┌───────┘
                            │          │
                       ┌────┴──────────┴─────┐
                       │   Members           │
                       ├────────────────────┤
                       │ id (PK)             │
                       │ name                │
                       │ email               │
                       │ membership_type     │
                       │ booking_limit       │
                       └─────────────────────┘
                            │
                            │ (1:N)
                            │
                       ┌────┴──────────────┐
                       │ Booking Feedback  │
                       ├──────────────────┤
                       │ id (PK)           │
                       │ booking_id (FK)   │
                       │ member_id (FK)    │
                       │ rating            │
                       │ comment           │
                       └───────────────────┘
```

---

## 3. JPA Entities for Spring Boot

### StudySpace Entity
```java
@Entity
@Table(name = "study_spaces", indexes = {
    @Index(name = "idx_room_type", columnList = "room_type"),
    @Index(name = "idx_is_active", columnList = "is_active")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudySpace {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String spaceName;
    
    @Column(nullable = false)
    private Integer capacity;
    
    @Column
    private String location;
    
    @Column
    private Integer floor;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoomType roomType;
    
    @Column(columnDefinition = "TEXT")
    private String facilities; // WiFi, Power Socket, AC
    
    @Column
    private Boolean isActive = true;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "studySpace", cascade = CascadeType.ALL)
    private List<StudySpaceBooking> bookings = new ArrayList<>();
    
    @Transient
    public List<String> getFacilitiesList() {
        return facilities != null ? Arrays.asList(facilities.split(",")) : new ArrayList<>();
    }
}

enum RoomType {
    INDIVIDUAL, GROUP, SILENT, DISCUSSION
}
```

### TimeSlot Entity
```java
@Entity
@Table(name = "time_slots", indexes = {
    @Index(name = "idx_slot_type", columnList = "slot_type"),
    @Index(name = "idx_start_time", columnList = "start_time")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeSlot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String slotName;
    
    @Column(nullable = false)
    private LocalTime startTime;
    
    @Column(nullable = false)
    private LocalTime endTime;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SlotType slotType;
    
    @Column(nullable = false)
    private Integer durationMinutes;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @OneToMany(mappedBy = "timeSlot", cascade = CascadeType.ALL)
    private List<StudySpaceBooking> bookings = new ArrayList<>();
}

enum SlotType {
    DAY, NIGHT
}
```

### StudySpaceBooking Entity
```java
@Entity
@Table(name = "study_space_bookings", indexes = {
    @Index(name = "idx_member_id", columnList = "member_id"),
    @Index(name = "idx_study_space_id", columnList = "study_space_id"),
    @Index(name = "idx_booking_date", columnList = "booking_date"),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_search", columnList = "member_id,booking_date,status")
},
uniqueConstraints = @UniqueConstraint(
    name = "unique_booking",
    columnNames = {"study_space_id", "time_slot_id", "booking_date"}
))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudySpaceBooking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "study_space_id", nullable = false)
    private StudySpace studySpace;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "time_slot_id", nullable = false)
    private TimeSlot timeSlot;
    
    @Column(nullable = false)
    private LocalDate bookingDate;
    
    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW') DEFAULT 'CONFIRMED'")
    private BookingStatus status = BookingStatus.CONFIRMED;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingType bookingType;
    
    @Column
    private Integer groupSize = 1;
    
    @Column
    private String notes;
    
    @CreationTimestamp
    @Column(name = "booked_on", nullable = false, updatable = false)
    private LocalDateTime bookedOn;
    
    @Column(name = "cancelled_on")
    private LocalDateTime cancelledOn;
    
    @Column(name = "cancellation_reason")
    private String cancellationReason;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL)
    private List<BookingFeedback> feedbackList = new ArrayList<>();
    
    @Transient
    public boolean isUpcoming() {
        return bookingDate.isAfter(LocalDate.now()) && 
               status.equals(BookingStatus.CONFIRMED);
    }
    
    @Transient
    public boolean canBeCancelled() {
        return status.equals(BookingStatus.CONFIRMED) && 
               bookingDate.isAfter(LocalDate.now());
    }
}

enum BookingStatus {
    CONFIRMED, COMPLETED, CANCELLED, NO_SHOW
}

enum BookingType {
    SOLO, GROUP
}
```

### BookingFeedback Entity
```java
@Entity
@Table(name = "booking_feedback", indexes = {
    @Index(name = "idx_booking_id", columnList = "booking_id"),
    @Index(name = "idx_rating", columnList = "rating")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingFeedback {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private StudySpaceBooking booking;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;
    
    @Column(nullable = false)
    @Min(1) @Max(5)
    private Integer rating;
    
    @Column
    @Min(1) @Max(5)
    private Integer cleanlinessRating;
    
    @Column
    private String noiseLevel; // QUIET, MODERATE, NOISY
    
    @Column(columnDefinition = "TEXT")
    private String comment;
    
    @CreationTimestamp
    @Column(name = "feedback_date", nullable = false, updatable = false)
    private LocalDateTime feedbackDate;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
```

---

## 4. DTOs for API Communication

### StudySpaceDTO
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudySpaceDTO {
    private Long id;
    private String spaceName;
    private Integer capacity;
    private String location;
    private Integer floor;
    private String roomType;
    private List<String> facilities;
    private Boolean isActive;
    private Integer bookedCount; // For availability display
    private Integer availableSeats;
}
```

### TimeSlotDTO
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeSlotDTO {
    private Long id;
    private String slotName;
    private String startTime; // HH:mm format
    private String endTime;
    private String slotType; // DAY or NIGHT
    private Integer durationMinutes;
}
```

### StudySpaceBookingDTO
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudySpaceBookingDTO {
    private Long id;
    private Long memberId;
    private String memberName;
    private Long studySpaceId;
    private String spaceName;
    private Long timeSlotId;
    private String slotName;
    private LocalDate bookingDate;
    private String status;
    private String bookingType;
    private Integer groupSize;
    private String notes;
    private LocalDateTime bookedOn;
    private Double averageRating; // For past bookings
    private Boolean canBeCancelled;
}
```

### BookingFeedbackDTO
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingFeedbackDTO {
    private Long id;
    private Long bookingId;
    private Integer rating;
    private Integer cleanlinessRating;
    private String noiseLevel;
    private String comment;
    private LocalDateTime feedbackDate;
}
```

---

## 5. Repository Interfaces

### StudySpaceRepository
```java
@Repository
public interface StudySpaceRepository extends JpaRepository<StudySpace, Long> {
    List<StudySpace> findByIsActiveTrue();
    List<StudySpace> findByRoomType(RoomType roomType);
    List<StudySpace> findByCapacityGreaterThanEqual(Integer capacity);
    
    @Query("SELECT s FROM StudySpace s WHERE s.isActive = true AND s.capacity >= ?1")
    List<StudySpace> findAvailableSpacesByCapacity(Integer capacity);
}
```

### TimeSlotRepository
```java
@Repository
public interface TimeSlotRepository extends JpaRepository<TimeSlot, Long> {
    Optional<TimeSlot> findBySlotName(String slotName);
    List<TimeSlot> findBySlotType(SlotType slotType);
    
    @Query("SELECT t FROM TimeSlot t ORDER BY t.startTime ASC")
    List<TimeSlot> findAllSorted();
}
```

### StudySpaceBookingRepository
```java
@Repository
public interface StudySpaceBookingRepository extends JpaRepository<StudySpaceBooking, Long> {
    
    List<StudySpaceBooking> findByMemberId(Long memberId);
    List<StudySpaceBooking> findByStudySpaceId(Long studySpaceId);
    List<StudySpaceBooking> findByBookingDate(LocalDate bookingDate);
    List<StudySpaceBooking> findByStatus(BookingStatus status);
    
    // Check if space is available for a specific date/time/slot
    @Query("SELECT COUNT(b) FROM StudySpaceBooking b WHERE " +
           "b.studySpace.id = ?1 AND b.timeSlot.id = ?2 AND b.bookingDate = ?3 AND " +
           "b.status != 'CANCELLED'")
    long countActiveBookings(Long studySpaceId, Long timeSlotId, LocalDate bookingDate);
    
    // Get member's upcoming bookings
    @Query("SELECT b FROM StudySpaceBooking b WHERE b.member.id = ?1 AND " +
           "b.bookingDate >= CURRENT_DATE AND b.status = 'CONFIRMED' " +
           "ORDER BY b.bookingDate ASC, b.timeSlot.startTime ASC")
    List<StudySpaceBooking> findUpcomingBookingsForMember(Long memberId);
    
    // Get available spaces for a specific date/time
    @Query(value = "SELECT s FROM StudySpace s WHERE s.isActive = true AND " +
           "NOT EXISTS (SELECT 1 FROM StudySpaceBooking b WHERE b.studySpace.id = s.id AND " +
           "b.timeSlot.id = ?1 AND b.bookingDate = ?2 AND b.status != 'CANCELLED')")
    List<StudySpace> findAvailableSpaces(Long timeSlotId, LocalDate bookingDate);
    
    // Statistics
    @Query("SELECT COUNT(b) FROM StudySpaceBooking b WHERE " +
           "b.bookingDate = CURRENT_DATE AND b.status = 'COMPLETED'")
    long countTodaysCompletedBookings();
    
    @Query("SELECT AVG(bf.rating) FROM BookingFeedback bf WHERE " +
           "bf.booking.studySpace.id = ?1")
    Optional<Double> getAverageRatingForSpace(Long studySpaceId);
}
```

### BookingFeedbackRepository
```java
@Repository
public interface BookingFeedbackRepository extends JpaRepository<BookingFeedback, Long> {
    List<BookingFeedback> findByBookingId(Long bookingId);
    List<BookingFeedback> findByMemberId(Long memberId);
    
    @Query("SELECT AVG(bf.rating) FROM BookingFeedback bf WHERE bf.booking.studySpace.id = ?1")
    Optional<Double> getSpaceAverageRating(Long studySpaceId);
}
```

---

## 6. Service Layer (Business Logic)

### StudySpaceBookingService
```java
@Service
@Transactional
public class StudySpaceBookingService {
    
    @Autowired
    private StudySpaceBookingRepository bookingRepository;
    
    @Autowired
    private StudySpaceRepository studySpaceRepository;
    
    @Autowired
    private TimeSlotRepository timeSlotRepository;
    
    @Autowired
    private MemberRepository memberRepository;
    
    @Autowired
    private BookingFeedbackRepository feedbackRepository;
    
    // Constants
    private static final Integer MAX_BOOKINGS_PER_MEMBER = 3; // Max 3 bookings per member
    private static final Integer CANCELLATION_HOURS_BEFORE = 2; // Can cancel 2 hours before
    
    public StudySpaceBookingDTO bookStudySpace(Long memberId, Long studySpaceId, 
                                                Long timeSlotId, LocalDate bookingDate, 
                                                BookingType bookingType, Integer groupSize) {
        
        // Validation
        Member member = memberRepository.findById(memberId)
            .orElseThrow(() -> new ResourceNotFoundException("Member not found"));
        
        StudySpace space = studySpaceRepository.findById(studySpaceId)
            .orElseThrow(() -> new ResourceNotFoundException("Study space not found"));
        
        TimeSlot timeSlot = timeSlotRepository.findById(timeSlotId)
            .orElseThrow(() -> new ResourceNotFoundException("Time slot not found"));
        
        // Business rule validations
        if (!space.getIsActive()) {
            throw new InvalidOperationException("Study space is not available");
        }
        
        if (bookingDate.isBefore(LocalDate.now())) {
            throw new InvalidOperationException("Cannot book for past dates");
        }
        
        if (bookingType.equals(BookingType.GROUP) && groupSize > space.getCapacity()) {
            throw new InvalidOperationException("Group size exceeds space capacity");
        }
        
        // Check if space is already booked for this slot/date
        long existingBookings = bookingRepository.countActiveBookings(
            studySpaceId, timeSlotId, bookingDate
        );
        if (existingBookings > 0) {
            throw new InvalidOperationException("This slot is already booked");
        }
        
        // Check member's booking limit
        int memberBookingCount = (int) bookingRepository.findUpcomingBookingsForMember(memberId)
            .stream()
            .filter(b -> b.getStatus().equals(BookingStatus.CONFIRMED))
            .count();
        
        if (memberBookingCount >= MAX_BOOKINGS_PER_MEMBER) {
            throw new InvalidOperationException(
                "Maximum " + MAX_BOOKINGS_PER_MEMBER + " bookings allowed per member"
            );
        }
        
        // Create booking
        StudySpaceBooking booking = StudySpaceBooking.builder()
            .member(member)
            .studySpace(space)
            .timeSlot(timeSlot)
            .bookingDate(bookingDate)
            .status(BookingStatus.CONFIRMED)
            .bookingType(bookingType)
            .groupSize(groupSize != null ? groupSize : 1)
            .build();
        
        StudySpaceBooking savedBooking = bookingRepository.save(booking);
        return convertToDTO(savedBooking);
    }
    
    public StudySpaceBookingDTO cancelBooking(Long bookingId, String cancellationReason) {
        StudySpaceBooking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        
        // Check if booking can be cancelled
        if (!booking.canBeCancelled()) {
            throw new InvalidOperationException("This booking cannot be cancelled");
        }
        
        // Check if cancellation is within allowed time window
        LocalDateTime slotStartTime = LocalDateTime.of(
            booking.getBookingDate(),
            booking.getTimeSlot().getStartTime()
        );
        LocalDateTime cancellationDeadline = slotStartTime.minusHours(CANCELLATION_HOURS_BEFORE);
        
        if (LocalDateTime.now().isAfter(cancellationDeadline)) {
            throw new InvalidOperationException(
                "Cancellation must be done " + CANCELLATION_HOURS_BEFORE + " hours before slot"
            );
        }
        
        // Cancel booking
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledOn(LocalDateTime.now());
        booking.setCancellationReason(cancellationReason);
        
        StudySpaceBooking cancelledBooking = bookingRepository.save(booking);
        return convertToDTO(cancelledBooking);
    }
    
    public List<StudySpaceAvailabilityDTO> getAvailableSpaces(Long timeSlotId, LocalDate bookingDate) {
        List<StudySpace> availableSpaces = bookingRepository.findAvailableSpaces(timeSlotId, bookingDate);
        
        return availableSpaces.stream()
            .map(space -> StudySpaceAvailabilityDTO.builder()
                .studySpaceId(space.getId())
                .spaceName(space.getSpaceName())
                .capacity(space.getCapacity())
                .roomType(space.getRoomType().toString())
                .location(space.getLocation())
                .facilities(space.getFacilitiesList())
                .isAvailable(true)
                .build())
            .collect(Collectors.toList());
    }
    
    public List<StudySpaceBookingDTO> getMemberBookings(Long memberId) {
        return bookingRepository.findByMemberId(memberId)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    public void submitFeedback(Long bookingId, Integer rating, Integer cleanlinessRating, 
                               String noiseLevel, String comment) {
        StudySpaceBooking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        
        // Only allow feedback for completed bookings
        if (!booking.getStatus().equals(BookingStatus.COMPLETED)) {
            throw new InvalidOperationException("Feedback can only be given for completed bookings");
        }
        
        BookingFeedback feedback = BookingFeedback.builder()
            .booking(booking)
            .member(booking.getMember())
            .rating(rating)
            .cleanlinessRating(cleanlinessRating)
            .noiseLevel(noiseLevel)
            .comment(comment)
            .build();
        
        feedbackRepository.save(feedback);
    }
    
    private StudySpaceBookingDTO convertToDTO(StudySpaceBooking booking) {
        return StudySpaceBookingDTO.builder()
            .id(booking.getId())
            .memberId(booking.getMember().getId())
            .memberName(booking.getMember().getName())
            .studySpaceId(booking.getStudySpace().getId())
            .spaceName(booking.getStudySpace().getSpaceName())
            .timeSlotId(booking.getTimeSlot().getId())
            .slotName(booking.getTimeSlot().getSlotName())
            .bookingDate(booking.getBookingDate())
            .status(booking.getStatus().toString())
            .bookingType(booking.getBookingType().toString())
            .groupSize(booking.getGroupSize())
            .notes(booking.getNotes())
            .bookedOn(booking.getBookedOn())
            .canBeCancelled(booking.canBeCancelled())
            .build();
    }
}
```

---

## 7. REST Controllers

### StudySpaceBookingController
```java
@RestController
@RequestMapping("/api/study-spaces")
@CrossOrigin(origins = "http://localhost:3000")
public class StudySpaceBookingController {
    
    @Autowired
    private StudySpaceBookingService bookingService;
    
    @Autowired
    private StudySpaceRepository studySpaceRepository;
    
    @Autowired
    private TimeSlotRepository timeSlotRepository;
    
    // Get all study spaces
    @GetMapping
    public ResponseEntity<ApiResponse<List<StudySpaceDTO>>> getAllStudySpaces() {
        List<StudySpaceDTO> spaces = studySpaceRepository.findByIsActiveTrue()
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.<List<StudySpaceDTO>>builder()
            .success(true)
            .message("Study spaces retrieved successfully")
            .data(spaces)
            .timestamp(LocalDateTime.now())
            .build());
    }
    
    // Get all time slots
    @GetMapping("/time-slots")
    public ResponseEntity<ApiResponse<List<TimeSlotDTO>>> getAllTimeSlots() {
        List<TimeSlotDTO> slots = timeSlotRepository.findAllSorted()
            .stream()
            .map(this::convertTimeSlotToDTO)
            .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.<List<TimeSlotDTO>>builder()
            .success(true)
            .message("Time slots retrieved successfully")
            .data(slots)
            .timestamp(LocalDateTime.now())
            .build());
    }
    
    // Get available spaces for a specific date/time
    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<StudySpaceAvailabilityDTO>>> getAvailableSpaces(
            @RequestParam Long timeSlotId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate bookingDate) {
        List<StudySpaceAvailabilityDTO> spaces = bookingService.getAvailableSpaces(timeSlotId, bookingDate);
        return ResponseEntity.ok(ApiResponse.<List<StudySpaceAvailabilityDTO>>builder()
            .success(true)
            .message("Available spaces retrieved")
            .data(spaces)
            .timestamp(LocalDateTime.now())
            .build());
    }
    
    // Book a study space
    @PostMapping("/bookings")
    public ResponseEntity<ApiResponse<StudySpaceBookingDTO>> bookStudySpace(
            @Valid @RequestBody BookingRequestDTO request) {
        StudySpaceBookingDTO booking = bookingService.bookStudySpace(
            request.getMemberId(),
            request.getStudySpaceId(),
            request.getTimeSlotId(),
            request.getBookingDate(),
            BookingType.valueOf(request.getBookingType()),
            request.getGroupSize()
        );
        return ResponseEntity.ok(ApiResponse.<StudySpaceBookingDTO>builder()
            .success(true)
            .message("Study space booked successfully")
            .data(booking)
            .timestamp(LocalDateTime.now())
            .build());
    }
    
    // Cancel booking
    @PutMapping("/bookings/{id}/cancel")
    public ResponseEntity<ApiResponse<StudySpaceBookingDTO>> cancelBooking(
            @PathVariable Long id,
            @RequestBody CancellationRequestDTO request) {
        StudySpaceBookingDTO booking = bookingService.cancelBooking(id, request.getReason());
        return ResponseEntity.ok(ApiResponse.<StudySpaceBookingDTO>builder()
            .success(true)
            .message("Booking cancelled successfully")
            .data(booking)
            .timestamp(LocalDateTime.now())
            .build());
    }
    
    // Get member's bookings
    @GetMapping("/members/{memberId}/bookings")
    public ResponseEntity<ApiResponse<List<StudySpaceBookingDTO>>> getMemberBookings(
            @PathVariable Long memberId) {
        List<StudySpaceBookingDTO> bookings = bookingService.getMemberBookings(memberId);
        return ResponseEntity.ok(ApiResponse.<List<StudySpaceBookingDTO>>builder()
            .success(true)
            .message("Member bookings retrieved")
            .data(bookings)
            .timestamp(LocalDateTime.now())
            .build());
    }
    
    // Submit feedback for completed booking
    @PostMapping("/bookings/{id}/feedback")
    public ResponseEntity<ApiResponse<Object>> submitFeedback(
            @PathVariable Long id,
            @Valid @RequestBody FeedbackRequestDTO request) {
        bookingService.submitFeedback(id, request.getRating(), request.getCleanlinessRating(),
            request.getNoiseLevel(), request.getComment());
        return ResponseEntity.ok(ApiResponse.builder()
            .success(true)
            .message("Feedback submitted successfully")
            .timestamp(LocalDateTime.now())
            .build());
    }
    
    private StudySpaceDTO convertToDTO(StudySpace space) {
        return StudySpaceDTO.builder()
            .id(space.getId())
            .spaceName(space.getSpaceName())
            .capacity(space.getCapacity())
            .location(space.getLocation())
            .floor(space.getFloor())
            .roomType(space.getRoomType().toString())
            .facilities(space.getFacilitiesList())
            .isActive(space.getIsActive())
            .build();
    }
    
    private TimeSlotDTO convertTimeSlotToDTO(TimeSlot slot) {
        return TimeSlotDTO.builder()
            .id(slot.getId())
            .slotName(slot.getSlotName())
            .startTime(slot.getStartTime().toString())
            .endTime(slot.getEndTime().toString())
            .slotType(slot.getSlotType().toString())
            .durationMinutes(slot.getDurationMinutes())
            .build();
    }
}
```

### ReportController (Study Space Analytics)
```java
@RestController
@RequestMapping("/api/reports/study-spaces")
public class StudySpaceReportController {
    
    @Autowired
    private StudySpaceBookingRepository bookingRepository;
    
    @GetMapping("/occupancy")
    public ResponseEntity<ApiResponse<OccupancyReportDTO>> getOccupancyReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        // Calculate occupancy rate, popular spaces, peak hours
        return ResponseEntity.ok(/* Report data */);
    }
    
    @GetMapping("/ratings")
    public ResponseEntity<ApiResponse<SpaceRatingsDTO>> getSpaceRatings() {
        // Get average ratings for each space
        return ResponseEntity.ok(/* Rating data */);
    }
    
    @GetMapping("/member-usage")
    public ResponseEntity<ApiResponse<MemberUsageDTO>> getMemberUsageStats(
            @RequestParam Long memberId) {
        // Get member's booking history, preferences, average rating given
        return ResponseEntity.ok(/* Usage data */);
    }
}
```

---

## 8. API Endpoints for Study Spaces

```
GET     /api/study-spaces                           - Get all active study spaces
GET     /api/study-spaces/time-slots                - Get all time slots (Day & Night)
GET     /api/study-spaces/available?timeSlotId=&date= - Get available spaces for specific slot/date
POST    /api/study-spaces/bookings                  - Book a study space
PUT     /api/study-spaces/bookings/{id}/cancel      - Cancel booking
GET     /api/study-spaces/members/{id}/bookings     - Get member's bookings
POST    /api/study-spaces/bookings/{id}/feedback    - Submit feedback for booking
GET     /api/study-spaces/{id}                      - Get specific study space details
GET     /api/reports/study-spaces/occupancy         - Get occupancy report
GET     /api/reports/study-spaces/ratings           - Get space ratings/reviews
GET     /api/reports/study-spaces/member-usage      - Get member usage statistics
```

---

## 9. Request/Response DTOs

### BookingRequestDTO
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingRequestDTO {
    @NotNull private Long memberId;
    @NotNull private Long studySpaceId;
    @NotNull private Long timeSlotId;
    @NotNull private LocalDate bookingDate;
    @NotNull private String bookingType; // SOLO or GROUP
    private Integer groupSize;
}
```

### CancellationRequestDTO
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CancellationRequestDTO {
    @NotBlank private String reason;
}
```

### FeedbackRequestDTO
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackRequestDTO {
    @Min(1) @Max(5) private Integer rating;
    @Min(1) @Max(5) private Integer cleanlinessRating;
    private String noiseLevel;
    private String comment;
}
```

### StudySpaceAvailabilityDTO
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudySpaceAvailabilityDTO {
    private Long studySpaceId;
    private String spaceName;
    private Integer capacity;
    private String roomType;
    private String location;
    private List<String> facilities;
    private Boolean isAvailable;
}
```

---

## 10. Updated Member Entity (Add Booking Limit Field)

```java
// Add to Member.java entity:

@Column(name = "study_space_booking_limit", columnDefinition = "INT DEFAULT 3")
private Integer studySpaceBookingLimit = 3;

@OneToMany(mappedBy = "member", cascade = CascadeType.ALL)
private List<StudySpaceBooking> studySpaceBookings = new ArrayList<>();

@OneToMany(mappedBy = "member", cascade = CascadeType.ALL)
private List<BookingFeedback> feedbackGiven = new ArrayList<>();
```

---

## 11. Database Initialization Script

```sql
-- Create study spaces
INSERT INTO study_spaces (space_name, capacity, location, floor, room_type, facilities, is_active) VALUES
('Private Pod A1', 1, 'First Floor', 1, 'INDIVIDUAL', 'WiFi,Power Socket,AC', TRUE),
('Private Pod A2', 1, 'First Floor', 1, 'INDIVIDUAL', 'WiFi,Power Socket,AC', TRUE),
('Study Room B1', 4, 'First Floor', 1, 'GROUP', 'WiFi,Whiteboard,Projector,AC', TRUE),
('Study Room B2', 4, 'First Floor', 1, 'DISCUSSION', 'WiFi,Whiteboard,AC', TRUE),
('Silent Zone C1', 8, 'Second Floor', 2, 'SILENT', 'WiFi,AC', TRUE),
('Group Study D1', 6, 'Second Floor', 2, 'GROUP', 'WiFi,Whiteboard,Projector,AC', TRUE),
('Night Lab E1', 10, 'Third Floor', 3, 'GROUP', 'WiFi,Power Sockets,AC,Coffee Machine', TRUE);

-- Create time slots for day and night
INSERT INTO time_slots (slot_name, start_time, end_time, slot_type, duration_minutes) VALUES
-- Day slots
('Morning 1 (9-11 AM)', '09:00:00', '11:00:00', 'DAY', 120),
('Morning 2 (11 AM-1 PM)', '11:00:00', '13:00:00', 'DAY', 120),
('Afternoon 1 (1-3 PM)', '13:00:00', '15:00:00', 'DAY', 120),
('Afternoon 2 (3-5 PM)', '15:00:00', '17:00:00', 'DAY', 120),
('Evening 1 (5-7 PM)', '17:00:00', '19:00:00', 'DAY', 120),
-- Night slots
('Night 1 (7-9 PM)', '19:00:00', '21:00:00', 'NIGHT', 120),
('Night 2 (9-11 PM)', '21:00:00', '23:00:00', 'NIGHT', 120);
```

---

## 12. Summary of New Features

| Feature | Description |
|---------|-------------|
| **Study Spaces** | 7+ rooms with different capacities and room types |
| **Time Slots** | Day (9 AM - 7 PM) and Night (7 PM - 11 PM) slots |
| **Booking System** | Solo or group bookings with member limit (max 3) |
| **Availability Check** | Real-time availability based on bookings and capacity |
| **Cancellation** | Cancel within 2 hours before slot start time |
| **Feedback System** | Rate spaces and cleanliness after use |
| **Analytics** | Occupancy rates, space ratings, member usage patterns |
| **Notifications** | (Optional) Email/SMS for booking confirmations |

---

## 13. Integration Flow with React Frontend

React pages needed:
1. **StudySpaces.js** - Browse available spaces & book
2. **MyBookings.js** - View/manage personal bookings
3. **StudySpaceFeedback.js** - Submit feedback after use
4. **StudySpaceReports.js** - Analytics on space usage

