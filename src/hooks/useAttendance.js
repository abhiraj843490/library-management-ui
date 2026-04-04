import { useCallback, useEffect, useMemo, useState } from "react";
import {
  checkInStudentApi,
  checkOutStudentApi,
  getStudentAttendanceCalendarApi,
} from "../services/studentApi";

const parseAttendanceDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const normalized = String(value).trim().replace(" ", "T");
  const safeValue = normalized.replace(
    /(\.\d{3})\d+(?=(Z|[+-]\d{2}:\d{2})?$)/,
    "$1",
  );
  const parsed = new Date(safeValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toLocalDateKey = (value) => {
  const parsed = value instanceof Date ? value : parseAttendanceDate(value);
  if (!parsed) return null;

  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const toDurationString = (secondsValue) => {
  const totalSeconds = Math.max(0, Math.floor(Number(secondsValue) || 0));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (v) => String(v).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

const normalizeAttendanceEntries = (response) => {
  const raw =
    (Array.isArray(response) && response) ||
    (Array.isArray(response?.data) && response.data) ||
    (Array.isArray(response?.data?.content) && response.data.content) ||
    (Array.isArray(response?.data?.records) && response.data.records) ||
    [];

  return raw
    .map((entry) => {
      const checkInValue = entry.checkIn || entry.currentCheckIn || null;
      const checkOutValue = entry.checkOut || entry.currentCheckOut || null;
      const day =
        entry.date ||
        entry.attendanceDate ||
        entry.day ||
        toLocalDateKey(checkInValue || checkOutValue);

      if (!day) return null;

      const statusText = String(entry.status || "").toUpperCase();
      let status = "UNKNOWN";
      if (statusText.includes("ABSENT")) status = "ABSENT";
      else if (statusText.includes("PRESENT")) status = "PRESENT";
      else if (checkInValue) status = "PRESENT";

      return {
        date: day,
        status,
        checkIn: checkInValue,
        checkOut: checkOutValue,
      };
    })
    .filter(Boolean);
};

const extractStudentId = (currentStudent, user) => {
  return (
    currentStudent?.studentId ??
    currentStudent?.id ??
    user?.studentId ??
    user?.id ??
    user?.userCode
  );
};

export default function useAttendance({
  user,
  currentStudent,
  isAdmin,
  setStudents,
  setLoadError,
}) {
  const [isAttendanceUpdating, setIsAttendanceUpdating] = useState(false);
  const [runningCheckInTime, setRunningCheckInTime] = useState(null);
  const [elapsedSessionSeconds, setElapsedSessionSeconds] = useState(0);
  const [lastSessionSeconds, setLastSessionSeconds] = useState(0);
  const [totalAttendanceMinutes, setTotalAttendanceMinutes] = useState(null);
  const [attendanceCalendar, setAttendanceCalendar] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const todayDateKey = useMemo(
    () => toLocalDateKey(new Date()),
    [],
  );

  const parsedCurrentCheckIn = useMemo(
    () => parseAttendanceDate(currentStudent?.currentCheckIn),
    [currentStudent?.currentCheckIn],
  );

  const parsedCurrentCheckOut = useMemo(
    () => parseAttendanceDate(currentStudent?.currentCheckOut),
    [currentStudent?.currentCheckOut],
  );

  const hasCheckedInToday = useMemo(() => {
    if (!parsedCurrentCheckIn) return false;
    return toLocalDateKey(parsedCurrentCheckIn) === todayDateKey;
  }, [parsedCurrentCheckIn, todayDateKey]);

  const hasCheckedOutToday = useMemo(() => {
    if (!parsedCurrentCheckOut) return false;
    return toLocalDateKey(parsedCurrentCheckOut) === todayDateKey;
  }, [parsedCurrentCheckOut, todayDateKey]);

  const isCheckedInNow = useMemo(() => {
    if (!currentStudent) return false;
    return (
      hasCheckedInToday &&
      !hasCheckedOutToday &&
      Boolean(currentStudent.checkedIn || parsedCurrentCheckIn)
    );
  }, [currentStudent, hasCheckedInToday, hasCheckedOutToday, parsedCurrentCheckIn]);

  const canCheckInToday = useMemo(() => !hasCheckedInToday, [hasCheckedInToday]);

  const canCheckOutToday = useMemo(
    () => hasCheckedInToday && !hasCheckedOutToday && isCheckedInNow,
    [hasCheckedInToday, hasCheckedOutToday, isCheckedInNow],
  );

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
        if (parsedCheckIn && parsedCheckOut) {
          setLastSessionSeconds(
            Math.max(
              0,
              Math.floor((parsedCheckOut.getTime() - parsedCheckIn.getTime()) / 1000),
            ),
          );
        } else if (Number.isFinite(Number(attendanceData.sessionMinutes)) && Number(attendanceData.sessionMinutes) > 0) {
          setLastSessionSeconds(
            Math.max(0, Math.floor(Number(attendanceData.sessionMinutes) * 60)),
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

      const attendanceDayKey = toLocalDateKey(
        checkInValue || checkOutValue || new Date(),
      );
      if (attendanceDayKey) {
        setAttendanceCalendar((prev) => {
          const nextEntry = {
            date: attendanceDayKey,
            status: "PRESENT",
            checkIn: checkInValue || null,
            checkOut: action === "checkout" ? checkOutValue || null : null,
          };

          const index = prev.findIndex(
            (entry) => String(entry.date) === attendanceDayKey,
          );
          if (index === -1) return [...prev, nextEntry];

          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            ...nextEntry,
            checkIn: nextEntry.checkIn || updated[index].checkIn || null,
            checkOut: nextEntry.checkOut || updated[index].checkOut || null,
          };
          return updated;
        });
      }
    },
    [setStudents],
  );

  const handleStudentAttendance = useCallback(
    async (action) => {
      if (isAdmin || !currentStudent) return;
      const apiId = extractStudentId(currentStudent, user);
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
    [isAdmin, currentStudent, user, applyAttendanceSnapshot, setLoadError],
  );

  useEffect(() => {
    if (!currentStudent) {
      setRunningCheckInTime(null);
      setElapsedSessionSeconds(0);
      setLastSessionSeconds(0);
      setTotalAttendanceMinutes(null);
      return;
    }

    const parsedCheckIn = parsedCurrentCheckIn;
    const parsedCheckOut = parsedCurrentCheckOut;
    const hasCheckInNoCheckOut = hasCheckedInToday && !hasCheckedOutToday;
    const explicitlyCheckedIn = Boolean(currentStudent.checkedIn);
    const activelyCheckedIn =
      (explicitlyCheckedIn || hasCheckInNoCheckOut) && hasCheckInNoCheckOut;

    if (activelyCheckedIn && parsedCheckIn && !parsedCheckOut) {
      setRunningCheckInTime(parsedCheckIn);
      setLastSessionSeconds(0);
      setTotalAttendanceMinutes(
        typeof currentStudent.totalAttendanceMinutes === "number"
          ? currentStudent.totalAttendanceMinutes
          : null,
      );
      return;
    }

    setRunningCheckInTime(null);
    // Prefer timestamp-based calculation for accuracy, especially when lastSessionMinutes is 0
    if (parsedCheckIn && parsedCheckOut) {
      const sessionSeconds = Math.max(
        0,
        Math.floor((parsedCheckOut.getTime() - parsedCheckIn.getTime()) / 1000),
      );
      setLastSessionSeconds(sessionSeconds);
    } else if (typeof currentStudent.lastSessionMinutes === "number" && currentStudent.lastSessionMinutes > 0) {
      setLastSessionSeconds(
        Math.max(0, Number(currentStudent.lastSessionMinutes) * 60),
      );
    } else {
      setLastSessionSeconds(0);
    }

    setTotalAttendanceMinutes(
      typeof currentStudent.totalAttendanceMinutes === "number"
        ? currentStudent.totalAttendanceMinutes
        : null,
    );
  }, [
    currentStudent,
    parsedCurrentCheckIn,
    parsedCurrentCheckOut,
    hasCheckedInToday,
    hasCheckedOutToday,
  ]);

  useEffect(() => {
    if (isAdmin) return;
    const studentId = extractStudentId(currentStudent, user);
    if (!studentId) return;

    let isMounted = true;
    (async () => {
      try {
        const response = await getStudentAttendanceCalendarApi(
          studentId,
          selectedMonth,
        );
        if (!isMounted) return;
        setAttendanceCalendar(normalizeAttendanceEntries(response));
      } catch (_) {
        if (!isMounted) return;
        setAttendanceCalendar([]);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [
    isAdmin,
    currentStudent,
    user,
    selectedMonth,
  ]);

  const calendarMonthParts = useMemo(() => {
    const [yearText, monthText] = String(selectedMonth || "").split("-");
    const year = Number(yearText);
    const monthIndex = Number(monthText) - 1;
    if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) {
      const now = new Date();
      return { year: now.getFullYear(), monthIndex: now.getMonth() };
    }
    return { year, monthIndex };
  }, [selectedMonth]);

  const calendarDays = useMemo(() => {
    const { year, monthIndex } = calendarMonthParts;
    const totalDays = new Date(year, monthIndex + 1, 0).getDate();
    const today = new Date();
    const thisMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

    const days = [];
    for (let day = 1; day <= totalDays; day += 1) {
      const dayKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const inFuture = selectedMonth === thisMonthKey && day > today.getDate();
      days.push({ day, dayKey, inFuture });
    }
    return days;
  }, [calendarMonthParts, selectedMonth]);

  const attendanceByDate = useMemo(() => {
    const map = new Map();
    attendanceCalendar.forEach((entry) => {
      map.set(String(entry.date), entry);
    });
    return map;
  }, [attendanceCalendar]);

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

  return {
    isAttendanceUpdating,
    runningCheckInTime,
    elapsedSessionSeconds,
    lastSessionSeconds,
    totalAttendanceMinutes,
    attendanceCalendar,
    selectedMonth,
    setSelectedMonth,
    attendanceByDate,
    calendarDays,
    sessionDurationDisplay,
    totalAttendanceDisplay,
    hasCheckedOutToday,
    isCheckedInNow,
    canCheckInToday,
    canCheckOutToday,
    handleStudentAttendance,
  };
}
