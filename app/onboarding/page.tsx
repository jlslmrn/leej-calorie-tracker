import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserOnboardingStatus } from "@/lib/onboarding-status";
import { ActivityLevel, GoalType, PlanApproach, Sex } from "@prisma/client";
import {
  Activity,
  Heart,
  Ruler,
  Scale,
  Shield,
  TrendingDown,
  UserRound,
  Zap,
} from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

const ACTIVITY_LEVELS = [
  {
    value: ActivityLevel.SEDENTARY,
    label: "Sedentary",
    description: "Little to no exercise, mostly sitting.",
  },
  {
    value: ActivityLevel.LIGHT,
    label: "Lightly Active",
    description: "Light exercise 1-3 days per week.",
  },
  {
    value: ActivityLevel.MODERATE,
    label: "Moderately Active",
    description: "Moderate exercise 3-5 days per week.",
  },
  {
    value: ActivityLevel.ACTIVE,
    label: "Active",
    description: "Hard exercise 6-7 days per week.",
  },
  {
    value: ActivityLevel.VERY_ACTIVE,
    label: "Very Active",
    description: "Intense training or physically demanding lifestyle.",
  },
] as const;

const APPROACH_OPTIONS = [
  {
    value: PlanApproach.STEADY,
    title: "Steady & Safe",
    icon: Shield,
    iconClass: "text-green-600",
    chipText: "Recommended",
    chipClass: "bg-green-100 text-green-700",
    summary: "~300 calorie deficit • Lose 0.5-0.7 lbs per week",
    details:
      "Perfect for sustainable, long-term success with minimal lifestyle disruption.",
  },
  {
    value: PlanApproach.MODERATE,
    title: "Moderate",
    icon: Heart,
    iconClass: "text-blue-600",
    chipText: "",
    chipClass: "",
    summary: "~500 calorie deficit • Lose 1 lb per week",
    details:
      "A balanced approach that delivers steady results without being too restrictive.",
  },
  {
    value: PlanApproach.AGGRESSIVE,
    title: "Aggressive",
    icon: Zap,
    iconClass: "text-orange-600",
    chipText: "Advanced",
    chipClass: "bg-orange-100 text-orange-700",
    summary: "~750 calorie deficit • Lose 1.5 lbs per week",
    details: "Faster results but requires strong commitment and discipline.",
  },
] as const;

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  [ActivityLevel.SEDENTARY]: 1.2,
  [ActivityLevel.LIGHT]: 1.375,
  [ActivityLevel.MODERATE]: 1.55,
  [ActivityLevel.ACTIVE]: 1.725,
  [ActivityLevel.VERY_ACTIVE]: 1.9,
};

const APPROACH_DEFICIT: Record<PlanApproach, number> = {
  [PlanApproach.STEADY]: 300,
  [PlanApproach.MODERATE]: 500,
  [PlanApproach.AGGRESSIVE]: 750,
};

const MIN_CALORIES: Record<Sex, number> = {
  [Sex.MALE]: 1500,
  [Sex.FEMALE]: 1200,
};

const toTwoDecimals = (value: number) => Math.round(value * 100) / 100;

const toDateOfBirthFromAge = (age: number) => {
  const today = new Date();
  return new Date(
    Date.UTC(
      today.getUTCFullYear() - age,
      today.getUTCMonth(),
      today.getUTCDate(),
    ),
  );
};

const calculateBmi = (weightKg: number, heightCm: number) => {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
};

const calculateBmr = (sex: Sex, age: number, weightKg: number, heightCm: number) => {
  const common = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === Sex.MALE ? common + 5 : common - 161;
};

const calculateTdee = (bmr: number, activityLevel: ActivityLevel) =>
  bmr * ACTIVITY_MULTIPLIER[activityLevel];

const calculateDailyGoal = (sex: Sex, tdee: number, approach: PlanApproach) => {
  const deficit = APPROACH_DEFICIT[approach];
  return Math.max(MIN_CALORIES[sex], Math.round(tdee - deficit));
};

async function completeOnboarding(formData: FormData) {
  "use server";

  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    redirect("/login");
  }

  const height = Number(formData.get("height"));
  const weight = Number(formData.get("weight"));
  const age = Number(formData.get("age"));
  const sexRaw = formData.get("sex");
  const activityRaw = formData.get("activityLevel");
  const approachRaw = formData.get("approach");

  const isSexValid = sexRaw === Sex.MALE || sexRaw === Sex.FEMALE;
  const isActivityValid = ACTIVITY_LEVELS.some(
    (level) => level.value === activityRaw,
  );
  const isApproachValid = APPROACH_OPTIONS.some(
    (option) => option.value === approachRaw,
  );

  if (!Number.isFinite(height) || height <= 1) redirect("/onboarding");
  if (!Number.isFinite(weight) || weight <= 1) redirect("/onboarding");
  if (!Number.isFinite(age) || age <= 1) redirect("/onboarding");
  if (!isSexValid || !isActivityValid || !isApproachValid) redirect("/onboarding");

  const sex = sexRaw as Sex;
  const activityLevel = activityRaw as ActivityLevel;
  const approach = approachRaw as PlanApproach;

  const bmi = toTwoDecimals(calculateBmi(weight, height));
  const bmr = toTwoDecimals(calculateBmr(sex, age, weight, height));
  const tdee = toTwoDecimals(calculateTdee(bmr, activityLevel));
  const dailyGoal = calculateDailyGoal(sex, tdee, approach);
  const dateOfBirth = toDateOfBirthFromAge(Math.floor(age));
  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { email },
      data: {
        isOnboarded: true,
        onboardedAt: new Date(),
        profile: {
          upsert: {
            create: {
              displayName: session.user?.name ?? null,
              sex,
              dateOfBirth,
              heightCm: toTwoDecimals(height),
              currentWeightKg: toTwoDecimals(weight),
              activityLevel,
              goalType: GoalType.LOSE,
              approach,
              estimatedBmr: bmr,
              estimatedTdee: tdee,
              dailyCalorieGoal: dailyGoal,
              bmi,
            },
            update: {
              sex,
              dateOfBirth,
              heightCm: toTwoDecimals(height),
              currentWeightKg: toTwoDecimals(weight),
              activityLevel,
              goalType: GoalType.LOSE,
              approach,
              estimatedBmr: bmr,
              estimatedTdee: tdee,
              dailyCalorieGoal: dailyGoal,
              bmi,
            },
          },
        },
      },
      select: { id: true },
    });

    await tx.dailyLog.upsert({
      where: { userId_date: { userId: user.id, date: today } },
      create: {
        userId: user.id,
        date: today,
        calorieGoal: dailyGoal,
        maintenanceCalories: Math.round(tdee),
        caloriesConsumed: 0,
        remainingCalories: dailyGoal,
        progressPercent: 0,
        goalHit: false,
      },
      update: {
        calorieGoal: dailyGoal,
        maintenanceCalories: Math.round(tdee),
        remainingCalories: dailyGoal,
        progressPercent: 0,
      },
    });
  });

  redirect("/tracker");
}

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  const isOnboarded = await getUserOnboardingStatus(session.user.email);
  if (isOnboarded) {
    redirect("/tracker");
  }

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 via-white to-red-50">
      <div className="w-full max-w-3xl space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
              <Activity className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-black">
            Let&apos;s Personalize Your Journey
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Tell us about yourself so we can calculate the perfect calorie goals
            for your success.
          </p>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8 space-y-8 shadow-xl">
          <form className="space-y-8" action={completeOnboarding}>
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <h2 className="text-xl font-semibold text-black">Your Body Metrics</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label
                    htmlFor="height"
                    className="flex items-center gap-2 text-base font-medium text-black"
                  >
                    <Ruler className="w-4 h-4 text-orange-600" />
                    Height (cm)
                  </label>
                  <input
                    id="height"
                    name="height"
                    type="number"
                    min="1.1"
                    step="0.1"
                    placeholder="170"
                    required
                    className="w-full h-12 rounded-xl border border-gray-200 bg-white px-4 text-lg text-black outline-none focus:ring-2 focus:ring-orange-200"
                  />
                  <p className="text-xs text-gray-500">Enter your height in centimeters</p>
                </div>

                <div className="space-y-3">
                  <label
                    htmlFor="weight"
                    className="flex items-center gap-2 text-base font-medium text-black"
                  >
                    <Scale className="w-4 h-4 text-orange-600" />
                    Weight (kg)
                  </label>
                  <input
                    id="weight"
                    name="weight"
                    type="number"
                    min="1.1"
                    step="0.1"
                    placeholder="70"
                    required
                    className="w-full h-12 rounded-xl border border-gray-200 bg-white px-4 text-lg text-black outline-none focus:ring-2 focus:ring-orange-200"
                  />
                  <p className="text-xs text-gray-500">Enter your weight in kilograms</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label
                    htmlFor="age"
                    className="flex items-center gap-2 text-base font-medium text-black"
                  >
                    <UserRound className="w-4 h-4 text-orange-600" />
                    Age
                  </label>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    min="2"
                    step="1"
                    placeholder="28"
                    required
                    className="w-full h-12 rounded-xl border border-gray-200 bg-white px-4 text-lg text-black outline-none focus:ring-2 focus:ring-orange-200"
                  />
                  <p className="text-xs text-gray-500">Used to estimate your metabolism</p>
                </div>

                <div className="space-y-3">
                  <span className="flex items-center gap-2 text-base font-medium text-black">
                    <UserRound className="w-4 h-4 text-orange-600" />
                    Sex
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block cursor-pointer">
                      <input
                        type="radio"
                        name="sex"
                        value={Sex.MALE}
                        required
                        defaultChecked
                        className="peer sr-only"
                      />
                      <div className="flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 p-4 transition hover:border-orange-300 peer-checked:border-orange-500 peer-checked:bg-orange-50">
                        <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex items-center justify-center peer-checked:border-orange-600">
                          <div className="h-2 w-2 rounded-full bg-orange-600 opacity-0 peer-checked:opacity-100" />
                        </div>
                        <span className="text-sm font-medium text-black">Male</span>
                      </div>
                    </label>
                    <label className="block cursor-pointer">
                      <input
                        type="radio"
                        name="sex"
                        value={Sex.FEMALE}
                        required
                        className="peer sr-only"
                      />
                      <div className="flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 p-4 transition hover:border-orange-300 peer-checked:border-orange-500 peer-checked:bg-orange-50">
                        <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex items-center justify-center peer-checked:border-orange-600">
                          <div className="h-2 w-2 rounded-full bg-orange-600 opacity-0 peer-checked:opacity-100" />
                        </div>
                        <span className="text-sm font-medium text-black">Female</span>
                      </div>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    Needed for BMR formula calibration
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <span className="flex items-center gap-2 text-base font-medium text-black">
                  <Activity className="w-4 h-4 text-orange-600" />
                  Activity Level
                </span>
                <p className="text-xs text-gray-500">
                  This helps us calculate your Total Daily Energy Expenditure
                  (TDEE).
                </p>
                <div className="space-y-3">
                  {ACTIVITY_LEVELS.map((level) => (
                    <label key={level.value} className="block cursor-pointer">
                      <input
                        type="radio"
                        name="activityLevel"
                        value={level.value}
                        required
                        defaultChecked={level.value === ActivityLevel.MODERATE}
                        className="peer sr-only"
                      />
                      <div className="flex items-start gap-3 rounded-xl border-2 border-gray-200 p-4 transition hover:border-orange-300 peer-checked:border-orange-500 peer-checked:bg-orange-50">
                        <div className="mt-0.5 h-4 w-4 rounded-full border-2 border-gray-300 flex items-center justify-center peer-checked:border-orange-600 shrink-0">
                          <div className="h-2 w-2 rounded-full bg-orange-600 opacity-0 peer-checked:opacity-100" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-base text-black mb-1">
                            {level.label}
                          </div>
                          <p className="text-sm text-gray-600">
                            {level.description}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </section>

            <div className="border-t border-gray-200" />

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <h2 className="text-xl font-semibold text-black">Choose Your Approach</h2>
              </div>
              <p className="text-sm text-gray-500 ml-10">
                Select the pace that fits your lifestyle and goals.
              </p>

              <div className="space-y-3">
                {APPROACH_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <label key={option.value} className="block cursor-pointer">
                      <input
                        type="radio"
                        name="approach"
                        value={option.value}
                        required
                        defaultChecked={option.value === PlanApproach.STEADY}
                        className="peer sr-only"
                      />

                      <div
                        className="flex items-start gap-4 rounded-xl border-2 border-gray-200 p-5 transition hover:border-orange-300 peer-checked:border-orange-500 peer-checked:bg-orange-50"
                      >
                        <div className="mt-1 h-5 w-5 rounded-full border-2 border-gray-300 peer-checked:border-orange-600 flex items-center justify-center">
                          <div className="h-2.5 w-2.5 rounded-full bg-orange-600 opacity-0 peer-checked:opacity-100" />
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Icon className={`w-5 h-5 ${option.iconClass}`} />
                            <div className="font-semibold text-lg text-black">
                              {option.title}
                            </div>
                            {option.chipText ? (
                              <span
                                className={`text-xs px-2.5 py-1 rounded-full font-medium ${option.chipClass}`}
                              >
                                {option.chipText}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {option.summary}
                          </p>
                          <p className="text-xs text-gray-500">{option.details}</p>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>

            <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100">
              <div className="flex gap-3">
                <TrendingDown className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1.5 text-sm">
                  <div className="font-semibold text-blue-900">Why this matters</div>
                  <p className="text-blue-700 leading-relaxed">
                    We calculate your calorie target from BMI, age, sex, and
                    activity level. A gradual and sustainable approach leads to
                    better long-term outcomes.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-14 rounded-xl bg-black text-white text-lg font-semibold hover:bg-black/90 active:bg-black/80 transition"
            >
              Create My Custom Plan
            </button>
          </form>
        </div>

        <p className="text-xs text-center text-gray-500">
          Your information stays private and is only used to personalize your
          experience.
        </p>
      </div>
    </div>
  );
}
