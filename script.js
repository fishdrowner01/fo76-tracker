// FO76 Tracker v1.9.4
(function() {
  const storeKey = "fo76-tracker-v1.9.4";
  const el = (sel) => document.querySelector(sel);
  const els = (sel) => Array.from(document.querySelectorAll(sel));

  const defaultData = {
    version: "1.9.4",
    gold: { dailyDone: false, smileyWeeklyDone: false },
    dailies: ["Complete Daily Ops", "Vendor caps run"],
    weeklies: ["Score challenge check", "Events / Public Teams"],
    settings: {
      dailyHour: 9,       // local hour
      weeklyDay: 2,       // default Tue (common weekly refresh day for many games; user-configurable)
      weeklyHour: 9       // local hour
    },
    lastDailyReset: null,
    lastWeeklyReset: null
  };

  let data = load();

  // ----- Persistence -----
  function load() {
    try {
      const raw = localStorage.getItem(storeKey);
      if (!raw) return structuredClone(defaultData);
      const parsed = JSON.parse(raw);
      // migrate any missing fields
      return Object.assign(structuredClone(defaultData), parsed);
    } catch {
      return structuredClone(defaultData);
    }
  }
  function save() {
    localStorage.setItem(storeKey, JSON.stringify(data));
  }

  // ----- UI Helpers -----
  function renderChecks() {
    el("#goldDailyDone").checked = !!data.gold.dailyDone;
    el("#smileyWeeklyDone").checked = !!data.gold.smileyWeeklyDone;
  }

  function makeList(containerSel, items, kind) {
    const wrap = el(containerSel);
    wrap.innerHTML = "";
    items.forEach((text, idx) => {
      const row = document.createElement("div");
      row.className = "item";
      const check = document.createElement("input");
      check.type = "checkbox";
      check.checked = typeof text === "object" ? !!text.done : false;
      const input = document.createElement("input");
      input.type = "text";
      input.value = typeof text === "object" ? (text.text || "") : text;
      const spacer = document.createElement("div");
      spacer.className = "spacer";
      const del = document.createElement("button");
      del.className = "del";
      del.textContent = "Delete";

      check.addEventListener("change", () => {
        ensureObj(items, idx);
        items[idx].done = check.checked;
        save();
      });
      input.addEventListener("change", () => {
        ensureObj(items, idx);
        items[idx].text = input.value;
        save();
      });
      del.addEventListener("click", () => {
        items.splice(idx, 1);
        save();
        makeList(containerSel, items, kind);
      });

      row.append(check, input, spacer, del);
      wrap.appendChild(row);
    });
  }
  function ensureObj(arr, idx) {
    if (typeof arr[idx] !== "object") {
      arr[idx] = { text: String(arr[idx] || ""), done: false };
    }
  }

  function renderLists() {
    makeList("#dailyList", data.dailies, "daily");
    makeList("#weeklyList", data.weeklies, "weekly");
  }

  function wireAdders() {
    el("#addDaily").addEventListener("click", () => {
      const t = el("#dailyNew").value.trim();
      if (!t) return;
      data.dailies.push({ text: t, done: false });
      el("#dailyNew").value = "";
      save(); renderLists();
    });
    el("#addWeekly").addEventListener("click", () => {
      const t = el("#weeklyNew").value.trim();
      if (!t) return;
      data.weeklies.push({ text: t, done: false });
      el("#weeklyNew").value = "";
      save(); renderLists();
    });
  }

  // Expand/Collapse
  function toggleSection(btn) {
    const sel = btn.getAttribute("data-toggle");
    const body = el(sel);
    const expanded = btn.getAttribute("aria-expanded") === "true";
    body.style.display = expanded ? "none" : "block";
    btn.setAttribute("aria-expanded", (!expanded).toString());
    btn.textContent = expanded ? "▸" : "▾";
  }

  // Resets & countdowns
  function nextDaily(dt = new Date()) {
    const h = data.settings.dailyHour ?? 9;
    const n = new Date(dt);
    n.setMinutes(0, 0, 0);
    n.setHours(h);
    if (n <= dt) n.setDate(n.getDate() + 1);
    return n;
  }
  function nextWeekly(dt = new Date()) {
    const day = data.settings.weeklyDay ?? 2;
    const hour = data.settings.weeklyHour ?? 9;
    const n = new Date(dt);
    n.setMinutes(0, 0, 0);
    n.setHours(hour);
    // move to next target weekday
    const diff = (day - n.getDay() + 7) % 7;
    if (diff === 0 && n <= dt) n.setDate(n.getDate() + 7);
    else n.setDate(n.getDate() + diff);
    return n;
  }
  function fmtTime(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = String(Math.floor(total / 3600)).padStart(2, "0");
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }
  function updateCountdowns() {
    const now = new Date();
    const nd = nextDaily(now);
    const nw = nextWeekly(now);
    el("#dailyResetText").textContent = nd.toString();
    el("#weeklyResetText").textContent = nw.toString();
    el("#dailyCountdown").textContent = fmtTime(nd - now);
    el("#weeklyCountdown").textContent = fmtTime(nw - now);
  }
  setInterval(updateCountdowns, 500);
  updateCountdowns();

  // ----- Event wiring -----
  // expand/collapse
  els("[data-toggle]").forEach((b) => {
    b.addEventListener("click", () => toggleSection(b));
  });

  // checks
  el("#goldDailyDone").addEventListener("change", (e) => {
    data.gold.dailyDone = e.target.checked; save();
  });
  el("#smileyWeeklyDone").addEventListener("change", (e) => {
    data.gold.smileyWeeklyDone = e.target.checked; save();
  });

  // resets
  el("#btnResetDaily").addEventListener("click", () => {
    data.gold.dailyDone = false;
    data.dailies = data.dailies.map((it) => (typeof it === "object" ? { text: it.text, done: false } : it));
    data.lastDailyReset = new Date().toISOString();
    save(); renderChecks(); renderLists();
  });
  el("#btnResetWeekly").addEventListener("click", () => {
    data.gold.smileyWeeklyDone = false;
    data.weeklies = data.weeklies.map((it) => (typeof it === "object" ? { text: it.text, done: false } : it));
    data.lastWeeklyReset = new Date().toISOString();
    save(); renderChecks(); renderLists();
  });

  // export/import
  el("#btnExport").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fo76-tracker-v1.9.4-backup.json";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  el("#fileImport").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const incoming = JSON.parse(text);
      Object.assign(data, incoming);
      save();
      renderChecks(); renderLists(); updateCountdowns();
      alert("Import complete.");
    } catch (err) {
      alert("Import failed: " + err.message);
    } finally {
      e.target.value = "";
    }
  });

  // expand/collapse all
  el("#btnExpandAll").addEventListener("click", () => {
    els("[data-toggle]").forEach((b) => {
      if (b.getAttribute("aria-expanded") === "false") b.click();
    });
  });
  el("#btnCollapseAll").addEventListener("click", () => {
    els("[data-toggle]").forEach((b) => {
      if (b.getAttribute("aria-expanded") === "true") b.click();
    });
  });

  // settings dialog
  const dlg = el("#settingsDlg");
  el("#btnSettings").addEventListener("click", () => {
    el("#dailyHour").value = data.settings.dailyHour ?? 9;
    el("#weeklyDay").value = data.settings.weeklyDay ?? 2;
    el("#weeklyHour").value = data.settings.weeklyHour ?? 9;
    dlg.showModal();
  });
  el("#saveSettings").addEventListener("click", (ev) => {
    ev.preventDefault();
    const dh = clamp(parseInt(el("#dailyHour").value, 10), 0, 23);
    const wd = clamp(parseInt(el("#weeklyDay").value, 10), 0, 6);
    const wh = clamp(parseInt(el("#weeklyHour").value, 10), 0, 23);
    data.settings.dailyHour = dh;
    data.settings.weeklyDay = wd;
    data.settings.weeklyHour = wh;
    save();
    updateCountdowns();
    dlg.close();
  });

  function clamp(n, lo, hi) { return isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo; }

  // initial render
  renderChecks();
  renderLists();
})();