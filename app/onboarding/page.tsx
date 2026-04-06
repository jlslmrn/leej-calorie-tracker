import { authOptions } from "@/auth";
import {
  Activity,
  Ruler,
  Scale,
  Target,
  TrendingDown,
  Shield,
} from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 via-white to-red-50">
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
            Tell us about yourself so we can build your calorie tracking setup.
          </p>
        </div>

        <div className="rounded-3xl border bg-white p-6 md:p-8 space-y-8 shadow-xl">
          <form className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <h2 className="text-xl font-semibold text-black">
                  Your Body Metrics
                </h2>
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
                    step="0.1"
                    placeholder="170"
                    className="w-full h-12 rounded-xl border bg-white px-4 text-lg text-black outline-none focus:ring-2 focus:ring-orange-200"
                  />

                  <p className="text-xs text-gray-500">
                    Enter your height in centimeters
                  </p>
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
                    step="0.1"
                    placeholder="70"
                    className="w-full h-12 rounded-xl border bg-white px-4 text-lg text-black outline-none focus:ring-2 focus:ring-orange-200"
                  />

                  <p className="text-xs text-gray-500">
                    Enter your weight in kilograms
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t" />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <h2 className="text-xl font-semibold text-black">
                  Your Goal Style
                </h2>
              </div>

              <p className="text-sm text-gray-500 ml-10">
                A simple preview of how your guided plan can look.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-4 p-5 rounded-xl border-2 border-orange-500 bg-orange-50 shadow-sm">
                  <div className="w-5 h-5 mt-1 rounded-full border-2 border-orange-600 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-600" />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Shield className="w-5 h-5 text-green-600" />
                      <div className="font-semibold text-lg text-black">
                        Sustainable Fat Loss
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                        Recommended
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed">
                      Balanced calorie tracking focused on consistency and
                      long-term progress.
                    </p>

                    <p className="text-xs text-gray-500">
                      Great for building habits, improving nutrition awareness,
                      and steadily working toward your target weight.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 rounded-xl border hover:border-orange-200 transition">
                  <div className="w-5 h-5 mt-1 rounded-full border-2 border-gray-300" />

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-orange-600" />
                      <div className="font-semibold text-lg text-black">
                        Goal-Focused Tracking
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed">
                      Set a target and monitor your meals, calories, and weight
                      trends with structure.
                    </p>

                    <p className="text-xs text-gray-500">
                      Ideal if you want a more focused and disciplined tracking
                      experience.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100">
              <div className="flex gap-3">
                <TrendingDown className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />

                <div className="space-y-1.5 text-sm">
                  <div className="font-semibold text-blue-900">
                    Why this matters
                  </div>
                  <p className="text-blue-700 leading-relaxed">
                    Your starting metrics help shape a more relevant calorie
                    tracking experience. Keeping things simple makes it easier
                    to stay consistent and see real progress over time.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="w-full h-14 rounded-xl bg-black text-white text-lg font-semibold hover:bg-black/90 active:bg-black/80 transition"
            >
              Continue
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
