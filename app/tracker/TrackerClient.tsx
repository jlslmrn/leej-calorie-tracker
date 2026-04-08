"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  AddFoodSheet,
  DayDetailsScreen,
  ErrorState,
  LoadingOverlay,
  LoadingState,
  MealsListCard,
  MonthlyView,
  ProgressCard,
  StatsGrid,
  TrackerHeader,
  ViewToggle,
  WeeklyView,
} from "./_components/tracker-ui";
import {
  MONTH_NAMES,
  type DayDetailData,
  type MonthlyDayData,
  type SummaryView,
  type TrackerOverviewResponse,
  type TrackerView,
  type WeeklyDayData,
} from "./_components/tracker-data";

const getLocalDateKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getMonthYearFromDateKey = (dateKey: string) => {
  const [year, month] = dateKey.split("-").map(Number);
  return {
    year,
    month: month - 1,
  };
};

export default function TrackerClient() {
  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    [],
  );
  const [anchorDate, setAnchorDate] = useState(getLocalDateKey);
  const { month: defaultMonth, year: defaultYear } = useMemo(
    () => getMonthYearFromDateKey(anchorDate),
    [anchorDate],
  );

  const [view, setView] = useState<TrackerView>("daily");
  const [showAddFood, setShowAddFood] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedDayDetails, setSelectedDayDetails] = useState<DayDetailData | null>(null);
  const [previousView, setPreviousView] = useState<SummaryView | null>(null);
  const [overview, setOverview] = useState<TrackerOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [isSubmittingEntry, setIsSubmittingEntry] = useState(false);
  const [removingEntryId, setRemovingEntryId] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadOverview = useCallback(async (month: number, year: number, dateAnchor: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams({
        month: String(month),
        year: String(year),
        tz: timezone,
        anchorDate: dateAnchor,
      });
      const response = await fetch(`/api/tracker/overview?${params.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "Failed to load tracker data");
      }

      const payload = (await response.json()) as TrackerOverviewResponse;
      setOverview(payload);
      setSelectedMonth(payload.monthly.month);
      setSelectedYear(payload.monthly.year);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [timezone]);

  useEffect(() => {
    void loadOverview(selectedMonth, selectedYear, anchorDate);
  }, [anchorDate, loadOverview, selectedMonth, selectedYear]);

  useEffect(() => {
    const updateAnchorDate = () => {
      const nextKey = getLocalDateKey();
      setAnchorDate((current) => {
        if (current === nextKey) return current;
        if (view === "daily" && !selectedDayDetails) {
          const next = getMonthYearFromDateKey(nextKey);
          setSelectedMonth(next.month);
          setSelectedYear(next.year);
        }
        return nextKey;
      });
    };

    updateAnchorDate();
    const intervalId = window.setInterval(updateAnchorDate, 60_000);
    window.addEventListener("focus", updateAnchorDate);
    document.addEventListener("visibilitychange", updateAnchorDate);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", updateAnchorDate);
      document.removeEventListener("visibilitychange", updateAnchorDate);
    };
  }, [selectedDayDetails, view]);

  const openDayDetails = useCallback(
    async (date: string, source: SummaryView) => {
      setPreviousView(source);
      setIsActionLoading(true);
      try {
        const response = await fetch(`/api/tracker/day?date=${date}`, { cache: "no-store" });
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          setErrorMessage(body?.error || "Failed to load selected day");
          return;
        }
        const payload = (await response.json()) as { day: DayDetailData };
        setSelectedDayDetails(payload.day);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to load selected day");
      } finally {
        setIsActionLoading(false);
      }
    },
    [],
  );

  const refreshDayDetails = useCallback(async (date: string) => {
    const response = await fetch(`/api/tracker/day?date=${date}`, { cache: "no-store" });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error || "Failed to refresh selected day");
    }
    const payload = (await response.json()) as { day: DayDetailData };
    setSelectedDayDetails(payload.day);
  }, []);

  const onSelectDay = (day: WeeklyDayData | MonthlyDayData, source: SummaryView) => {
    void openDayDetails(day.date, source);
  };

  const onBackFromDayDetails = () => {
    setSelectedDayDetails(null);
    if (previousView) {
      setView(previousView);
      setPreviousView(null);
    }
  };

  const onPreviousMonth = () => {
    if (!overview?.monthly.canGoPrevMonth) return;
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((current) => current - 1);
      return;
    }
    setSelectedMonth((current) => current - 1);
  };

  const onNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((current) => current + 1);
      return;
    }
    setSelectedMonth((current) => current + 1);
  };

  const submitEntry = async () => {
    setSheetError(null);
    const trimmedName = foodName.trim();
    const parsedCalories = Number(calories);

    if (!trimmedName) {
      setSheetError("Food name is required.");
      return;
    }
    if (!Number.isFinite(parsedCalories) || parsedCalories <= 1) {
      setSheetError("Calories must be greater than 1.");
      return;
    }

    setIsSubmittingEntry(true);
    try {
      const response = await fetch("/api/tracker/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          calories: Math.round(parsedCalories),
          date: overview?.daily.date,
          tz: timezone,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "Failed to add entry");
      }

      setShowAddFood(false);
      setFoodName("");
      setCalories("");
      await loadOverview(selectedMonth, selectedYear, anchorDate);
    } catch (error) {
      setSheetError(error instanceof Error ? error.message : "Failed to add entry");
    } finally {
      setIsSubmittingEntry(false);
    }
  };

  const removeEntry = async (entryId: string) => {
    if (!entryId || removingEntryId) return;
    setErrorMessage(null);
    setRemovingEntryId(entryId);
    setIsActionLoading(true);

    try {
      const response = await fetch(`/api/tracker/entries/${encodeURIComponent(entryId)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "Failed to remove entry");
      }

      if (selectedDayDetails) {
        await refreshDayDetails(selectedDayDetails.date);
      }
      await loadOverview(selectedMonth, selectedYear, anchorDate);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to remove entry");
    } finally {
      setRemovingEntryId(null);
      setIsActionLoading(false);
    }
  };

  if (selectedDayDetails) {
    return (
      <>
        <DayDetailsScreen
          details={selectedDayDetails}
          onBack={onBackFromDayDetails}
          onRemoveEntry={(entryId) => void removeEntry(entryId)}
          removingEntryId={removingEntryId}
        />
        {isActionLoading ? <LoadingOverlay message="Updating tracker..." /> : null}
      </>
    );
  }

  if (isLoading && !overview) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-orange-50/50 via-white to-white px-4 py-6">
        <LoadingState />
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="mx-auto mt-10 w-full max-w-2xl px-4">
        <ErrorState
          message={errorMessage ?? "Failed to initialize tracker."}
          onRetry={() => void loadOverview(selectedMonth, selectedYear, anchorDate)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-orange-50/50 via-white to-white">
      <TrackerHeader profile={overview.profile} />

      <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 pb-24">
        {errorMessage ? (
          <ErrorState
            message={errorMessage}
            onRetry={() => void loadOverview(selectedMonth, selectedYear, anchorDate)}
          />
        ) : null}

        <ViewToggle value={view} onChange={setView} />

        {view === "daily" && (
          <>
            <StatsGrid
              goal={overview.daily.goal}
              consumed={overview.daily.consumed}
              totalDeficit={overview.daily.totalDeficit}
              isDeficitPositive={overview.daily.isDeficitPositive}
            />
            <ProgressCard
              title="Today's Progress"
              subtitle={
                overview.daily.goal <= 0
                  ? "Set your calorie goal to start tracking."
                  : overview.daily.remaining > 0
                  ? `${overview.daily.remaining} calories left for today`
                  : "Goal exceeded for today"
              }
              goal={overview.daily.goal}
              consumed={overview.daily.consumed}
              remaining={overview.daily.remaining}
              progressPercentage={overview.daily.progressPercentage}
            />
            <MealsListCard
              title="Today's Meals"
              entries={overview.daily.entries}
              onRemoveEntry={(entryId) => void removeEntry(entryId)}
              removingEntryId={removingEntryId}
            />
          </>
        )}

        {view === "weekly" && (
          <WeeklyView
            daysHit={overview.weekly.daysHit}
            weeklyData={overview.weekly.data}
            onDayClick={onSelectDay}
          />
        )}

        {view === "monthly" && (
          <MonthlyView
            selectedMonth={overview.monthly.month}
            selectedYear={overview.monthly.year}
            monthNames={MONTH_NAMES}
            monthlyData={overview.monthly.data}
            daysHit={overview.monthly.daysHit}
            canGoPrevMonth={overview.monthly.canGoPrevMonth}
            onPreviousMonth={onPreviousMonth}
            onNextMonth={onNextMonth}
            onDayClick={onSelectDay}
          />
        )}
      </main>

      {view === "daily" && (
        <>
          <button
            type="button"
            onClick={() => setShowAddFood(true)}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg transition-all hover:shadow-xl active:scale-95"
            aria-label="Open add food sheet"
          >
            <Plus className="h-6 w-6" />
          </button>
          <AddFoodSheet
            open={showAddFood}
            foodName={foodName}
            calories={calories}
            isSubmitting={isSubmittingEntry}
            errorMessage={sheetError}
            onClose={() => {
              setShowAddFood(false);
              setSheetError(null);
            }}
            onFoodNameChange={setFoodName}
            onCaloriesChange={setCalories}
            onSubmit={() => void submitEntry()}
          />
        </>
      )}

      {isActionLoading ? <LoadingOverlay message="Updating tracker..." /> : null}
    </div>
  );
}
