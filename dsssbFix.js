// dsssbFix.js — DSSSB specific (safe fields + one-by-one trigger queue)

(function () {
  if (!/dsssonline\.nic\.in/i.test(location.hostname)) return;
  if (window.__dsssbRunning) return;
  window.__dsssbRunning = true;

  // ══════ FIELD GROUPS ══════

  // Safe fields — no page refresh, fill all at once
  const SAFE_TEXT = [
    ['txt_name', 'fullName'],
    ['txtReName', 'fullName'],
    ['txt_roll_no', 'tenthRollNumber'],
    ['txtReEntRollNo', 'tenthRollNumber'],
    ['txt_fh_name', 'fatherName'],
    ['txtReFname', 'fatherName'],
    ['txt_mothername', 'motherName'],
    ['txtReMName', 'motherName'],
    ['txtAdharNo', 'aadhaarNumber'],
    ['txtReAdharNo', 'aadhaarNumber'],
    ['txtNameAdhar', 'fullName'],
    ['txtReNameAdhar', 'fullName'],
    ['txtpassword', 'password'],
    ['txt_re_password', 'password']
  ];

  const SAFE_SELECT = [
    ['RadioButtonList_mf', 'gender'],
    ['rbtReSelectGend', 'gender'],
    ['DDL_Nationality', 'Indian']
  ];

  const SAFE_RADIO = ['rbtHaveAdhar_0'];
  const SAFE_CHECK = ['CheckBoxdisclaimer', 'chkPreview'];

  // Trigger fields — site refreshes when these change. Fill ONE per page load.
  const TRIGGER_QUEUE = [
    { type: 'text',   id: 'txt_DOB',           key: 'dob',          format: 'date' },
    { type: 'text',   id: 'txtReDOB',          key: 'dob',          format: 'date' },
    { type: 'select', id: 'ddl_pass_year',     key: 'tenthYear' },
    { type: 'select', id: 'ddl_reenter_year',  key: 'tenthYear' },
    { type: 'text',   id: 'txt_mob',           key: 'mobile',       format: 'mobile' },
    { type: 'text',   id: 'txtReMobNo',        key: 'mobile',       format: 'mobile' },
    { type: 'text',   id: 'txt_email',         key: 'email' },
    { type: 'text',   id: 'txtReEntEmail',     key: 'email' }
  ];

  const STORAGE_KEY = 'dsssbTriggerIndex';   // which trigger to fill next
  const MARKER_KEY  = 'dsssbQueueActive';    // flag: queue still running

  // ══════ HELPERS ══════

  function fmtDate(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return String(d.getDate()).padStart(2, '0') + '/' +
           String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  }

  function applyText(id, value) {
    const el = document.getElementById(id);
    if (!el || el.disabled || value === undefined || value === null || value === '') return 0;
    const s = String(value);
    if (el.value === s) return 1;
    try {
      el.value = s;
      el.setAttribute('value', s);
      el.style.backgroundColor = '#d4edda';
      return 1;
    } catch (e) { return 0; }
  }

  function applySelect(id, value) {
    if (!value) return 0;
    const el = document.getElementById(id);
    if (!el || el.tagName !== 'SELECT') return 0;
    const want = String(value).toLowerCase().trim();
    for (let i = 0; i < el.options.length; i++) {
      const t = (el.options[i].text || '').toLowerCase().trim();
      const v = (el.options[i].value || '').toLowerCase().trim();
      let hit = (t === want || v === want);
      if (!hit && want === 'female' && (t === 'f' || t.indexOf('female') !== -1)) hit = true;
      if (!hit && want === 'male'   && (t === 'm' || t.indexOf('male')   !== -1)) hit = true;
      if (!hit && want === 'indian' && t.indexOf('india') !== -1) hit = true;
      if (hit) {
        el.selectedIndex = i;
        el.options[i].selected = true;
        el.style.backgroundColor = '#d4edda';
        return 1;
      }
    }
    return 0;
  }

  function applyRadio(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    if (el.checked) return 1;
    el.checked = true;
    el.setAttribute('checked', 'checked');
    el.style.outline = '2px solid #28a745';
    return 1;
  }

  function applyCheck(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    if (el.checked) return 1;
    el.checked = true;
    el.setAttribute('checked', 'checked');
    el.style.outline = '2px solid #28a745';
    return 1;
  }

  // ══════ FILL SAFE FIELDS (fast) ══════

  async function loadProfile() {
    try {
      const d = await chrome.storage.local.get(['profiles', 'activeProfileId']);
      const profiles = d.profiles || [];
      return profiles.find(function (p) { return p.id === d.activeProfileId; }) || profiles[0];
    } catch (e) { return null; }
  }

  function fillSafe(profile) {
    if (!profile || !profile.fields) return 0;
    const f = profile.fields;
    let n = 0;

    // Text fields
    for (let i = 0; i < SAFE_TEXT.length; i++) {
      const id = SAFE_TEXT[i][0];
      const key = SAFE_TEXT[i][1];
      let v = f[key];
      if (key === 'tenthRollNumber') v = v || f.rollNumber;
      if (key === 'aadhaarNumber') v = (v || '').replace(/\D/g, '').slice(0, 12);
      if (key === 'password' && !v) v = 'DsssB@2026';
      n += applyText(id, v);
    }

    // Selects
    for (let i = 0; i < SAFE_SELECT.length; i++) {
      n += applySelect(SAFE_SELECT[i][0], f[SAFE_SELECT[i][1]] || SAFE_SELECT[i][1]);
    }

    // Radios
    for (let i = 0; i < SAFE_RADIO.length; i++) n += applyRadio(SAFE_RADIO[i]);

    // Checkboxes
    for (let i = 0; i < SAFE_CHECK.length; i++) n += applyCheck(SAFE_CHECK[i]);

    return n;
  }

  // ══════ TRIGGER FIELDS (one per load) ══════

  function applyTrigger(item, profile) {
    if (!profile || !profile.fields) return false;
    const f = profile.fields;
    let v = f[item.key];
    if (!v) return false;

    if (item.format === 'date') v = fmtDate(v);
    if (item.format === 'mobile') v = String(v).replace(/\D/g, '').slice(-10);
    if (item.type === 'select') return !!applySelect(item.id, v);
    return !!applyText(item.id, v);
  }

  async function processTriggerQueue(profile) {
    const d = await chrome.storage.local.get([STORAGE_KEY, MARKER_KEY]);
    let idx = d[STORAGE_KEY] || 0;
    const active = d[MARKER_KEY] === true;

    if (!active) {
      console.log('[dsssbFix] safe fields filled. Skipping trigger queue — not active.');
      return;
    }

    if (idx >= TRIGGER_QUEUE.length) {
      // All triggers done
      await chrome.storage.local.remove([STORAGE_KEY, MARKER_KEY]);
      console.log('[dsssbFix] ✅ ALL trigger fields filled. Queue complete.');
      return;
    }

    const item = TRIGGER_QUEUE[idx];
    const ok = applyTrigger(item, profile);
    console.log('[dsssbFix] trigger ' + (idx + 1) + '/' + TRIGGER_QUEUE.length +
                ' → ' + item.id + ' = ' + (ok ? 'FILLED' : 'FAILED'));

    // Advance index BEFORE waiting — if page reloads, next injection picks up next
    idx++;
    await chrome.storage.local.set({ [STORAGE_KEY]: idx });

    // The site will now refresh. Wait a moment so the reload starts cleanly.
    // If it doesn't refresh (some fields may not trigger), background will
    // re-inject on next page visit anyway.
  }

  // ══════ MAIN ══════

  async function run() {
    // Wait for the page's own JS to settle
    await new Promise(function (r) { setTimeout(r, 2000); });

    const profile = await loadProfile();
    if (!profile) {
      console.log('[dsssbFix] no profile loaded');
      return;
    }

    // 1. Always re-fill safe fields on every load
    const n = fillSafe(profile);
    console.log('[dsssbFix] safe fields: ' + n + ' filled');

    // 2. Process ONE trigger field (or nothing if queue finished)
    await processTriggerQueue(profile);
  }

  run();

  // Also react to explicit Fill clicks (for the first ever run)
  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg && msg.action === 'fill') {
      // Restart the queue for this fresh click
      chrome.storage.local.set({
        [STORAGE_KEY]: 0,
        [MARKER_KEY]: true
      }).then(function () {
        run();
      });
    }
  });
})();