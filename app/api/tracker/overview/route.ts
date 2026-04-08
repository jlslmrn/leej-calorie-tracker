import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  calculateProgress,
  formatDateKey,
  getDateKeyInTimeZone,
  getBmiLabel,
  getCurrentUserForTracker,
  getGoalFromProfile,
  getMaintenanceFromProfile,
  getWeekStartMonday,
  getWeekdayShort,
  mapDay,
  parseDateKey,
  toNumber,
} from "@/lib/tracker";

const getMonthRange = (year: number, month: number) => {
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 0));
  return { start, end };
};

const isValidTimeZone = (timeZone: string) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
};

export async function GET(request: Request) {
  const user = await getCurrentUserForTracker();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const url = new URL(request.url);
  const timeZoneParam = url.searchParams.get("tz");
  const timeZone =
    timeZoneParam && isValidTimeZone(timeZoneParam) ? timeZoneParam : "UTC";
  const anchorDateParam = url.searchParams.get("anchorDate");
  const fallbackAnchorDate = getDateKeyInTimeZone(now, timeZone);
  const requestedAnchorDateKey =
    anchorDateParam && /^\d{4}-\d{2}-\d{2}$/.test(anchorDateParam)
      ? anchorDateParam
      : fallbackAnchorDate;
  const parsedAnchorDate = parseDateKey(requestedAnchorDateKey);
  const anchorDateKey = Number.isNaN(parsedAnchorDate.getTime())
    ? fallbackAnchorDate
    : requestedAnchorDateKey;

  const monthParam = Number(url.searchParams.get("month"));
  const yearParam = Number(url.searchParams.get("year"));
  const anchorDate = parseDateKey(anchorDateKey);
  const anchorMonth = anchorDate.getUTCMonth();
  const anchorYear = anchorDate.getUTCFullYear();

  const joinedDateKey = getDateKeyInTimeZone(user.createdAt, timeZone);
  const joinedDate = parseDateKey(joinedDateKey);
  const minMonth = joinedDate.getUTCMonth();
  const minYear = joinedDate.getUTCFullYear();

  let selectedMonth = Number.isInteger(monthParam) ? monthParam : anchorMonth;
  let selectedYear = Number.isInteger(yearParam) ? yearParam : anchorYear;

  if (selectedMonth < 0 || selectedMonth > 11) selectedMonth = anchorMonth;

  if (
    selectedYear < minYear ||
    (selectedYear === minYear && selectedMonth < minMonth)
  ) {
    selectedMonth = minMonth;
    selectedYear = minYear;
  }

  const todayDate = anchorDate;
  const { start: monthStart, end: monthEnd } = getMonthRange(selectedYear, selectedMonth);
  const weekStart = getWeekStartMonday(todayDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

  const goal = getGoalFromProfile(user);
  const maintenanceCalories = getMaintenanceFromProfile(user);

  const [todayLog, weeklyLogs, monthlyLogs] = await Promise.all([
    prisma.dailyLog.findUnique({
      where: { userId_date: { userId: user.id, date: todayDate } },
      include: { entries: { orderBy: { loggedAt: "desc" } } },
    }),
    prisma.dailyLog.findMany({
      where: {
        userId: user.id,
        date: { gte: weekStart, lte: weekEnd },
      },
      select: {
        date: true,
        caloriesConsumed: true,
        calorieGoal: true,
        maintenanceCalories: true,
      },
    }),
    prisma.dailyLog.findMany({
      where: {
        userId: user.id,
        date: { gte: monthStart, lte: monthEnd },
      },
      select: {
        date: true,
        caloriesConsumed: true,
        calorieGoal: true,
        maintenanceCalories: true,
      },
    }),
  ]);

  const daily = mapDay(
    todayDate,
    todayLog?.calorieGoal ?? goal,
    todayLog?.maintenanceCalories ?? maintenanceCalories,
    todayLog?.caloriesConsumed ?? 0,
    todayLog?.entries ?? [],
  );

  const weeklyMap = new Map(
    weeklyLogs.map((log) => [formatDateKey(log.date), log]),
  );
  const weeklyData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setUTCDate(weekStart.getUTCDate() + index);
    const key = formatDateKey(date);
    const log = weeklyMap.get(key);
    const consumed = log?.caloriesConsumed ?? 0;
    const dailyGoal = log?.calorieGoal ?? goal;
    const percentage = calculateProgress(dailyGoal, consumed);
    const hit = dailyGoal > 0 && consumed > 0 && consumed <= dailyGoal;

    return {
      day: getWeekdayShort(date),
      date: key,
      percentage,
      hit,
    };
  });

  const daysHitWeek = weeklyData.filter((day) => day.hit).length;

  const monthlyMap = new Map(
    monthlyLogs.map((log) => [formatDateKey(log.date), log]),
  );
  const daysInMonth = new Date(Date.UTC(selectedYear, selectedMonth + 1, 0)).getUTCDate();
  const userJoinDate = joinedDate;

  const monthlyData = Array.from({ length: daysInMonth }, (_, index) => {
    const dayNumber = index + 1;
    const date = new Date(Date.UTC(selectedYear, selectedMonth, dayNumber));
    const key = formatDateKey(date);

    const isBeforeJoinDate = date < userJoinDate;
    const isFutureDate = date > todayDate;
    const log = monthlyMap.get(key);

    const consumed =
      isBeforeJoinDate || isFutureDate ? 0 : (log?.caloriesConsumed ?? 0);
    const dailyGoal =
      isBeforeJoinDate || isFutureDate ? 0 : (log?.calorieGoal ?? goal);
    const percentage = calculateProgress(dailyGoal, consumed);
    const hit = dailyGoal > 0 && consumed > 0 && consumed <= dailyGoal;

    return {
      day: dayNumber,
      date: key,
      percentage,
      hit,
    };
  });

  const daysHitMonth = monthlyData.filter((day) => day.hit).length;

  return NextResponse.json({
    profile: {
      name: user.profile?.displayName || user.name || "User",
      email: user.email ?? "",
      bmi: toNumber(user.profile?.bmi),
      heightCm: toNumber(user.profile?.heightCm),
      weightKg: toNumber(user.profile?.currentWeightKg),
      bmiLabel: getBmiLabel(toNumber(user.profile?.bmi)),
      createdAt: joinedDateKey,
    },
    daily,
    weekly: {
      daysHit: daysHitWeek,
      data: weeklyData,
    },
    monthly: {
      month: selectedMonth,
      year: selectedYear,
      daysHit: daysHitMonth,
      data: monthlyData,
      minMonth,
      minYear,
      canGoPrevMonth:
        selectedYear > minYear ||
        (selectedYear === minYear && selectedMonth > minMonth),
    },
  });
}
