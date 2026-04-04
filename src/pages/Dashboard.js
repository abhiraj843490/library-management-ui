import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  extractStudentsFromResponse,
  normalizeStudent,
} from "../interfaces/studentResponse";
import {
  getSeatsApi,
  getStudentByIdApi,
  getStudentsApi,
} from "../services/studentApi";
import useAttendance from "../hooks/useAttendance";
import "./Dashboard.css";

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [students, setStudents] = useState([]);
  const [seats, setSeats] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const extractSeatsFromResponse = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.content)) return response.data.content;
    return [];
  };

  const extractSingleStudentFromResponse = (response) => {
    if (!response) return null;
    if (Array.isArray(response)) return response[0] || null;
    if (response?.data && !Array.isArray(response.data)) return response.data;
    return response;
  };

  const resolveStudentIdentifier = useCallback(() => {
    const candidates = [user?.studentId, user?.id, user?.userCode];
    return candidates.find(
      (value) =>
        value !== undefined && value !== null && String(value).trim() !== "",
    );
  }, [user?.studentId, user?.id, user?.userCode]);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      if (isAdmin) {
        const [studentsResult, seatsResult] = await Promise.all([
          getStudentsApi(),
          getSeatsApi(),
        ]);
        const studentsData =
          extractStudentsFromResponse(studentsResult).map(normalizeStudent);
        const seatsData = extractSeatsFromResponse(seatsResult);
        setStudents(studentsData);
        setSeats(seatsData);
      } else {
        const studentId = resolveStudentIdentifier();
        if (!studentId) {
          throw new Error("Unable to resolve logged-in student id");
        }

        const studentResult = await getStudentByIdApi(studentId);
        const singleStudent = extractSingleStudentFromResponse(studentResult);
        setStudents(singleStudent ? [normalizeStudent(singleStudent)] : []);
        setSeats([]);
      }
    } catch (error) {
      setLoadError(error.message || "Unable to load dashboard data");
      setStudents([]);
      setSeats([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, resolveStudentIdentifier]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Define helper functions first
  const memberStatus = (status) => {
    if (status === "Active") return "Active ✓";
    if (status === "Pending") return "Pending ⏳";
    return "Inactive";
  };

  const getMemberStatus = (status) => {
    switch (status) {
      case "Active":
        return "active";
      case "Pending":
        return "warning";
      default:
        return "neutral";
    }
  };

  const currentStudent = useMemo(() => {
    return (
      students.find(
        (s) =>
          (user?.email && s.email === user.email) ||
          (user?.id && String(s.id) === String(user.id)) ||
          (user?.id && String(s.userCode) === String(user.id)) ||
          (user?.id && String(s.studentId) === String(user.id)),
      ) || null
    );
  }, [students, user]);

  const isCurrentStudentInactive = useMemo(() => {
    return (
      currentStudent?.active === false ||
      String(currentStudent?.subscriptionStatus || "").toLowerCase() ===
        "inactive"
    );
  }, [currentStudent]);
  //   const isCheckedInNow = useMemo(() => {
  //   if (!currentStudent) return false;
  //   if (typeof currentStudent.checkedIn === "boolean")
  //     return currentStudent.checkedIn;
  //   return Boolean(
  //     currentStudent.currentCheckIn && !currentStudent.currentCheckOut,
  //   );
  // }, [currentStudent]);

  const attendance = useAttendance({
    user,
    currentStudent,
    isAdmin,
    setStudents,
    setLoadError,
  });

  const {
    isAttendanceUpdating,
    runningCheckInTime,
    lastSessionSeconds,
    attendanceByDate,
    calendarDays,
    selectedMonth,
    setSelectedMonth,
    sessionDurationDisplay,
    totalAttendanceDisplay,
    hasCheckedOutToday,
    isCheckedInNow,
    canCheckInToday,
    canCheckOutToday,
    handleStudentAttendance,
  } = attendance;

  const stats = useMemo(() => {
    const totalSeats = seats.length;
    const availableSeats = seats.filter(
      (s) => String(s.status || "").toUpperCase() === "AVAILABLE",
    ).length;

    if (isAdmin) {
      const activeMembers = students.filter(
        (m) => m.subscriptionStatus === "Active",
      ).length;
      const pendingMembers = students.filter(
        (m) => m.feeStatus === "Pending",
      ).length;
      const totalMembers = students.length;

      return [
        {
          label: "Active Students",
          value: activeMembers,
          caption: "Currently enrolled",
          color: "positive",
        },
        {
          label: "Total Students",
          value: totalMembers,
          caption: "All registrations",
          color: "primary",
        },
        {
          label: "Pending Fees",
          value: pendingMembers,
          caption: "Awaiting payment",
          color: "warning",
        },
        {
          label: "Total Seats",
          value: totalSeats,
          caption: `${availableSeats} available`,
          color: "neutral",
        },
      ];
    } else {
      // Student view
      const studentData = currentStudent || user;
      return [
        {
          label: "Your Seating Side",
          value: user?.gender,
          caption: "Allocated side",
          color: "primary",
        },
        {
          label: "Seat Number",
          value: studentData?.seatNumber || "B-00",
          caption: "Your seat",
          color: "positive",
        },
        {
          label: "Status",
          value: memberStatus(studentData?.subscriptionStatus || "Active"),
          caption: "Current status",
          color: "neutral",
        },
        {
          label: "Subscription",
          value: `₹${Number(studentData?.monthlyFee || 0).toLocaleString("en-IN")}`,
          caption: "Monthly fee",
          color: "neutral",
        },
      ];
    }
  }, [students, seats, isAdmin, user, currentStudent]);

  const activeMembersList = isAdmin
    ? students
        .filter((m) => m.subscriptionStatus === "Active")
        .sort(
          (a, b) =>
            new Date(b.enrollmentDate || 0) - new Date(a.enrollmentDate || 0),
        )
        .slice(0, 2)
    : currentStudent
      ? [currentStudent]
      : [];

  return (
    <div className="dashboard-container">
      <section className="dashboard-hero">
        <div>
          {/* <p className="eyebrow">System Overview</p> */}
          <h1>{`Hi, ${user?.name || "User"}`}</h1>
          <p className="hero-copy">
            {isAdmin
              ? "Welcome back! Here’s a quick overview of the library’s current status and recent member activity."
              : "View your seat information and booking details."}
          </p>
          {isLoading && <p className="hero-copy">Loading dashboard data...</p>}
          {loadError && (
            <p className="hero-copy">
              {loadError}{" "}
              <button className="btn btn-primary" onClick={fetchDashboardData}>
                Retry
              </button>
            </p>
          )}
        </div>
      </section>

      <section className="stats-grid" aria-label="Study space summary">
        {stats.map((stat) => (
          <article key={stat.label} className={`stat-card stat-${stat.color}`}>
            <span className="stat-label">{stat.label}</span>
            <strong className="stat-value">{stat.value}</strong>
            <small className="stat-caption">{stat.caption}</small>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-head compact">
            <div>
              <p className="panel-label">Recently</p>
              <h2>
                {isAdmin ? "Most Recent Enrolled Students" : "My Information"}
              </h2>
            </div>
          </div>

          <div className="recent-loans">
            {activeMembersList.length > 0 ? (
              activeMembersList.map((member) => (
                <div key={member.id} className="loan-item">
                  <div className="loan-info">
                    <strong>{member.name}</strong>
                    <p>{member.email}</p>
                    <small>
                      {member.id || member.userCode || member.studentId}
                    </small>
                  </div>
                  <div className="loan-status">
                    <span
                      className={`badge ${getMemberStatus(member.subscriptionStatus || "Active")}`}
                    >
                      {member.subscriptionStatus || "Active"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">No members found</div>
            )}
          </div>

          {!isAdmin && currentStudent && (
            <div className="student-attendance-card">
              <p className="panel-label">Attendance</p>
              <div className="attendance-meta">
                
                {hasCheckedOutToday && (
                  <span>Checked Out</span>
                )}

                {!currentStudent?.currentCheckIn && !runningCheckInTime && (
                  <span>Yet to check in.</span>
                )}
              </div>
              <div className="attendance-actions">
                <button
                  className="btn btn-success"
                  onClick={() => handleStudentAttendance("checkin")}
                  disabled={
                    isCurrentStudentInactive ||
                    Boolean(currentStudent?.currentCheckOut) ||
                    !canCheckInToday ||
                    isAttendanceUpdating
                  }
                >
                  Check-In
                </button>
                <button
                  className="btn btn-warning"
                  onClick={() => handleStudentAttendance("checkout")}
                  disabled={
                    isCurrentStudentInactive ||
                    !canCheckOutToday ||
                    Boolean(currentStudent?.currentCheckOut) ||
                    isAttendanceUpdating
                  }
                >
                  Check-Out
                </button>
              </div>
              <div className="attendance-calendar">
                <div className="attendance-calendar-head">
                  <strong>Attendance Calendar</strong>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  />
                </div>
                {/* <div className="attendance-legend">
                  <span className="legend-item present">P Present</span>
                  <span className="legend-item absent">A Absent</span>
                  <span className="legend-item unknown">- No record</span>
                </div> */}
                <div className="attendance-calendar-grid">
                  {calendarDays.map(({ day, dayKey, inFuture }) => {
                    const entry = attendanceByDate.get(dayKey);
                    const normalizedStatus = String(entry?.status || "").toUpperCase();
                    const isPresent = normalizedStatus === "PRESENT";
                    const isAbsent = normalizedStatus === "ABSENT";
                    const badge = isPresent ? "P" : isAbsent ? "A" : "-";

                    return (
                      <div
                        key={dayKey}
                        className={`calendar-day ${isPresent ? "present" : ""} ${isAbsent ? "absent" : ""} ${inFuture ? "future" : ""}`}
                        title={dayKey}
                      >
                        <span>{day}</span>
                        <strong>{inFuture ? "" : badge}</strong>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </article>

        <article className="panel">
          <div className="panel-head compact">
            <div>
              <p className="panel-label">Systems</p>
              <h2>Quick Stats</h2>
            </div>
          </div>

          <div className="quick-stats">
            {isAdmin ? (
              <>
                <div className="quick-stat">
                  <span>Total Students</span>
                  <strong>{students.length}</strong>
                </div>
                <div className="quick-stat">
                  <span>Active Students</span>
                  <strong>
                    {
                      students.filter((m) => m.subscriptionStatus === "Active")
                        .length
                    }
                  </strong>
                </div>
                <div className="quick-stat">
                  <span>Total Seats</span>
                  <strong>{seats.length}</strong>
                </div>
                <div className="quick-stat">
                  <span>Available Seats</span>
                  <strong>
                    {
                      seats.filter(
                        (s) =>
                          String(s.status || "").toUpperCase() === "AVAILABLE",
                      ).length
                    }
                  </strong>
                </div>
              </>
            ) : (
            <>
              <div className="quick-stat">
                <span>Attendance Hours</span>
                <div className="attendance-info">
                  <span className="attendance-status info">
                    {(runningCheckInTime || lastSessionSeconds > 0)
                      ? sessionDurationDisplay
                      : totalAttendanceDisplay}
                  </span>
                </div>
              </div>

              <div className="quick-stat">
                <span>Fee Status</span>
                <div className="attendance-info">
                  <span
                    className={`attendance-status ${
                      (currentStudent?.feeStatus || user?.feeStatus) === "Paid"
                        ? "present"
                        : "absent"
                    }`}
                  >
                    {currentStudent?.feeStatus || user?.feeStatus || "Pending"}
                  </span>
                </div>
              </div>

              <div className="quick-stat">
                <span>Attendance Status</span>
                <div className="attendance-info">
                  <span
                    className={`attendance-status ${
                      isCheckedInNow
                        ? "present"
                        : hasCheckedOutToday
                        ? "checked-out"
                        : "absent"
                    }`}
                  >
                    {isCheckedInNow
                      ? "Present"
                      : hasCheckedOutToday
                      ? "Checked Out"
                      : "Yet to Check In"}
                  </span>
                </div>
              </div>

              <div className="quick-stat">
                <span>Enrollment Date</span>
                <div className="attendance-info">
                  <span className="attendance-status neutral">
                    {currentStudent?.enrollmentDate || user?.enrollment || "-"}
                  </span>
                </div>
              </div>              
            </>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
