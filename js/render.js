function totals(d) {
  let cal = 0,
    p = 0,
    f = 0,
    c = 0,
    fi = 0;
  plan[d].forEach((m) =>
    m.forEach((i) => {
      cal += i.cal;
      p += i.p;
      f += i.f;
      c += i.c;
      fi += i.fi || 0;
    })
  );
  return { cal, p, f, c, fi };
}

function srcCol(id) {
  for (const [, s] of Object.entries(DB)) {
    if (s.items.some((i) => i.id === id)) return s.color;
  }
  return "#8e8e93";
}

function fatClass(f) {
  return f <= 10 ? "fat-low" : f <= 15 ? "fat-mid" : "fat-high";
}

function macroBarHTML(label, val, max, unit, color) {
  const pct = Math.min((val / max) * 100, 100),
    over = val > max;
  return `<div class="macro-row"><span>${label}</span><div class="macro-bar"><div class="macro-fill" style="width:${pct}%;background:${over ? "var(--red)" : color}"></div></div><span class="macro-val${over ? " over" : ""}">${val.toFixed(0)}/${max}${unit}</span></div>`;
}

function render() {
  const dt = totals(activeDay);
  let html = "";

  // === Desktop Toolbar ===
  html += `<div class="toolbar desktop-only">
    <div class="toolbar-spacer"></div>
    <button class="btn-gen" onclick="openGen()">自動生成...</button>
  </div>`;

  // === Desktop Sidebar ===
  html += `<div class="sidebar desktop-only">`;
  html += `<div class="sidebar-section"><div class="sidebar-label">表示</div>`;
  html += `<button class="sidebar-item${view === "plan" ? " active" : ""}" onclick="setView('plan')">
    <div class="sidebar-icon" style="background:var(--blue)">P</div>プラン</button>`;
  html += `<button class="sidebar-item${view === "data" ? " active" : ""}" onclick="setView('data')">
    <div class="sidebar-icon" style="background:var(--teal)">D</div>データ</button>`;
  html += `<button class="sidebar-item${view === "summary" ? " active" : ""}" onclick="setView('summary')">
    <div class="sidebar-icon" style="background:var(--orange)">S</div>サマリー</button>`;
  html += `</div>`;

  if (view === "plan") {
    html += `<div class="sidebar-section"><div class="sidebar-label">曜日</div>`;
    DAYS.forEach((d, i) => {
      const t = totals(i),
        a = activeDay === i,
        has = t.cal > 0,
        ok = t.f <= FAT_T;
      html += `<button class="sidebar-item${a ? " active" : ""}" onclick="setDay(${i})">
        <span style="width:20px;text-align:center;font-weight:600">${d}</span>${d}曜日
        ${has ? `<span class="sidebar-day-indicator" style="background:${ok ? "var(--green)" : "var(--red)"}"></span>` : ""}
      </button>`;
    });
    html += `</div>`;
  }
  html += `</div>`;

  // === Mobile Header ===
  html += `<div class="mobile-header mobile-only">
    <div></div>
    <button class="btn-gen-primary" onclick="openGen()">自動生成</button>
  </div>`;

  // === Main content ===
  html += `<div class="main" id="scroll">`;

  if (view === "plan") {
    html += renderPlanView(dt);
  }

  if (view === "data") {
    html += renderDataView();
  }

  if (view === "summary") {
    html += renderSummaryView();
  }

  html += `</div>`;

  // === Mobile bottom tab bar ===
  html += `<div class="mobile-tab-bar mobile-only">
    <button class="tab-btn${view === "plan" ? " active" : ""}" onclick="setView('plan')">プラン</button>
    <button class="tab-btn${view === "data" ? " active" : ""}" onclick="setView('data')">データ</button>
    <button class="tab-btn${view === "summary" ? " active" : ""}" onclick="setView('summary')">サマリー</button>
  </div>`;

  document.getElementById("app").innerHTML = html;
}

function renderPlanView(dt) {
  let html = "";

  // Mobile day tabs
  html += `<div class="mobile-day-tabs mobile-only">`;
  DAYS.forEach((d, i) => {
    const t = totals(i),
      a = activeDay === i,
      has = t.cal > 0,
      ok = t.f <= FAT_T;
    html += `<button class="day-tab${a ? " active" : ""}" onclick="setDay(${i})">${d}${has ? `<div class="day-dot" style="background:${ok ? "var(--green)" : "var(--red)"}"></div>` : ""}</button>`;
  });
  html += `</div>`;

  // Section title
  html += `<div class="section-title desktop-only">${DAYS[activeDay]}曜日</div>`;

  // Macro card
  html += `<div class="card macro-card"><div class="macro-label">栄養バランス</div>`;
  html += macroBarHTML("カロリー", dt.cal, CAL_T, "kcal", "var(--blue)");
  html += macroBarHTML("脂質", dt.f, FAT_T, "g", "var(--orange)");
  html += macroBarHTML("タンパク質", dt.p, PRO_T, "g", "var(--green)");
  html += macroBarHTML("食物繊維", dt.fi, FIB_T, "g", "var(--teal)");
  html += `</div>`;

  // Meal slots
  MEALS.forEach((meal, mi) => {
    html += `<div class="card meal-slot"><div class="meal-header"><span class="meal-title">${meal}</span><button class="btn-add" onclick="openPicker(${activeDay},${mi})">+ 追加</button></div>`;
    if (!plan[activeDay][mi].length)
      html += `<div class="meal-empty" onclick="openPicker(${activeDay},${mi})">クリックして追加</div>`;
    plan[activeDay][mi].forEach((item, idx) => {
      html += `<div class="meal-item"><div class="src-dot" style="background:${srcCol(item.id)}"></div><div class="item-info"><div class="item-name">${item.name}</div><div class="item-macros">${item.cal}kcal タンパク質${item.p}g 脂質${item.f}g 炭水化物${item.c}g 食物繊維${item.fi || 0}g</div></div><button class="btn-rm" onclick="rmItem(${activeDay},${mi},${idx})">&times;</button></div>`;
    });
    html += `</div>`;
  });

  return html;
}

function renderDataView() {
  let html = "";
  html += `<div class="section-title">データ <span style="font-size:13px;color:var(--text3);font-weight:400">${allFlat.length}件</span></div>`;
  const cols = [
    { k: "srcLabel", l: "ソース" },
    { k: "name", l: "名前" },
    { k: "cal", l: "カロリー" },
    { k: "p", l: "タンパク質" },
    { k: "f", l: "脂質" },
    { k: "c", l: "炭水化物" },
    { k: "fi", l: "食物繊維" },
    { k: "cat", l: "分類" },
  ];
  const sorted = [...allFlat].sort((a, b) => {
    const va = a[dataSort.col],
      vb = b[dataSort.col];
    const cmp = typeof va === "string" ? va.localeCompare(vb, "ja") : va - vb;
    return dataSort.asc ? cmp : -cmp;
  });
  html += `<div class="card data-table-wrap"><table class="data-table"><thead><tr>`;
  cols.forEach((c) => {
    const active = dataSort.col === c.k;
    const arrow = active ? (dataSort.asc ? " ↑" : " ↓") : "";
    html += `<th class="${active ? "th-active" : ""}" onclick="sortData('${c.k}')">${c.l}${arrow}</th>`;
  });
  html += `</tr></thead><tbody>`;
  sorted.forEach((item) => {
    html += `<tr><td><div class="src-dot" style="background:${item.srcColor};display:inline-block;vertical-align:middle;margin-right:6px"></div>${item.srcLabel}</td><td class="td-name">${item.name}</td><td>${item.cal}</td><td>${item.p}</td><td class="${fatClass(item.f)}">${item.f}</td><td>${item.c}</td><td>${item.fi}</td><td>${item.cat}</td></tr>`;
  });
  html += `</tbody></table></div>`;
  return html;
}

function renderSummaryView() {
  let html = "";
  html += `<div class="section-title">サマリー</div>`;
  let cal = 0,
    p = 0,
    f = 0,
    c = 0,
    fi = 0,
    n = 0;
  plan.forEach((_, i) => {
    const t = totals(i);
    if (t.cal > 0) {
      cal += t.cal;
      p += t.p;
      f += t.f;
      c += t.c;
      fi += t.fi;
      n++;
    }
  });
  n = n || 1;
  html += `<div class="card summary-card"><div class="macro-label">週間平均 (${n}日)</div>`;
  html += macroBarHTML("カロリー", cal / n, CAL_T, "kcal", "var(--blue)");
  html += macroBarHTML("脂質", f / n, FAT_T, "g", "var(--orange)");
  html += macroBarHTML("タンパク質", p / n, PRO_T, "g", "var(--green)");
  html += macroBarHTML("食物繊維", fi / n, FIB_T, "g", "var(--teal)");
  html += `</div>`;

  // Breakdown
  html += `<div class="macro-label" style="padding:0 2px;margin-bottom:8px">日別</div><div class="card breakdown-list">`;
  DAYS.forEach((d, i) => {
    const t = totals(i),
      pct = Math.min((t.f / FAT_T) * 100, 100),
      over = t.f > FAT_T;
    html += `<button class="breakdown-row" onclick="setDay(${i});setView('plan')"><span class="breakdown-day">${d}</span><div class="breakdown-bar"><div class="breakdown-fill" style="width:${pct}%;background:${over ? "var(--red)" : "var(--orange)"}"></div></div><span class="breakdown-val" style="color:${over ? "var(--red)" : "var(--text3)"}">${t.cal > 0 ? Math.round(t.cal) + "kcal 脂質" + t.f.toFixed(0) + "g" : "--"}</span></button>`;
  });
  html += `</div>`;

  // Sources
  html += `<div class="card summary-card" style="margin-top:12px"><div class="macro-label">ソース内訳</div>`;
  Object.entries(DB).forEach(([k, src]) => {
    let cnt = 0;
    plan.forEach((d) =>
      d.forEach((m) =>
        m.forEach((i) => {
          if (src.items.some((si) => si.id === i.id)) cnt++;
        })
      )
    );
    html += `<div class="source-row"><div class="src-dot" style="background:${src.color}"></div><span class="source-label">${src.label}</span><span class="source-count">${cnt}</span><span class="source-unit">品</span></div>`;
  });
  html += `</div>`;

  // Tips
  html += `<div class="tips-card"><div class="tips-title">TIPS</div><div class="tips-body">- noshは白身魚系が脂質6-9gで最優秀<br>- こんにゃく麺/ミネストローネで食物繊維UP<br>- セブンはもち麦おにぎり+ひじき煮が鉄板<br>- マックはハンバーガー単品(脂質9.4g)一択<br>- 脂質40g以下 / 食物繊維18g以上が目標</div></div>`;

  return html;
}

function renderPicker() {
  const o = document.getElementById("pickerOverlay");
  const slot = MKEYS[window._pickerM];
  const items = allFlat
    .filter((i) => window._pickerFilter === "all" || i.src === window._pickerFilter)
    .filter((i) => !window._pickerQ || i.name.toLowerCase().includes(window._pickerQ.toLowerCase()))
    .filter((i) => i.meal === "any" || i.meal.includes(slot))
    .sort((a, b) => a.f - b.f);
  const fBtns = [
    { k: "all", l: "すべて" },
    { k: "seveneleven", l: "セブン" },
    { k: "nosh", l: "nosh" },
    { k: "mcdonalds", l: "マック" },
  ];

  let h = `<div class="picker"><div class="picker-header"><div class="picker-top"><button class="btn-back" onclick="closePicker()">&larr; 戻る</button><input class="picker-search" type="text" placeholder="メニューを検索..." value="${window._pickerQ}" oninput="window._pickerQ=this.value;renderPicker()"></div><div class="picker-filters">`;
  fBtns.forEach((f) => {
    h += `<button class="filter-btn${window._pickerFilter === f.k ? " active" : ""}" onclick="window._pickerFilter='${f.k}';renderPicker()">${f.l}</button>`;
  });
  h += `</div></div><div class="picker-list"><div class="picker-count">脂質順 -- ${items.length}件</div><div class="picker-items">`;
  items.forEach((item) => {
    h += `<button class="picker-item" onclick='addPickerItem(${JSON.stringify({ id: item.id, name: item.name, cal: item.cal, p: item.p, f: item.f, c: item.c, fi: item.fi })})'><div class="src-dot" style="background:${item.srcColor}"></div><div class="item-info"><div class="pi-name">${item.name}</div><div class="pi-macros">${item.cal}kcal タンパク質${item.p}g 脂質${item.f}g 炭水化物${item.c}g 食物繊維${item.fi}g</div></div><div class="pi-fat ${fatClass(item.f)}">脂質${item.f}g</div></button>`;
  });
  h += `</div></div></div>`;
  o.innerHTML = h;
}
