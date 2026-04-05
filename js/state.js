let plan = DAYS.map(() => MEALS.map(() => []));
let activeDay = 0;
let view = "plan";
let macFreq = 15;
let mealSize = { breakfast: "普通", lunch: "普通", dinner: "普通" };
let dataSort = { col: "name", asc: true };

function savePlan() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  } catch (e) {}
}

function loadPlan() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === 7) {
        plan = parsed;
        return;
      }
    }
  } catch (e) {}
}
