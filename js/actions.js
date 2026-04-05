window.setDay = function (i) {
  activeDay = i;
  render();
};

window.setView = function (v) {
  view = v;
  render();
};

window.rmItem = function (d, m, idx) {
  plan[d][m].splice(idx, 1);
  savePlan();
  render();
};

window.sortData = function (col) {
  if (dataSort.col === col) dataSort.asc = !dataSort.asc;
  else {
    dataSort.col = col;
    dataSort.asc = true;
  }
  render();
};

window.openGen = function () {
  let o = document.getElementById("genOverlay");
  if (!o) {
    o = document.createElement("div");
    o.id = "genOverlay";
    o.className = "overlay";
    document.body.appendChild(o);
  }
  o.className = "overlay open";
  const sizeOpts = ["なし", "控えめ", "普通", "多め"];
  const sizeLabels = { breakfast: "朝食", lunch: "昼食", dinner: "夕食" };
  let sizeHTML = `<div class="size-section"><div class="freq-label" style="margin-bottom:10px">食事量</div>`;
  MKEYS.forEach((k) => {
    sizeHTML += `<div class="size-row"><span class="size-meal-label">${sizeLabels[k]}</span><div class="size-btns">`;
    sizeOpts.forEach((opt) => {
      sizeHTML += `<button class="size-btn${mealSize[k] === opt ? " active" : ""}" onclick="setMealSize('${k}','${opt}')">${opt}</button>`;
    });
    sizeHTML += `</div></div>`;
  });
  sizeHTML += `</div>`;
  o.innerHTML = `<div class="overlay-bg" onclick="closeGen()"></div><div class="sheet"><div class="sheet-handle"></div><h3>自動プラン生成</h3><div class="freq-row"><span class="freq-label">マック頻度</span><span class="freq-val" id="freqVal">${macFreq === 0 ? "なし" : macFreq <= 15 ? "週1回" : macFreq <= 30 ? "週2回" : "週3回"}</span></div><input type="range" min="0" max="45" value="${macFreq}" oninput="macFreq=+this.value;document.getElementById('freqVal').textContent=macFreq===0?'なし':macFreq<=15?'週1回':macFreq<=30?'週2回':'週3回'"><div class="freq-hints"><span>なし</span><span>週3回</span></div>${sizeHTML}<div class="sheet-targets"><span>脂質 ${FAT_T}g</span><span>食物繊維 ${FIB_T}g</span><span>${CAL_T}kcal</span></div><div class="sheet-btns"><button class="btn-clear" onclick="plan=DAYS.map(()=>MEALS.map(()=>[]));savePlan();closeGen();render()">クリア</button><button class="btn-generate" onclick="plan=generateWeek(macFreq);savePlan();closeGen();render()">生成</button></div></div>`;
};

window.setMealSize = function (slot, size) {
  mealSize[slot] = size;
  openGen();
};

window.closeGen = function () {
  const o = document.getElementById("genOverlay");
  if (o) o.className = "overlay";
};

window.openPicker = function (d, m) {
  let o = document.getElementById("pickerOverlay");
  if (!o) {
    o = document.createElement("div");
    o.id = "pickerOverlay";
    o.className = "overlay";
    document.body.appendChild(o);
  }
  o.className = "overlay open";
  window._pickerD = d;
  window._pickerM = m;
  window._pickerFilter = "all";
  window._pickerQ = "";
  renderPicker();
};

window.closePicker = function () {
  const o = document.getElementById("pickerOverlay");
  if (o) o.className = "overlay";
};

window.addPickerItem = function (item) {
  plan[window._pickerD][window._pickerM].push(item);
  savePlan();
  closePicker();
  render();
};
