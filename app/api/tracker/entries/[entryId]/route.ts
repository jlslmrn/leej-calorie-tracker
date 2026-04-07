import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserForTracker } from "@/lib/tracker";

interface RouteContext {
  params: { entryId: string } | Promise<{ entryId: string }>;
}

export async function DELETE(_: Request, context: RouteContext) {
  const user = await getCurrentUserForTracker();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { entryId } = await Promise.resolve(context.params);
  if (!entryId) {
    return NextResponse.json({ error: "Entry ID is required" }, { status: 400 });
  }

  const entry = await prisma.foodEntry.findUnique({
    where: { id: entryId },
    select: { id: true, userId: true, dailyLogId: true },
  });

  if (!entry || entry.userId !== user.id) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.foodEntry.delete({
      where: { id: entryId },
    });

    const dailyLog = await tx.dailyLog.findUnique({
      where: { id: entry.dailyLogId },
      select: { id: true, calorieGoal: true },
    });
    if (!dailyLog) return;

    const aggregate = await tx.foodEntry.aggregate({
      where: { dailyLogId: dailyLog.id },
      _sum: { calories: true },
    });

    const consumed = aggregate._sum.calories ?? 0;
    const progress =
      dailyLog.calorieGoal > 0 ? (consumed / dailyLog.calorieGoal) * 100 : 0;
    const goalHit =
      dailyLog.calorieGoal > 0 && consumed > 0 && consumed <= dailyLog.calorieGoal;

    await tx.dailyLog.update({
      where: { id: dailyLog.id },
      data: {
        caloriesConsumed: consumed,
        remainingCalories: dailyLog.calorieGoal - consumed,
        progressPercent: progress,
        goalHit,
      },
    });
  });

  return NextResponse.json({ success: true });
}
