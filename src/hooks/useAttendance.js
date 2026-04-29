import { useCallback, useEffect, useMemo, useState } from "react";
import {
  checkInStudentApi,
  checkOutStudentApi,
  getStudentAttendanceCalendarApi,
} from "../services/studentApi";

const parseAttendanceDate = (value) => {
  if (!value) return null;
  const parsed = new Date(String(value).replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toLocalDateKey = (value) => {
  const d = value instanceof Date ? value : parseAttendanceDate(value);
  if (!d) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const toDurationString = (sec) => {
  const s = Math.max(0, Math.floor(Number(sec) || 0));
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${ss}`;
};

const normalizeAttendanceEntries = (res) => {
  const raw =
    (Array.isArray(res?.data) && res.data) ||
    (Array.isArray(res?.data?.content) && res.data.content) ||
    (Array.isArray(res?.data?.records) && res.data.records) ||
    (Array.isArray(res) && res) ||
    [];

  return raw.map((e) => ({
    date: e.date,
    status: e.status,
    checkIn: e.checkIn,
    checkOut: e.checkOut,
  }));
};

const extractStudentId = (currentStudent, user) =>
  currentStudent?.studentId ||
  currentStudent?.id ||
  user?.studentId ||
  user?.id;

export default function useAttendance({
  user,
  currentStudent,
  isAdmin,
  setStudents,
  setLoadError,
}) {
  const [attendanceCalendar, setAttendanceCalendar] = useState([]);
  const [runningCheckInTime, setRunningCheckInTime] = useState(null);
  const [elapsedSessionSeconds, setElapsedSessionSeconds] = useState(0);
  const [lastSessionSeconds, setLastSessionSeconds] = useState(0);
  const [isAttendanceUpdating, setIsAttendanceUpdating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const todayKey = useMemo(() => toLocalDateKey(new Date()), []);

  const todayAttendance = useMemo(() => {
    const byDate = attendanceCalendar.find((d) => d.date === todayKey);
    if (byDate) return byDate;

    return (
      attendanceCalendar.find((d) => {
        const ci = toLocalDateKey(d.checkIn);
        const co = toLocalDateKey(d.checkOut);
        return ci === todayKey || co === todayKey;
      }) || null
    );
  }, [attendanceCalendar, todayKey]);

  const hasCheckedInToday = Boolean(todayAttendance?.checkIn);
  const hasCheckedOutToday = Boolean(todayAttendance?.checkOut);

  const isCheckedInNow = hasCheckedInToday && !hasCheckedOutToday;

  const canCheckInToday = !hasCheckedInToday;

  const canCheckOutToday = hasCheckedInToday && !hasCheckedOutToday;

  const handleStudentAttendance = useCallback(
    async (action) => {
      if (isAdmin || !currentStudent) return;

      const id = extractStudentId(currentStudent, user);
      if (!id) return;

      setIsAttendanceUpdating(true);

      try {
        const res =
          action === "checkin"
            ? await checkInStudentApi(id)
            : await checkOutStudentApi(id);

        const data = res?.data || res;

        const checkIn = data.checkIn;
        const checkOut = data.checkOut;

        const key = toLocalDateKey(checkIn || checkOut || new Date());

        setAttendanceCalendar((prev) => {
          const idx = prev.findIndex((d) => d.date === key);

          const updated = {
            date: key,
            status: "PRESENT",
            checkIn,
            checkOut,
          };

          if (idx === -1) return [...prev, updated];

          const copy = [...prev];
          copy[idx] = { ...copy[idx], ...updated };
          return copy;
        });

        if (action === "checkin") {
          setRunningCheckInTime(parseAttendanceDate(checkIn));
          setLastSessionSeconds(0);
        } else {
          setRunningCheckInTime(null);
          if (checkIn && checkOut) {
            const sec =
              (new Date(checkOut) - new Date(checkIn)) / 1000;
            setLastSessionSeconds(sec);
          }
        }
      } catch (e) {
        setLoadError("Attendance update failed");
      } finally {
        setIsAttendanceUpdating(false);
      }
    },
    [currentStudent, user, isAdmin, setLoadError]
  );

  useEffect(() => {
    if (!runningCheckInTime) return;

    const id = setInterval(() => {
      setElapsedSessionSeconds(
        Math.floor((Date.now() - runningCheckInTime.getTime()) / 1000)
      );
    }, 1000);

    return () => clearInterval(id);
  }, [runningCheckInTime]);

  const sessionDurationDisplay = useMemo(() => {
    if (runningCheckInTime)
      return toDurationString(elapsedSessionSeconds);
    return toDurationString(lastSessionSeconds);
  }, [runningCheckInTime, elapsedSessionSeconds, lastSessionSeconds]);

  const totalAttendanceSeconds = useMemo(() => {
    return attendanceCalendar.reduce((sum, entry) => {
      if (!entry?.checkIn || !entry?.checkOut) return sum;
      const start = parseAttendanceDate(entry.checkIn);
      const end = parseAttendanceDate(entry.checkOut);
      if (!start || !end) return sum;
      return sum + Math.max(0, Math.floor((end - start) / 1000));
    }, 0);
  }, [attendanceCalendar]);

  const totalAttendanceDisplay = useMemo(
    () => toDurationString(totalAttendanceSeconds),
    [totalAttendanceSeconds]
  );

  const attendanceByDate = useMemo(() => {
    return new Map(
      attendanceCalendar.map((entry) => [entry.date, entry])
    );
  }, [attendanceCalendar]);

  const calendarDays = useMemo(() => {
    const [yearText, monthText] = String(selectedMonth || "").split("-");
    const year = Number(yearText);
    const month = Number(monthText);
    if (!year || !month) return [];

    const daysInMonth = new Date(year, month, 0).getDate();
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    return Array.from({ length: daysInMonth }, (_, idx) => {
      const day = idx + 1;
      const dayKey = `${selectedMonth}-${String(day).padStart(2, "0")}`;
      return {
        day,
        dayKey,
        inFuture:
          selectedMonth > currentMonthKey ||
          (selectedMonth === currentMonthKey && day > now.getDate()),
      };
    });
  }, [selectedMonth]);

  useEffect(() => {
    if (isAdmin) return;

    const id = extractStudentId(currentStudent, user);
    if (!id) return;

    getStudentAttendanceCalendarApi(id).then((res) => {
      const normalized = normalizeAttendanceEntries(res);
      setAttendanceCalendar(normalized);

      const lastCompleted = [...normalized]
        .reverse()
        .find((entry) => entry?.checkIn && entry?.checkOut);
      if (lastCompleted) {
        const start = parseAttendanceDate(lastCompleted.checkIn);
        const end = parseAttendanceDate(lastCompleted.checkOut);
        if (start && end) {
          setLastSessionSeconds(Math.max(0, Math.floor((end - start) / 1000)));
        }
      }
    });
  }, [currentStudent, user, isAdmin]);

  useEffect(() => {
    if (todayAttendance?.checkIn && !todayAttendance?.checkOut) {
      setRunningCheckInTime(parseAttendanceDate(todayAttendance.checkIn));
      return;
    }

    if (todayAttendance?.checkIn && todayAttendance?.checkOut) {
      const start = parseAttendanceDate(todayAttendance.checkIn);
      const end = parseAttendanceDate(todayAttendance.checkOut);
      if (start && end) {
        setLastSessionSeconds(Math.max(0, Math.floor((end - start) / 1000)));
      }
    }

    setRunningCheckInTime(null);
  }, [todayAttendance]);

  return {
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
    isAttendanceUpdating,
  };
}
