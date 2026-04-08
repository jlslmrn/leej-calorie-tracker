export type TrackerView = "daily" | "weekly" | "monthly";
export type SummaryView = "weekly" | "monthly";

export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  loggedAt: string;
}

export interface DayDetailData {
  date: string;
  dateLabel: string;
  goal: number;
  maintenanceCalories: number;
  consumed: number;
  remaining: number;
  totalDeficit: number;
  isDeficitPositive: boolean;
  progressPercentage: number;
  entries: FoodEntry[];
}

export interface WeeklyDayData {
  day: string;
  date: string;
  percentage: number;
  hit: boolean;
}

export interface MonthlyDayData {
  day: number;
  date: string;
  percentage: number;
  hit: boolean;
}

export interface TrackerProfile {
  name: string;
  email: string;
  bmi: number;
  heightCm: number;
  weightKg: number;
  bmiLabel: string;
  createdAt: string;
}

export interface TrackerOverviewResponse {
  profile: TrackerProfile;
  daily: DayDetailData;
  weekly: {
    daysHit: number;
    data: WeeklyDayData[];
  };
  monthly: {
    month: number;
    year: number;
    daysHit: number;
    data: MonthlyDayData[];
    minMonth: number;
    minYear: number;
    canGoPrevMonth: boolean;
  };
}

export interface TrackerDayResponse {
  day: DayDetailData;
}

export interface AddEntryResponse {
  day: DayDetailData;
}

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const getRingColorClass = (percentage: number) => {
  if (percentage <= 1) return "text-gray-400";
  if (percentage <= 100) return "text-green-500";
  return "text-orange-500";
};
