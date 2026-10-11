// dsssbForce.js — silent force set for DSSSB gender + checkboxes
// Fires NO events. Uses property override as fallback.

(function () {
  if (!/dsssonline\.nic\.in/i.test(location.hostname)) return;
  if (window.__dsssbForceActive) return;
  window.__dsssbForceActive = true;

  async function getGender() {
    try {
      const d = await chrome.storage.local.get(['profiles', 'activeProfileId']);
      const profiles = d.profiles || [];
      const p = profiles.find(function (x) { return x.id === d.activeProfileId; }) || profiles[0];
      return (p && p.fields && p.fields.gender) || 'Male';
    } catch (e) { return 'Male'; }
  }

  // ══════ SILENT SELECT — sets value, no events ══════
  function silentSelect(id, wanted) {
    const el = document.getElementById(id);
    if (!el || el.tagName !== 'SELECT' || !wanted) return 0;

    const w = String(wanted).toLowerCase().trim();
    let targetIdx = -1;

    for (let i = 0; i < el.options.length; i++) {
      const t = (el.options[i].text || '').toLowerCase().trim();
      const v = (el.options[i].value || '').toLowerCase().trim();
      let hit = false;
      if (t === w || v === w) hit = true;
      else if (w === 'female' && (t === 'f' || t.indexOf('female') !== -1 || v === 'f')) hit = true;
      else if (w === 'male' && (t === 'm' || t.indexOf('male') !== -1 || v === 'm')) hit = true;
      else if (w === 'indian' && t.indexOf('india') !== -1) hit = true;
      if (hit) { targetIdx = i; break; }
    }

    if (targetIdx === -1) return 0;
    if (el.selectedIndex === targetIdx) return 1;

    try {
      el.selectedIndex = targetIdx;
      el.options[targetIdx].selected = true;
      // Silent — no dispatch, no focus, no click
      el.style.backgroundColor = '#d4edda';
      el.style.outline = '3px solid #28a745';
      return 1;
    } catch (e) { return 0; }
  }

  // ══════ SILENT CHECKBOX — sets checked, no events ══════
  function silentCheck(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    if (el.checked) return 1;

    try {
      el.checked = true;
      el.setAttribute('checked', 'checked');
      el.style.outline = '3px solid #28a745';
      el.style.backgroundColor = '#d4edda';
      // Silent — no events
      return 1;
    } catch (e) { return 0; }
  }

  // ══════ FORCE OVERRIDE — nuclear fallback ══════
  // If site JS keeps writing back to the field, override the property descriptor
  function forceLockSelect(id, wanted) {
    const el = document.getElementById(id);
    if (!el || el.tagName !== 'SELECT') return;
    if (el.dataset.forceLocked === '1') return;

    const w = String(wanted).toLowerCase().trim();
    let targetValue = null;
    for (let i = 0; i < el.options.length; i++) {
      const t = (el.options[i].text || '').toLowerCase().trim();
      if (t === w || (w === 'female' && t.indexOf('female') !== -1) ||
          (w === 'male' && t.indexOf('male') !== -1) ||
          (w === 'indian' && t.indexOf('india') !== -1)) {
        targetValue = el.options[i].value;
        el.selectedIndex = i;
        el.options[i].selected = true;
        break;
      }
    }
    if (!targetValue) return;

    try {
      Object.defineProperty(el, 'value', {
        get: function () { return targetValue; },
        set: function () { /* block writes */ },
        configurable: true
      });
      el.dataset.forceLocked = '1';
      el.style.backgroundColor = '#d4edda';
      el.style.outline = '3px solid #28a745';
    } catch (e) {}
  }

  function forceLockCheck(id) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.dataset.forceLocked === '1') return;

    try {
      el.checked = true;
      el.setAttribute('checked', 'checked');
      Object.defineProperty(el, 'checked', {
        get: function () { return true; },
        set: function () { /* block writes */ },
        configurable: true
      });
      el.dataset.forceLocked = '1';
      el.style.outline = '3px solid #28a745';
    } catch (e) {}
  }

  // ══════ MAIN LOOP — runs every 400ms ══════
  async function enforceAll() {
    const gender = await getGender();
    let n = 0;

    // Silent set first (works most of the time)
    n += silentSelect('RadioButtonList_mf', gender);
    n += silentSelect('rbtReSelectGend', gender);
    n += silentSelect('DDL_Nationality', 'Indian');
    n += silentCheck('CheckBoxdisclaimer');
    n += silentCheck('chkPreview');

    // If silent set failed (value still wrong), lock it
    const selGender = document.getElementById('RadioButtonList_mf');
    if (selGender && (selGender.value === 'S' || selGender.selectedIndex === 0)) {
      forceLockSelect('RadioButtonList_mf', gender);
    }
    const selReGender = document.getElementById('rbtReSelectGend');
    if (selReGender && (selReGender.value === 'S' || selReGender.selectedIndex === 0)) {
      forceLockSelect('rbtReSelectGend', gender);
    }
    const cb1 = document.getElementById('CheckBoxdisclaimer');
    if (cb1 && !cb1.checked) forceLockCheck('CheckBoxdisclaimer');
    const cb2 = document.getElementById('chkPreview');
    if (cb2 && !cb2.checked) forceLockCheck('chkPreview');

    return n;
  }

  // Run once at 1.5s
  setTimeout(enforceAll, 1500);
  setTimeout(enforceAll, 2500);
  setTimeout(enforceAll, 4000);

  // Then loop forever
  let last = -1;
  setInterval(async function () {
    const n = await enforceAll();
    if (n !== last) {
      console.log('[dsssbForce] enforced ' + n + ' control(s)');
      last = n;
    }
  }, 400);
})();