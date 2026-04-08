import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  formatDateKey,
  getDateKeyInTimeZone,
  getCurrentUserForTracker,
  getGoalFromProfile,
  getMaintenanceFromProfile,
  mapDay,
  parseDateKey,
} from "@/lib/tracker";

interface CreateEntryBody {
  name?: unknown;
  calories?: unknown;
  date?: unknown;
  tz?: unknown;
}

export async function POST(request: Request) {
  const user = await getCurrentUserForTracker();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as CreateEntryBody;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const calories = Number(body.calories);
  const timeZone =
    typeof body.tz === "string" && body.tz ? body.tz : "UTC";

  if (!name) {
    return NextResponse.json({ error: "Food name is required" }, { status: 400 });
  }

  if (!Number.isFinite(calories) || calories <= 1) {
    return NextResponse.json(
      { error: "Calories must be greater than 1" },
      { status: 400 },
    );
  }

  let fallbackDateKey = formatDateKey(new Date());
  try {
    fallbackDateKey = getDateKeyInTimeZone(new Date(), timeZone);
  } catch {
    fallbackDateKey = formatDateKey(new Date());
  }
  const dateKey =
    typeof body.date === "string" && body.date ? body.date : fallbackDateKey;
  const date = parseDateKey(dateKey);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  let userJoinDate = parseDateKey(formatDateKey(user.createdAt));
  try {
    userJoinDate = parseDateKey(getDateKeyInTimeZone(user.createdAt, timeZone));
  } catch {
    userJoinDate = parseDateKey(formatDateKey(user.createdAt));
  }
  if (date < userJoinDate) {
    return NextResponse.json(
      { error: "Cannot add entries before account creation date" },
      { status: 400 },
    );
  }

  const goal = getGoalFromProfile(user);
  const maintenanceCalories = getMaintenanceFromProfile(user);

  const { updatedDailyLog } = await prisma.$transaction(async (tx) => {
    const existingLog = await tx.dailyLog.findUnique({
      where: { userId_date: { userId: user.id, date } },
    });

    const dailyLog =
      existingLog ??
      (await tx.dailyLog.create({
        data: {
          userId: user.id,
          date,
          calorieGoal: goal,
          maintenanceCalories,
          caloriesConsumed: 0,
          remainingCalories: goal,
          progressPercent: 0,
          goalHit: false,
        },
      }));

    await tx.foodEntry.create({
      data: {
        userId: user.id,
        dailyLogId: dailyLog.id,
        name,
        calories: Math.round(calories),
      },
    });

    const aggregate = await tx.foodEntry.aggregate({
      where: { dailyLogId: dailyLog.id },
      _sum: { calories: true },
    });
    const consumed = aggregate._sum.calories ?? 0;
    const progress = dailyLog.calorieGoal > 0 ? (consumed / dailyLog.calorieGoal) * 100 : 0;
    const goalHit =
      dailyLog.calorieGoal > 0 && consumed > 0 && consumed <= dailyLog.calorieGoal;

    const updatedDailyLog = await tx.dailyLog.update({
      where: { id: dailyLog.id },
      data: {
        caloriesConsumed: consumed,
        remainingCalories: dailyLog.calorieGoal - consumed,
        progressPercent: progress,
        goalHit,
      },
    });

    return { updatedDailyLog };
  });

  const dailyLogWithEntries = await prisma.dailyLog.findUnique({
    where: { id: updatedDailyLog.id },
    include: { entries: { orderBy: { loggedAt: "desc" } } },
  });

  if (!dailyLogWithEntries) {
    return NextResponse.json({ error: "Daily log not found" }, { status: 404 });
  }

  return NextResponse.json({
    day: mapDay(
      date,
      dailyLogWithEntries.calorieGoal,
      dailyLogWithEntries.maintenanceCalories ?? maintenanceCalories,
      dailyLogWithEntries.caloriesConsumed,
      dailyLogWithEntries.entries,
    ),
  });
}
