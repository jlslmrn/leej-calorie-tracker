import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  calculateProgress,
  formatDateKey,
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

export async function GET(request: Request) {
  const user = await getCurrentUserForTracker();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const url = new URL(request.url);
  const monthParam = Number(url.searchParams.get("month"));
  const yearParam = Number(url.searchParams.get("year"));

  const minMonth = user.createdAt.getUTCMonth();
  const minYear = user.createdAt.getUTCFullYear();

  let selectedMonth = Number.isInteger(monthParam) ? monthParam : now.getUTCMonth();
  let selectedYear = Number.isInteger(yearParam) ? yearParam : now.getUTCFullYear();

  if (selectedMonth < 0 || selectedMonth > 11) selectedMonth = now.getUTCMonth();

  if (
    selectedYear < minYear ||
    (selectedYear === minYear && selectedMonth < minMonth)
  ) {
    selectedMonth = minMonth;
    selectedYear = minYear;
  }

  const todayKey = formatDateKey(now);
  const todayDate = parseDateKey(todayKey);
  const { start: monthStart, end: monthEnd } = getMonthRange(selectedYear, selectedMonth);
  const weekStart = getWeekStartMonday(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

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
    date.setDate(weekStart.getDate() + index);
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
  const userJoinDate = parseDateKey(formatDateKey(user.createdAt));

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
      createdAt: formatDateKey(user.createdAt),
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
