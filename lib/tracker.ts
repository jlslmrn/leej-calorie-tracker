import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { DailyLog, FoodEntry as PrismaFoodEntry, User } from "@prisma/client";
import { getServerSession } from "next-auth";

type UserWithProfile = User & {
  profile: {
    displayName: string | null;
    heightCm: unknown | null;
    currentWeightKg: unknown | null;
    dailyCalorieGoal: number | null;
    bmi: unknown | null;
  } | null;
};

export const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const parseDateKey = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

export const getWeekStartMonday = (date: Date) => {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export const getWeekdayShort = (date: Date) =>
  date.toLocaleDateString("en-US", { weekday: "short" });

export const getBmiLabel = (bmi: number) => {
  if (bmi <= 0) return "No Data";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal Weight";
  if (bmi < 30) return "Overweight";
  return "Obese";
};

export const toNumber = (value: unknown | null | undefined) => {
  if (value == null) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const toTimeLabel = (date: Date) =>
  date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

export const mapEntries = (entries: PrismaFoodEntry[]) =>
  entries.map((entry) => ({
    id: entry.id,
    name: entry.name,
    calories: entry.calories,
    time: toTimeLabel(entry.loggedAt),
  }));

export const getGoalFromProfile = (user: UserWithProfile) =>
  user.profile?.dailyCalorieGoal ?? 0;

export const calculateProgress = (goal: number, consumed: number) =>
  goal > 0 ? (consumed / goal) * 100 : 0;

export const mapDay = (
  date: Date,
  goal: number,
  consumed: number,
  entries: PrismaFoodEntry[],
) => {
  const progressPercentage = calculateProgress(goal, consumed);
  return {
    date: formatDateKey(date),
    dateLabel: date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    goal,
    consumed,
    remaining: goal - consumed,
    progressPercentage,
    entries: mapEntries(entries),
  };
};

export const getCurrentUserForTracker = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  return prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      profile: {
        select: {
          displayName: true,
          heightCm: true,
          currentWeightKg: true,
          dailyCalorieGoal: true,
          bmi: true,
        },
      },
    },
  });
};

export const getOrCreateDailyLog = async (
  userId: string,
  date: Date,
  goal: number,
) => {
  const existing = await prisma.dailyLog.findUnique({
    where: { userId_date: { userId, date } },
  });
  if (existing) return existing;

  return prisma.dailyLog.create({
    data: {
      userId,
      date,
      calorieGoal: goal,
      caloriesConsumed: 0,
      remainingCalories: goal,
      progressPercent: 0,
      goalHit: false,
    },
  });
};

export const recalculateDailyLog = async (dailyLog: DailyLog) => {
  const aggregate = await prisma.foodEntry.aggregate({
    where: { dailyLogId: dailyLog.id },
    _sum: { calories: true },
  });

  const consumed = aggregate._sum.calories ?? 0;
  const progress = calculateProgress(dailyLog.calorieGoal, consumed);
  const goalHit =
    dailyLog.calorieGoal > 0 && consumed > 0 && consumed <= dailyLog.calorieGoal;

  return prisma.dailyLog.update({
    where: { id: dailyLog.id },
    data: {
      caloriesConsumed: consumed,
      remainingCalories: dailyLog.calorieGoal - consumed,
      progressPercent: progress,
      goalHit,
    },
  });
};
