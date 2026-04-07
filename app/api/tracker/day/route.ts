import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUserForTracker,
  getGoalFromProfile,
  mapDay,
  parseDateKey,
} from "@/lib/tracker";

export async function GET(request: Request) {
  const user = await getCurrentUserForTracker();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");
  if (!dateParam) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  const parsed = parseDateKey(dateParam);
  if (Number.isNaN(parsed.getTime())) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  const dailyLog = await prisma.dailyLog.findUnique({
    where: { userId_date: { userId: user.id, date: parsed } },
    include: { entries: { orderBy: { loggedAt: "desc" } } },
  });

  const goal = dailyLog?.calorieGoal ?? getGoalFromProfile(user);
  const consumed = dailyLog?.caloriesConsumed ?? 0;
  const entries = dailyLog?.entries ?? [];

  return NextResponse.json({
    day: mapDay(parsed, goal, consumed, entries),
  });
}
