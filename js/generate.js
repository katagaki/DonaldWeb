function pick(a) {
  return a[Math.floor(Math.random() * a.length)];
}

function shuffle(a) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/* Score how well adding an item moves day totals toward targets.
   Lower score = better fit. Each nutrient is weighted by how important
   overshooting vs undershooting is (fat overshoot is penalized heavily).
   When fewer meals remain, overshoot penalties escalate sharply so the
   algorithm avoids blowing past daily limits on the last meal. */
function scoreItem(item, daySoFar, mealsLeft) {
  const t = targets;
  const after = {
    cal: daySoFar.cal + item.cal,
    p: daySoFar.p + item.p,
    f: daySoFar.f + item.f,
    c: daySoFar.c + item.c,
    fi: daySoFar.fi + item.fi,
  };
  /* Overshoot penalties escalate as fewer meals remain to compensate */
  const baseOverMul = mealsLeft <= 1 ? 4 : mealsLeft <= 2 ? 2 : 1;
  /* limitMode adjusts how aggressively overshoot is penalized:
     "under" = stay below limit (very harsh overshoot penalty)
     "close" = aim close to limit (default balanced behavior)
     "over"  = okay to exceed (relaxed overshoot, penalize undershoot more) */
  const modeMul = limitMode === "under" ? 3 : limitMode === "over" ? 0.3 : 1;
  const overMul = baseOverMul * modeMul;
  /* For "over" mode, reduce undershoot penalty; for "under" mode, increase it
     to encourage picking smaller items that stay well below */
  const underMul = limitMode === "under" ? 0.3 : limitMode === "over" ? 1.5 : 1;
  let score = 0;
  /* Calories: penalize proportional distance from target */
  const calDiff = after.cal - t.cal;
  if (calDiff > 0) score += (calDiff / t.cal) * 3 * overMul;
  else score += (Math.abs(calDiff) / t.cal) * 0.5 * underMul;
  /* Fat: heavily penalize exceeding target */
  const fDiff = after.f - t.f;
  if (fDiff > 0) score += (fDiff / t.f) * 8 * overMul;
  else score += (Math.abs(fDiff) / t.f) * 0.3 * underMul;
  /* Protein: reward getting closer, mild penalty for overshoot */
  const pDiff = after.p - t.p;
  if (pDiff > 0) score += (pDiff / t.p) * 1 * overMul;
  else score += (Math.abs(pDiff) / t.p) * 1.5 * underMul;
  /* Carbs: balanced penalty */
  const cDiff = after.c - t.c;
  if (cDiff > 0) score += (cDiff / t.c) * 2 * overMul;
  else score += (Math.abs(cDiff) / t.c) * 0.8 * underMul;
  /* Fiber: reward getting closer, low penalty for overshoot */
  const fiDiff = after.fi - t.fi;
  if (fiDiff > 0) score += (fiDiff / t.fi) * 0.3 * overMul;
  else score += (Math.abs(fiDiff) / t.fi) * 2 * underMul;
  return score;
}

/* Pick the best item from candidates, with some randomness to add variety.
   Selects from the top candidates weighted by rank.
   When already over a target, filters out items that would make it worse
   beyond a tolerance threshold (20% over the daily target). */
function pickBest(candidates, daySoFar, mealsLeft) {
  if (!candidates.length) return null;
  if (candidates.length === 1) return candidates[0];
  /* Filter out items that would push any nutrient too far over target */
  const t = targets;
  /* "under" = no overshoot allowed, "close" = 20% tolerance, "over" = 50% tolerance */
  const maxOver = limitMode === "under" ? 0 : limitMode === "over" ? 0.5 : 0.2;
  let pool = candidates;
  /* For "under" mode, always filter; for others, only filter on last meal */
  if (mealsLeft <= 1 || limitMode === "under") {
    const filtered = candidates.filter((item) => {
      const after = {
        cal: daySoFar.cal + item.cal,
        f: daySoFar.f + item.f,
        c: daySoFar.c + item.c,
      };
      return (
        after.cal <= t.cal * (1 + maxOver) &&
        after.f <= t.f * (1 + maxOver) &&
        after.c <= t.c * (1 + maxOver)
      );
    });
    if (filtered.length > 0) pool = filtered;
  }
  const scored = pool
    .map((item) => ({ item, score: scoreItem(item, daySoFar, mealsLeft) }))
    .sort((a, b) => a.score - b.score);
  /* Pick from top candidates with weighted probability (better = more likely) */
  const topN = Math.min(scored.length, Math.max(3, Math.ceil(scored.length * 0.3)));
  const top = scored.slice(0, topN);
  const maxS = top[top.length - 1].score;
  const minS = top[0].score;
  const range = maxS - minS || 1;
  const weights = top.map((s) => 1 + (maxS - s.score) / range);
  const totalW = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * totalW;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return top[i].item;
  }
  return top[0].item;
}

function addNutrients(totals, item) {
  return {
    cal: totals.cal + item.cal,
    p: totals.p + item.p,
    f: totals.f + item.f,
    c: totals.c + item.c,
    fi: totals.fi + item.fi,
  };
}

function generateWeek(macPct) {
  const plan = DAYS.map(() => MEALS.map(() => []));
  const macDays =
    macPct > 0
      ? shuffle([0, 1, 2, 3, 4, 5, 6]).slice(0, Math.max(1, Math.round((7 * macPct) / 100)))
      : [];
  for (let d = 0; d < 7; d++) {
    const used = new Set();
    let dayTotals = { cal: 0, p: 0, f: 0, c: 0, fi: 0 };
    const isMac = macDays.includes(d);
    /* Count active meals for budget estimation */
    const activeMeals = MKEYS.filter((k) => mealSize[k] !== "なし").length;
    for (let m = 0; m < 3; m++) {
      const slot = MKEYS[m];
      let items = [];
      const sz = mealSize[slot];
      if (sz === "なし") {
        plan[d][m] = [];
        continue;
      }
      const mealsLeft = MKEYS.slice(m).filter((k) => mealSize[k] !== "なし").length;
      if (isMac && m === 1) {
        /* McDonald's lunch: use scoring to pick the best-fitting burger + sides */
        const pool = DB.mcdonalds.items.filter(
          (i) => (i.meal === "any" || i.meal.includes("lunch")) && !used.has(i.id)
        );
        const burgers = pool.filter((i) => i.cat === "meal");
        const sides = pool.filter((i) => ["veggie", "dessert"].includes(i.cat));
        const burger = pickBest(burgers, dayTotals, mealsLeft);
        if (burger) {
          if (sz === "控えめ") {
            items = [burger];
          } else {
            let mealTotals = addNutrients(dayTotals, burger);
            const sidePool = sides.filter((i) => i.id !== burger.id);
            const side = pickBest(sidePool, mealTotals, mealsLeft);
            items = [burger, side].filter(Boolean);
            if (sz === "多め" && side) {
              mealTotals = addNutrients(mealTotals, side);
              const extra = sides.filter((i) => !items.some((x) => x && x.id === i.id));
              const ex = pickBest(extra, mealTotals, mealsLeft);
              if (ex) items.push(ex);
            }
          }
        }
      } else {
        const pool = allFlat.filter(
          (i) =>
            i.src !== "mcdonalds" && (i.meal === "any" || i.meal.includes(slot)) && !used.has(i.id)
        );
        if (slot === "breakfast") {
          const mains = pool.filter((i) => ["meal", "protein"].includes(i.cat));
          const sides = pool.filter((i) => ["carb", "veggie", "soup"].includes(i.cat));
          const main = pickBest(mains, dayTotals, mealsLeft);
          if (sz === "控えめ") {
            items = [main].filter(Boolean);
          } else {
            let mealTotals = main ? addNutrients(dayTotals, main) : dayTotals;
            const sidePool = sides.filter((i) => (main ? i.id !== main.id : true));
            const sd = pickBest(sidePool, mealTotals, mealsLeft);
            items = [main, sd].filter(Boolean);
            if (sz === "多め" && sd) {
              mealTotals = addNutrients(mealTotals, sd);
              const extra = sides.filter((i) => !items.some((x) => x && x.id === i.id));
              const ex = pickBest(extra, mealTotals, mealsLeft);
              if (ex) items.push(ex);
            }
          }
        } else {
          /* Lunch / Dinner */
          const mealPool = pool.filter((i) => i.cat === "meal");
          const main = pickBest(mealPool, dayTotals, mealsLeft);
          if (main) {
            if (sz === "控えめ") {
              items = [main];
            } else {
              let mealTotals = addNutrients(dayTotals, main);
              const extras = pool.filter(
                (i) => i.id !== main.id && ["veggie", "soup", "carb", "protein"].includes(i.cat)
              );
              const ex = pickBest(extras, mealTotals, mealsLeft);
              items = [main, ex].filter(Boolean);
              if (sz === "多め" && ex) {
                mealTotals = addNutrients(mealTotals, ex);
                const extra2 = extras.filter((i) => !items.some((x) => x && x.id === i.id));
                const ex2 = pickBest(extra2, mealTotals, mealsLeft);
                if (ex2) items.push(ex2);
              }
            }
          }
        }
      }
      items.forEach((i) => used.add(i.id));
      plan[d][m] = items.map((i) => ({
        id: i.id,
        name: i.name,
        cal: i.cal,
        p: i.p,
        f: i.f,
        c: i.c,
        fi: i.fi,
      }));
      dayTotals = items.reduce((t, i) => addNutrients(t, i), dayTotals);
    }
  }
  return plan;
}
