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

function generateWeek(macPct) {
  const plan = DAYS.map(() => MEALS.map(() => []));
  const macDays =
    macPct > 0
      ? shuffle([0, 1, 2, 3, 4, 5, 6]).slice(0, Math.max(1, Math.round((7 * macPct) / 100)))
      : [];
  for (let d = 0; d < 7; d++) {
    const used = new Set();
    let dayFat = 0;
    const isMac = macDays.includes(d);
    for (let m = 0; m < 3; m++) {
      const slot = MKEYS[m],
        fatLeft = targets.f - dayFat;
      let items = [];
      const sz = mealSize[slot];
      if (sz === "なし") {
        plan[d][m] = [];
        continue;
      }
      if (isMac && m === 1) {
        const pool = DB.mcdonalds.items.filter(
          (i) => (i.meal === "any" || i.meal.includes("lunch")) && i.f <= 15
        );
        const b = pool.filter((i) => i.cat === "meal"),
          s = pool.filter((i) => ["veggie", "dessert"].includes(i.cat));
        const burger = b.length ? pick(b) : null;
        if (sz === "控えめ") {
          items = [burger].filter(Boolean);
        } else {
          const side = s.length
            ? pick(s.filter((i) => (burger ? i.id !== burger.id : true)))
            : null;
          items = [burger, side].filter(Boolean);
          if (sz === "多め") {
            const extra = s.filter((i) => !items.some((x) => x && x.id === i.id));
            if (extra.length) items.push(pick(extra));
          }
        }
      } else {
        const pool = allFlat.filter(
          (i) =>
            i.src !== "mcdonalds" && (i.meal === "any" || i.meal.includes(slot)) && !used.has(i.id)
        );
        if (slot === "breakfast") {
          const mains = pool.filter((i) => ["meal", "protein"].includes(i.cat) && i.f <= 12);
          const sides = pool.filter((i) => ["carb", "veggie", "soup"].includes(i.cat) && i.f <= 5);
          const main = mains.length ? pick(mains) : null;
          if (sz === "控えめ") {
            items = [main].filter(Boolean);
          } else {
            const sd = sides.length
              ? pick(sides.filter((i) => (main ? i.id !== main.id : true)))
              : null;
            items = [main, sd].filter(Boolean);
            if (sz === "多め") {
              const extra = sides.filter((i) => !items.some((x) => x && x.id === i.id));
              if (extra.length) items.push(pick(extra));
            }
          }
        } else {
          const fMax = fatLeft > 25 ? 18 : 12;
          const mp = pool.filter((i) => i.cat === "meal" && i.f <= fMax);
          const main = mp.length
            ? pick(mp)
            : pool.filter((i) => i.cat === "meal").length
              ? pick(pool.filter((i) => i.cat === "meal"))
              : null;
          if (main) {
            if (sz === "控えめ") {
              items = [main];
            } else {
              const rf = fatLeft - main.f;
              const extras = pool.filter(
                (i) =>
                  i.id !== main.id &&
                  ["veggie", "soup", "carb", "protein"].includes(i.cat) &&
                  i.f <= Math.min(rf * 0.4, 5)
              );
              const hiF = extras.filter((i) => i.fi >= 2);
              const ex = hiF.length ? pick(hiF) : extras.length ? pick(extras) : null;
              items = [main, ex].filter(Boolean);
              if (sz === "多め") {
                const extra2 = extras.filter((i) => !items.some((x) => x && x.id === i.id));
                if (extra2.length) items.push(pick(extra2));
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
      dayFat += items.reduce((s, i) => s + i.f, 0);
    }
  }
  return plan;
}
