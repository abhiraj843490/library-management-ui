import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  extractStudentsFromResponse,
  normalizeStudent,
} from "../interfaces/studentResponse";
import {
  checkInStudentApi,
  checkOutStudentApi,
  getSeatsApi,
  getStudentByIdApi,
  getStudentsApi,
} from "../services/studentApi";
import "./Dashboard.css";

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [students, setStudents] = useState([]);
  const [seats, setSeats] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [isAttendanceUpdating, setIsAttendanceUpdating] = useState(false);
  const [runningCheckInTime, setRunningCheckInTime] = useState(null);
  const [elapsedSessionSeconds, setElapsedSessionSeconds] = useState(0);
  const [lastSessionSeconds, setLastSessionSeconds] = useState(0);
  const [totalAttendanceMinutes, setTotalAttendanceMinutes] = useState(null);

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

  const isCheckedInNow = useMemo(() => {
    if (!currentStudent) return false;
    if (typeof currentStudent.checkedIn === "boolean")
      return currentStudent.checkedIn;
    return Boolean(
      currentStudent.currentCheckIn && !currentStudent.currentCheckOut,
    );
  }, [currentStudent]);

  const parseAttendanceDate = useCallback((value) => {
    if (!value) return null;
    if (value instanceof Date)
      return Number.isNaN(value.getTime()) ? null : value;
    const normalized = String(value).trim().replace(" ", "T");
    const safeValue = normalized.replace(
      /(\.\d{3})\d+(?=(Z|[+-]\d{2}:\d{2})?$)/,
      "$1",
    );
    const parsed = new Date(safeValue);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, []);

  const toDurationString = (secondsValue) => {
    const totalSeconds = Math.max(0, Math.floor(Number(secondsValue) || 0));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (v) => String(v).padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const applyAttendanceSnapshot = useCallback(
    (studentId, attendanceData = {}, action) => {
      const checkInValue =
        attendanceData.checkIn || attendanceData.currentCheckIn || null;
      const checkOutValueRaw =
        attendanceData.checkOut || attendanceData.currentCheckOut || null;
      const checkOutValue =
        action === "checkout"
          ? checkOutValueRaw || new Date().toISOString()
          : checkOutValueRaw;

      const parsedCheckIn = parseAttendanceDate(checkInValue);
      const parsedCheckOut = parseAttendanceDate(checkOutValue);

      if (action === "checkin") {
        setRunningCheckInTime(parsedCheckIn);
        setElapsedSessionSeconds(0);
        setLastSessionSeconds(0);
      } else if (action === "checkout") {
        setRunningCheckInTime(null);
        // Prioritize backend's sessionMinutes over calculated duration
        if (Number.isFinite(Number(attendanceData.sessionMinutes))) {
          setLastSessionSeconds(
            Math.max(0, Math.floor(Number(attendanceData.sessionMinutes) * 60)),
          );
        } else if (parsedCheckIn && parsedCheckOut) {
          setLastSessionSeconds(
            Math.max(
              0,
              Math.floor(
                (parsedCheckOut.getTime() - parsedCheckIn.getTime()) / 1000,
              ),
            ),
          );
        } else {
          setLastSessionSeconds(0);
        }
        if (typeof attendanceData.totalAttendanceMinutes === "number") {
          setTotalAttendanceMinutes(attendanceData.totalAttendanceMinutes);
        }
      }

      setStudents((prev) =>
        prev.map((studentRow) => {
          const rowId = studentRow.studentId ?? studentRow.id;
          if (String(rowId) !== String(studentId)) return studentRow;

          return {
            ...studentRow,
            checkedIn: action === "checkin",
            currentCheckIn: checkInValue || studentRow.currentCheckIn || null,
            currentCheckOut:
              action === "checkin"
                ? null
                : checkOutValue || studentRow.currentCheckOut || null,
          };
        }),
      );
    },
    [parseAttendanceDate],
  );

  const handleStudentAttendance = useCallback(
    async (action) => {
      if (isAdmin || !currentStudent) return;
      const apiId =
        currentStudent?.studentId ??
        currentStudent?.id ??
        user?.studentId ??
        user?.id ??
        user?.userCode;
      if (!apiId) {
        setLoadError("Unable to resolve logged-in student id");
        return;
      }

      setIsAttendanceUpdating(true);
      setLoadError("");
      try {
        const result =
          action === "checkin"
            ? await checkInStudentApi(apiId)
            : await checkOutStudentApi(apiId);
        const attendancePayload =
          result?.data && !Array.isArray(result.data) ? result.data : result;
        applyAttendanceSnapshot(apiId, attendancePayload, action);
      } catch (error) {
        setLoadError(error.message || "Unable to update attendance");
      } finally {
        setIsAttendanceUpdating(false);
      }
    },
    [
      isAdmin,
      currentStudent,
      user?.studentId,
      user?.id,
      user?.userCode,
      applyAttendanceSnapshot,
    ],
  );

  useEffect(() => {
    if (!currentStudent) {
      setRunningCheckInTime(null);
      setElapsedSessionSeconds(0);
      setLastSessionSeconds(0);
      return;
    }

    const parsedCheckIn = parseAttendanceDate(currentStudent.currentCheckIn);
    const parsedCheckOut = parseAttendanceDate(currentStudent.currentCheckOut);

    // Check if actively checked in - use multiple signals for reliability
    const hasCheckInNoCheckOut = parsedCheckIn && !parsedCheckOut;
    const explicitlyCheckedIn = Boolean(currentStudent.checkedIn);
    const hasCompletedSession = parsedCheckIn && parsedCheckOut;
    const activelyCheckedIn =
      (explicitlyCheckedIn || hasCheckInNoCheckOut) && !hasCompletedSession;

    if (activelyCheckedIn && parsedCheckIn && !parsedCheckOut) {
      setRunningCheckInTime(parsedCheckIn);
      setLastSessionSeconds(0);
      return;
    }

    // Not actively checked in - calculate final session duration if available
    setRunningCheckInTime(null);
    if (hasCompletedSession) {
      const sessionSeconds = Math.max(
        0,
        Math.floor((parsedCheckOut.getTime() - parsedCheckIn.getTime()) / 1000),
      );
      setLastSessionSeconds(sessionSeconds);
    } else {
      setLastSessionSeconds(0);
    }
  }, [currentStudent, parseAttendanceDate]);

  useEffect(() => {
    if (!runningCheckInTime) {
      setElapsedSessionSeconds(0);
      return undefined;
    }

    const tick = () => {
      const seconds = Math.max(
        0,
        Math.floor((Date.now() - runningCheckInTime.getTime()) / 1000),
      );
      setElapsedSessionSeconds(seconds);
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [runningCheckInTime]);

  const sessionDurationDisplay = useMemo(() => {
    if (runningCheckInTime) return toDurationString(elapsedSessionSeconds);
    if (lastSessionSeconds > 0) return toDurationString(lastSessionSeconds);
    return "00:00:00";
  }, [runningCheckInTime, elapsedSessionSeconds, lastSessionSeconds]);

  const totalAttendanceDisplay = useMemo(() => {
    if (typeof totalAttendanceMinutes === "number") {
      return toDurationString(totalAttendanceMinutes * 60);
    }

    const userValue = user?.attendanceHours;
    if (typeof userValue === "string" && userValue.trim()) {
      return userValue;
    }

    return "00:00:00";
  }, [totalAttendanceMinutes, user?.attendanceHours]);

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
                {/* {currentStudent?.currentCheckIn && (
                  <span>Check-In: {currentStudent.currentCheckIn}</span>
                )}
                {currentStudent?.currentCheckOut && (
                  <span>Check-Out: {currentStudent.currentCheckOut}</span>
                )} */}

                {typeof totalAttendanceMinutes === "number" && (
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
                    isCheckedInNow ||
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
                    !isCheckedInNow ||
                    Boolean(currentStudent?.currentCheckOut) ||
                    isAttendanceUpdating
                  }
                >
                  Check-Out
                </button>
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
                  {(runningCheckInTime || lastSessionSeconds > 0) && (
                    <span className="live-timer">
                      <strong>{sessionDurationDisplay}</strong>
                    </span>
                  )}
                  {!runningCheckInTime && lastSessionSeconds === 0 && (
                    <strong>{totalAttendanceDisplay}</strong>
                  )}
                </div>
                <div className="quick-stat">
                  <span>Fee Status</span>
                  <strong>
                    {currentStudent?.feeStatus || user?.feeStatus || "Pending"}
                  </strong>
                </div>
                <div className="quick-stat">
                  <span>Status</span>
                  <strong>{isCheckedInNow ? "Present" : "Absent"}</strong>
                </div>
                <div className="quick-stat">
                  <span>Enrollment Date</span>
                  <strong>
                    {currentStudent?.enrollmentDate || user?.enrollment || "-"}
                  </strong>
                </div>
              </>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
