"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { Minus, Plus, Target, Flame, TrendingDown } from "lucide-react";

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  time: string;
}

interface DailyData {
  date: string;
  goal: number;
  consumed: number;
  entries: FoodEntry[];
}

export default function TrackerClient() {
  const [dailyGoal, setDailyGoal] = useState(2000);
  const [consumed, setConsumed] = useState(0);
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [tempGoal, setTempGoal] = useState("2000");

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const savedData = localStorage.getItem(`calorie-data-${today}`);

    if (savedData) {
      const data: DailyData = JSON.parse(savedData);
      setDailyGoal(data.goal);
      setConsumed(data.consumed);
      setEntries(data.entries);
      setTempGoal(String(data.goal));
    }
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const data: DailyData = {
      date: today,
      goal: dailyGoal,
      consumed,
      entries,
    };
    localStorage.setItem(`calorie-data-${today}`, JSON.stringify(data));
  }, [dailyGoal, consumed, entries]);

  const remaining = dailyGoal - consumed;
  const progressPercentage = dailyGoal > 0 ? (consumed / dailyGoal) * 100 : 0;

  const addFood = () => {
    if (!foodName.trim() || !calories || Number(calories) <= 0) return;

    const newEntry: FoodEntry = {
      id: Date.now().toString(),
      name: foodName.trim(),
      calories: Number(calories),
      time: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setEntries((prev) => [...prev, newEntry]);
    setConsumed((prev) => prev + Number(calories));
    setFoodName("");
    setCalories("");
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => {
      const entry = prev.find((item) => item.id === id);
      if (entry) {
        setConsumed((current) => current - entry.calories);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const updateGoal = () => {
    if (!tempGoal || Number(tempGoal) <= 0) return;
    setDailyGoal(Number(tempGoal));
    setShowGoalInput(false);
  };

  const handleKeyPress = (
    e: KeyboardEvent<HTMLInputElement>,
    action: () => void,
  ) => {
    if (e.key === "Enter") action();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 px-4 py-8">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <div className="space-y-2 py-2 text-center">
          <h1 className="text-3xl font-bold text-black">Calorie Tracker</h1>
          <p className="text-gray-500">Track your daily calorie deficit</p>
        </div>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <article className="space-y-2 rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <Target className="h-4 w-4" />
              <span className="text-sm">Daily Goal</span>
            </div>

            {showGoalInput ? (
              <div className="flex gap-2">
                <input
                  type="number"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e, updateGoal)}
                  className="h-9 w-full rounded-lg border px-3 text-black outline-none focus:ring-2 focus:ring-orange-200"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={updateGoal}
                  className="h-9 rounded-lg bg-black px-3 text-sm font-medium text-white hover:bg-black/90"
                >
                  Set
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowGoalInput(true)}
                className="text-2xl font-bold text-black transition-colors hover:text-orange-600"
              >
                {dailyGoal} cal
              </button>
            )}
          </article>

          <article className="space-y-2 rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <Flame className="h-4 w-4" />
              <span className="text-sm">Consumed</span>
            </div>
            <div className="text-2xl font-bold text-black">{consumed} cal</div>
          </article>

          <article className="space-y-2 rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm">Remaining</span>
            </div>
            <div
              className={`text-2xl font-bold ${
                remaining < 0 ? "text-red-600" : "text-black"
              }`}
            >
              {remaining} cal
            </div>
          </article>
        </section>

        <section className="space-y-2 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm">
            <span className="text-black">Daily Progress</span>
            <span className="font-medium text-black">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-orange-500 transition-all"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-black">Add Food</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="food-name" className="text-sm text-black">
                Food Name
              </label>
              <input
                id="food-name"
                placeholder="e.g., Chicken Salad"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                onKeyDown={(e) => handleKeyPress(e, addFood)}
                className="h-11 w-full rounded-xl border px-4 text-black outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="calories" className="text-sm text-black">
                Calories
              </label>
              <input
                id="calories"
                type="number"
                placeholder="e.g., 350"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                onKeyDown={(e) => handleKeyPress(e, addFood)}
                className="h-11 w-full rounded-xl border px-4 text-black outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>

            <button
              type="button"
              onClick={addFood}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-black font-semibold text-white hover:bg-black/90"
            >
              <Plus className="h-4 w-4" />
              Add Food
            </button>
          </div>
        </section>

        {entries.length > 0 && (
          <section className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="font-semibold text-black">Today&apos;s Meals</h2>
            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-xl border bg-white p-3"
                >
                  <div className="flex-1">
                    <div className="font-medium text-black">{entry.name}</div>
                    <div className="text-sm text-gray-500">{entry.time}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-black">
                      {entry.calories} cal
                    </span>
                    <button
                      type="button"
                      onClick={() => removeEntry(entry.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
