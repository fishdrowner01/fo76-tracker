// FO76 Tracker App
(function(){
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const STORAGE_KEY = 'fo76_tracker_v1';

  const state = loadState() || defaultState();
  bindUI();
  renderAll();
  scheduleTick();

  function defaultState(){
    return {
      // reset config (safe defaults; user can change)
      reset: {
        type: 'local',      // 'local' | 'utc'
        dailyHour: 6,       // hour of daily reset (0-23) — editable
        weeklyDow: 1,       // 0 Sun .. 6 Sat, default Monday
        weeklyHour: 6
      },
      gold: {
        expanded: false,
        dailyDone: false,
        smileyDone: false,
        earnedToday: 0,
        earnedWeek: 0
      },
      dailies: [
        { id: nid(), text: 'Complete Daily Ops', done: false },
        { id: nid(), text: 'Visit Gold Press (Treasury Notes)', done: false },
        { id: nid(), text: 'Vendor Caps Limit', done: false },
      ],
      weeklies: [
        { id: nid(), text: 'Complete Weekly Challenges', done: false },
        { id: nid(), text: 'Buy Gold from Smiley', done: false },
      ],
      lastDailyResetAt: null,
      lastWeeklyResetAt: null
    };
  }

  function nid(){ return Math.random().toString(36).slice(2,10); }

  function loadState(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch(e){
      console.warn('Failed to parse saved state', e);
      return null;
    }
  }

  function saveState(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function bindUI(){
    // Reset settings
    $('#resetType').value = state.reset.type;
    $('#dailyHour').value = state.reset.dailyHour;
    $('#weeklyDow').value = String(state.reset.weeklyDow);
    $('#weeklyHour').value = state.reset.weeklyHour;

    $('#applyReset').addEventListener('click', () => {
      state.reset.type = $('#resetType').value;
      state.reset.dailyHour = clampInt($('#dailyHour').value, 0, 23, 6);
      state.reset.weeklyDow = clampInt($('#weeklyDow').value, 0, 6, 1);
      state.reset.weeklyHour = clampInt($('#weeklyHour').value, 0, 23, 6);
      saveState();
      renderFooter();
    });

    // Export/Import/Reset buttons
    $('#exportBtn').addEventListener('click', doExport);
    $('#importFile').addEventListener('change', doImport);
    $('#resetBtn').addEventListener('click', () => {
      if (confirm('Reset all checkboxes and gold values now?')) {
        state.dailies.forEach(t => t.done = false);
        state.weeklies.forEach(t => t.done = false);
        state.gold.dailyDone = false;
        state.gold.smileyDone = false;
        state.gold.earnedToday = 0;
        state.gold.earnedWeek = 0;
        saveState();
        renderAll();
      }
    });

    // Gold widget
    $('#goldExpanded').checked = !!state.gold.expanded;
    $('#goldExpanded').addEventListener('change', e => {
      state.gold.expanded = e.target.checked;
      saveState();
      renderGold();
    });
    $('#gbDailyDone').addEventListener('change', e => {
      state.gold.dailyDone = e.target.checked;
      saveState();
    });
    $('#gbSmileyDone').addEventListener('change', e => {
      state.gold.smileyDone = e.target.checked;
      saveState();
    });
    $('#gbEarnedToday').addEventListener('input', e => {
      state.gold.earnedToday = clampInt(e.target.value, 0, 999999, 0);
      saveState();
    });
    $('#gbEarnedWeek').addEventListener('input', e => {
      state.gold.earnedWeek = clampInt(e.target.value, 0, 999999, 0);
      saveState();
    });

    // Add task handlers
    $('#addDaily').addEventListener('click', () => addTask('daily'));
    $('#addWeekly').addEventListener('click', () => addTask('weekly'));
    $('#newDaily').addEventListener('keydown', e => { if (e.key === 'Enter') addTask('daily'); });
    $('#newWeekly').addEventListener('keydown', e => { if (e.key === 'Enter') addTask('weekly'); });
  }

  function clampInt(v, min, max, def){
    const n = parseInt(v, 10);
    if (isNaN(n)) return def;
    return Math.max(min, Math.min(max, n));
  }

  function addTask(kind){
    const input = kind === 'daily' ? $('#newDaily') : $('#newWeekly');
    const list = kind === 'daily' ? state.dailies : state.weeklies;
    const val = (input.value || '').trim();
    if (!val) return;
    list.push({ id: nid(), text: val, done: false });
    input.value = '';
    saveState();
    renderTasks();
  }

  function renderAll(){
    renderTasks();
    renderGold();
    renderFooter();
  }

  function renderTasks(){
    const makeItem = (t, kind) => {
      const li = document.createElement('li');
      li.className = 'task';
      li.innerHTML = \`
        <input type="checkbox" \${t.done ? 'checked' : ''} />
        <input type="text" value="\${escapeHtml(t.text)}" />
        <button class="del">Delete</button>
      \`;
      const [cb, txt, del] = li.children;
      cb.addEventListener('change', e => { t.done = e.target.checked; saveState(); });
      txt.addEventListener('input', e => { t.text = e.target.value; saveState(); });
      del.addEventListener('click', () => {
        const arr = kind === 'daily' ? state.dailies : state.weeklies;
        const idx = arr.findIndex(x => x.id === t.id);
        if (idx >= 0) { arr.splice(idx,1); saveState(); renderTasks(); }
      });
      return li;
    };

    const dailyUl = $('#dailyList');
    dailyUl.innerHTML = '';
    state.dailies.forEach(t => dailyUl.appendChild(makeItem(t, 'daily')));

    const weeklyUl = $('#weeklyList');
    weeklyUl.innerHTML = '';
    state.weeklies.forEach(t => weeklyUl.appendChild(makeItem(t, 'weekly')));
  }

  function renderGold(){
    $('#gbDailyDone').checked = !!state.gold.dailyDone;
    $('#gbSmileyDone').checked = !!state.gold.smileyDone;
    $('#gbEarnedToday').value = state.gold.earnedToday ?? 0;
    $('#gbEarnedWeek').value = state.gold.earnedWeek ?? 0;
    $('#goldDetails').style.display = state.gold.expanded ? 'block' : 'none';
  }

  function renderFooter(){
    $('#nowStr').textContent = new Date().toLocaleString();
    const nextD = nextDailyDate();
    const nextW = nextWeeklyDate();
    $('#nextDailyReset').textContent = 'Next daily reset: ' + nextD.toLocaleString();
    $('#nextWeeklyReset').textContent = 'Next weekly reset: ' + nextW.toLocaleString();
  }

  function scheduleTick(){
    setInterval(() => {
      autoResetIfNeeded();
      renderFooter();
    }, 1000 * 30); // every 30s
  }

  function autoResetIfNeeded(){
    const now = new Date();
    // daily
    const lastD = state.lastDailyResetAt ? new Date(state.lastDailyResetAt) : null;
    const nextD = computeNextReset('daily', lastD);
    if (now >= nextD) {
      state.dailies.forEach(t => t.done = false);
      state.gold.dailyDone = false;
      state.gold.earnedToday = 0;
      state.lastDailyResetAt = now.toISOString();
      saveState();
      renderTasks();
      renderGold();
    }

    // weekly
    const lastW = state.lastWeeklyResetAt ? new Date(state.lastWeeklyResetAt) : null;
    const nextW = computeNextReset('weekly', lastW);
    if (now >= nextW) {
      state.weeklies.forEach(t => t.done = false);
      state.gold.smileyDone = false;
      state.gold.earnedWeek = 0;
      state.lastWeeklyResetAt = now.toISOString();
      saveState();
      renderTasks();
      renderGold();
    }
  }

  function nextDailyDate(){
    const last = state.lastDailyResetAt ? new Date(state.lastDailyResetAt) : null;
    return computeNextReset('daily', last);
  }
  function nextWeeklyDate(){
    const last = state.lastWeeklyResetAt ? new Date(state.lastWeeklyResetAt) : null;
    return computeNextReset('weekly', last);
  }

  function computeNextReset(kind, lastReset){
    const cfg = state.reset;
    const base = new Date();

    const useUTC = cfg.type === 'utc';
    const getHours = (d) => useUTC ? d.getUTCHours() : d.getHours();
    const setHours = (d, h, m=0, s=0, ms=0) => {
      if (useUTC) d.setUTCHours(h, m, s, ms);
      else d.setHours(h, m, s, ms);
    };
    const getDay = (d) => useUTC ? d.getUTCDay() : d.getDay();

    let next = new Date(base);
    if (kind === 'daily'){
      setHours(next, cfg.dailyHour, 0, 0, 0);
      if (next <= base) next.setDate(next.getDate() + 1);
      if (lastReset && lastReset >= next) next.setDate(next.getDate() + 1);
    } else {
      // weekly
      setHours(next, cfg.weeklyHour, 0, 0, 0);
      const targetDow = cfg.weeklyDow; // 0 Sun..6 Sat
      // advance to target weekday
      let diff = (targetDow - getDay(next) + 7) % 7;
      if (diff === 0 && next <= base) diff = 7;
      next.setDate(next.getDate() + diff);
      if (lastReset && lastReset >= next) next.setDate(next.getDate() + 7);
    }
    return next;
  }

  function escapeHtml(s){
    return s.replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[c]);
  }

  // Export / Import
  function doExport(){
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state,null,2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = 'fo76-tracker-data.json';
    a.click();
  }
  function doImport(e){
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result);
        // shallow validate
        if (!obj || !obj.reset || !obj.dailies || !obj.weeklies) throw new Error('Invalid data');
        Object.assign(state, obj);
        saveState();
        bindUI(); // refresh inputs
        renderAll();
        alert('Import completed.');
      } catch(err){
        alert('Import failed: ' + err.message);
      }
    };
    reader.readAsText(file);
  }
})();