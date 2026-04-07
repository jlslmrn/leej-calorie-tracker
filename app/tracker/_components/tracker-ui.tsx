"use client";

import {
  Activity,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Flame,
  Loader2,
  LogOut,
  Menu,
  Plus,
  Settings,
  Target,
  Trash2,
  TrendingDown,
  User,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { signOut } from "next-auth/react";
import type {
  DayDetailData,
  FoodEntry,
  MonthlyDayData,
  SummaryView,
  TrackerProfile,
  TrackerView,
  WeeklyDayData,
} from "./tracker-data";
import { getRingColorClass } from "./tracker-data";

const cardBase = "rounded-2xl border border-gray-200 bg-white p-4 shadow-sm";

interface TrackerHeaderProps {
  profile: TrackerProfile;
}

interface StatsGridProps {
  goal: number;
  consumed: number;
  remaining: number;
}

interface ProgressCardProps {
  title: string;
  subtitle: string;
  goal: number;
  consumed: number;
  remaining: number;
  progressPercentage: number;
}

interface MealsListCardProps {
  title: string;
  entries: FoodEntry[];
  onRemoveEntry?: (entryId: string) => void;
  removingEntryId?: string | null;
}

interface ViewToggleProps {
  value: TrackerView;
  onChange: (value: TrackerView) => void;
}

interface WeeklyViewProps {
  daysHit: number;
  weeklyData: WeeklyDayData[];
  onDayClick: (day: WeeklyDayData, source: SummaryView) => void;
}

interface MonthlyViewProps {
  selectedMonth: number;
  selectedYear: number;
  monthNames: string[];
  monthlyData: MonthlyDayData[];
  daysHit: number;
  canGoPrevMonth: boolean;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onDayClick: (day: MonthlyDayData, source: SummaryView) => void;
}

interface DayDetailsScreenProps {
  details: DayDetailData;
  onBack: () => void;
  onRemoveEntry?: (entryId: string) => void;
  removingEntryId?: string | null;
}

interface AddFoodSheetProps {
  open: boolean;
  foodName: string;
  calories: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onFoodNameChange: (value: string) => void;
  onCaloriesChange: (value: string) => void;
  onSubmit: () => void;
}

const CircularProgress = ({
  size,
  radius,
  strokeWidth,
  percentage,
}: {
  size: number;
  radius: number;
  strokeWidth: number;
  percentage: number;
}) => {
  const normalizedPercentage = Math.min(Math.max(percentage, 0), 100);
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - normalizedPercentage / 100);

  return (
    <svg className="-rotate-90" style={{ width: size, height: size }} aria-hidden>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        className="text-gray-200"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        className={getRingColorClass(percentage)}
        strokeLinecap="round"
      />
    </svg>
  );
};

export function TrackerHeader({ profile }: TrackerHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const handleLogout = async () => {
    setIsMenuOpen(false);
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/85 backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-4">
        <div>
          <h1 className="text-2xl font-bold text-black">Calorie Tracker</h1>
          <p className="text-sm text-gray-500">Track your daily deficit</p>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen((current) => !current)}
            className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg hover:bg-gray-100"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {isMenuOpen ? (
            <>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 z-30 cursor-default"
                aria-label="Close menu"
              />

              <div className="absolute right-0 z-40 mt-2 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
                <p className="mb-1 text-sm font-medium">{profile.name}</p>
                <p className="mb-3 text-xs text-gray-500">{profile.email}</p>

                <div className="mb-3 space-y-1 rounded-lg bg-gradient-to-br from-orange-50 to-red-50 p-3">
                  <div className="mb-2 flex items-center gap-2 text-gray-500">
                    <Activity className="h-4 w-4" />
                    <span className="text-xs font-medium">Body Mass Index</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">{profile.bmi}</div>
                  <div className="text-xs text-gray-500">
                    {profile.heightCm} cm | {profile.weightKg} kg
                  </div>
                  <div className="text-xs font-medium text-green-600">{profile.bmiLabel}</div>
                </div>

                <div className="space-y-1 border-t border-gray-200 pt-2">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-gray-100"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-gray-100"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function StatCard({
  icon,
  label,
  value,
  valueClassName,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  valueClassName?: string;
}) {
  return (
    <article className={`${cardBase} space-y-1`}>
      <div className="flex items-center gap-1.5 text-gray-500">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className={`text-xl font-bold ${valueClassName ?? ""}`}>{value}</div>
      <div className="text-xs text-gray-500">cal</div>
    </article>
  );
}

export function StatsGrid({ goal, consumed, remaining }: StatsGridProps) {
  return (
    <section className="grid grid-cols-3 gap-3">
      <StatCard icon={<Target className="h-3.5 w-3.5" />} label="Goal" value={goal} />
      <StatCard
        icon={<Flame className="h-3.5 w-3.5" />}
        label="Eaten"
        value={consumed}
      />
      <StatCard
        icon={<TrendingDown className="h-3.5 w-3.5" />}
        label="Left"
        value={remaining}
        valueClassName={remaining < 0 ? "text-orange-500" : "text-green-600"}
      />
    </section>
  );
}

export function ProgressCard({
  title,
  subtitle,
  goal,
  consumed,
  remaining,
  progressPercentage,
}: ProgressCardProps) {
  return (
    <section className="rounded-2xl border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-red-50 p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-black">{title}</h3>
          <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className="text-2xl font-bold text-orange-600">
          {Math.round(progressPercentage)}%
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="h-3 w-full overflow-hidden rounded-full bg-orange-100">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all"
            style={{ width: `${Math.min(Math.max(progressPercentage, 0), 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>0 cal</span>
          <span>{goal} cal</span>
        </div>
      </div>

      <div className="mt-4 flex justify-around border-t border-orange-200 pt-3">
        <div className="text-center">
          <p className="text-xl font-bold text-orange-600">{consumed}</p>
          <p className="text-xs text-gray-500">Consumed</p>
        </div>
        <div className="w-px bg-orange-200" />
        <div className="text-center">
          <p className="text-xl font-bold text-green-600">{Math.max(remaining, 0)}</p>
          <p className="text-xs text-gray-500">Remaining</p>
        </div>
      </div>
    </section>
  );
}

export function MealsListCard({
  title,
  entries,
  onRemoveEntry,
  removingEntryId,
}: MealsListCardProps) {
  return (
    <section className={`${cardBase} space-y-4 p-5`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-black">{title}</h3>
        <span className="text-sm text-gray-500">{entries.length} items</span>
      </div>

      <div className="h-[400px] space-y-2 overflow-y-auto pr-2">
        {entries.length === 0 ? (
          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
            No meals logged yet.
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-black">{entry.name}</div>
                <div className="text-xs text-gray-500">{entry.time}</div>
              </div>
              <div className="ml-3 flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-bold text-black">{entry.calories}</div>
                  <div className="text-xs text-gray-500">cal</div>
                </div>
                {onRemoveEntry ? (
                  <button
                    type="button"
                    onClick={() => onRemoveEntry(entry.id)}
                    disabled={removingEntryId === entry.id}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`Remove ${entry.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="flex justify-center">
      <div className="grid w-full max-w-md grid-cols-3 rounded-xl bg-white p-1 shadow-sm ring-1 ring-gray-200">
        {(["daily", "weekly", "monthly"] as const).map((tab) => {
          const active = value === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onChange(tab)}
              className={`h-10 rounded-lg text-sm font-medium capitalize transition ${
                active
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-gray-600 hover:bg-orange-50"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function WeeklyView({ daysHit, weeklyData, onDayClick }: WeeklyViewProps) {
  return (
    <>
      <section className={`${cardBase} space-y-4 p-6`}>
        <div className="space-y-2 text-center">
          <h3 className="text-2xl font-bold text-black">This Week</h3>
          <p className="text-sm text-gray-500">
            You hit your goal{" "}
            <span className="font-semibold text-green-600">{daysHit} out of 7 days</span>
          </p>
        </div>

        <div className="grid grid-cols-7 gap-2 py-4">
          {weeklyData.map((day) => (
            <button
              key={day.date}
              type="button"
              onClick={() => onDayClick(day, "weekly")}
              className="flex flex-col items-center gap-2 transition hover:opacity-80 active:scale-95"
            >
              <span className="text-xs font-medium text-gray-500">{day.day}</span>
              <div className="relative h-12 w-12">
                <CircularProgress
                  size={48}
                  radius={20}
                  strokeWidth={4}
                  percentage={day.percentage}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-bold">{Math.round(day.percentage)}%</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className={`${cardBase} space-y-3 p-5`}>
        <h3 className="font-semibold text-black">Weekly Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Success Rate</span>
            <span className="font-semibold text-black">
              {Math.round((daysHit / 7) * 100)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Days on Track</span>
            <span className="font-semibold text-black">{daysHit} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Avg Daily Intake</span>
            <span className="font-semibold text-black">
              {Math.round(
                weeklyData.reduce((sum, day) => sum + day.percentage, 0) /
                  Math.max(weeklyData.length, 1),
              )}
              %
            </span>
          </div>
        </div>
      </section>
    </>
  );
}

export function MonthlyView({
  selectedMonth,
  selectedYear,
  monthNames,
  monthlyData,
  daysHit,
  canGoPrevMonth,
  onPreviousMonth,
  onNextMonth,
  onDayClick,
}: MonthlyViewProps) {
  return (
    <>
      <section className={`${cardBase} p-4`}>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onPreviousMonth}
            disabled={!canGoPrevMonth}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h3 className="text-lg font-semibold text-black">
            {monthNames[selectedMonth]} {selectedYear}
          </h3>
          <button
            type="button"
            onClick={onNextMonth}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-100"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      <section className={`${cardBase} space-y-4 p-6`}>
        <div className="text-center">
          <p className="text-sm text-gray-500">
            You hit your goal{" "}
            <span className="font-semibold text-green-600">
              {daysHit} out of {monthlyData.length} days
            </span>
          </p>
        </div>

        <div className="grid grid-cols-7 gap-2 py-3">
          {monthlyData.map((day) => (
            <button
              key={day.date}
              type="button"
              onClick={() => onDayClick(day, "monthly")}
              className="flex flex-col items-center gap-1 transition hover:opacity-80 active:scale-95"
            >
              <span className="text-[10px] text-gray-500">{day.day}</span>
              <div className="relative h-10 w-10">
                <CircularProgress
                  size={40}
                  radius={16}
                  strokeWidth={3}
                  percentage={day.percentage}
                />
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className={`${cardBase} space-y-3 p-5`}>
        <h3 className="font-semibold text-black">Monthly Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Success Rate</span>
            <span className="font-semibold text-black">
              {Math.round((daysHit / Math.max(monthlyData.length, 1)) * 100)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Days on Track</span>
            <span className="font-semibold text-black">{daysHit} days</span>
          </div>
        </div>
      </section>
    </>
  );
}

export function DayDetailsScreen({
  details,
  onBack,
  onRemoveEntry,
  removingEntryId,
}: DayDetailsScreenProps) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-orange-50/50 via-white to-white">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/85 backdrop-blur-lg">
        <div className="mx-auto w-full max-w-2xl px-4 py-4">
          <button
            type="button"
            onClick={onBack}
            className="mb-2 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-xl font-bold text-black">{details.dateLabel}</h1>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6">
        <StatsGrid
          goal={details.goal}
          consumed={details.consumed}
          remaining={details.remaining}
        />
        <ProgressCard
          title="Daily Progress"
          subtitle={
            details.remaining > 0
              ? `${details.remaining} calories left`
              : "Goal exceeded!"
          }
          goal={details.goal}
          consumed={details.consumed}
          remaining={details.remaining}
          progressPercentage={details.progressPercentage}
        />
        <MealsListCard
          title="Meals"
          entries={details.entries}
          onRemoveEntry={onRemoveEntry}
          removingEntryId={removingEntryId}
        />
      </div>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-gray-500">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      Loading tracker...
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <p className="font-medium">Could not load tracker data.</p>
      <p className="mt-1">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded-md bg-red-600 px-3 py-1.5 text-white hover:bg-red-700"
      >
        Retry
      </button>
    </div>
  );
}

export function AddFoodSheet({
  open,
  foodName,
  calories,
  isSubmitting,
  errorMessage,
  onClose,
  onFoodNameChange,
  onCaloriesChange,
  onSubmit,
}: AddFoodSheetProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border border-gray-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto w-full max-w-2xl space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-black">Add Food</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-black" htmlFor="food-name">
                Food Name
              </label>
              <input
                id="food-name"
                type="text"
                value={foodName}
                onChange={(event) => onFoodNameChange(event.target.value)}
                placeholder="e.g., Chicken Salad"
                className="h-12 w-full rounded-lg border border-gray-200 px-4 text-black outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-black" htmlFor="food-calories">
                Calories
              </label>
              <input
                id="food-calories"
                type="number"
                min={2}
                step={1}
                value={calories}
                onChange={(event) => onCaloriesChange(event.target.value)}
                placeholder="e.g., 350"
                className="h-12 w-full rounded-lg border border-gray-200 px-4 text-black outline-none focus:ring-2 focus:ring-orange-300"
              />
              <p className="text-xs text-gray-500">Calories must be greater than 1.</p>
            </div>

            {errorMessage ? (
              <p className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-base font-semibold text-white hover:from-orange-600 hover:to-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Add Food
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
