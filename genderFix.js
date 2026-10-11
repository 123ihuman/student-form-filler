// genderFix.js — robust auto-fill for SSC main Gender (independent, safe to re-inject)

(function () {

  function sleep(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  function isSscPage() {
    return /ssc\.gov\.in/.test(location.hostname);
  }

  async function loadGenderValue() {
    try {
      const data = await chrome.storage.local.get(['profiles', 'activeProfileId']);
      const profiles = data.profiles || [];
      const profile = profiles.find(function (p) { return p.id === data.activeProfileId; }) || profiles[0];
      if (profile && profile.fields && profile.fields.gender) {
        return String(profile.fields.gender);
      }
    } catch (e) {}
    return 'Female';
  }

  // Find the MAIN Gender app-dropdown (skip the "Verify Gender" one)
  function findMainGenderDropdown() {
    const drops = document.querySelectorAll('app-dropdown');
    for (let i = 0; i < drops.length; i++) {
      const container = drops[i];

      // Get the label text from multiple sources
      let lbl = container.getAttribute('label') || '';
      if (!lbl) lbl = container.getAttribute('aria-label') || '';
      if (!lbl) {
        const inner = container.querySelector('.label, label, .control-label, .form-label');
        if (inner) lbl = inner.innerText || '';
      }
      if (!lbl && container.previousElementSibling) {
        lbl = container.previousElementSibling.innerText || '';
      }

      const n = (lbl || '').toLowerCase();
      if (n.indexOf('gender') === -1) continue;   // must mention gender
      if (n.indexOf('verify') !== -1) continue;   // skip the Verify twin

      return container;
    }
    return null;
  }

  function isFilled(container) {
    if (!container) return false;
    const va = container.querySelector('.value-area');
    if (!va) return false;
    const inner = va.querySelector('.value');
    const cur = inner ? (inner.innerText || '') : (va.innerText || '');
    return !!(cur.trim() && !/^select$/i.test(cur.trim()));
  }

  async function openDropdown(container) {
    const trigger = container.querySelector('.value-area') ||
                    container.querySelector('.ng-dropdown') ||
                    container;
    try { trigger.scrollIntoView({ block: 'center' }); } catch (e) {}
    await sleep(60);
    try { trigger.focus(); } catch (e) {}
    await sleep(60);
    try { trigger.click(); } catch (e) {}
    try { trigger.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window })); } catch (e) {}
    try { trigger.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window })); } catch (e) {}
    try { trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window })); } catch (e) {}
  }

  async function findAndClickOption(targetValue, excludeContainer) {
    const target = String(targetValue || '').toLowerCase().trim();
    if (!target) return false;

    const deadline = Date.now() + 1800;
    while (Date.now() < deadline) {
      await sleep(100);

      const candidates = document.querySelectorAll(
        '[role="option"], li, .option, .ng-option, .dropdown-item, .dropdown-menu li, button'
      );

      for (let i = 0; i < candidates.length; i++) {
        const el = candidates[i];
        if (el.offsetParent === null || el.offsetHeight === 0) continue;
        if (excludeContainer && excludeContainer.contains(el)) continue;

        const txt = (el.innerText || el.textContent || '').trim();
        if (!txt || txt.length > 60) continue;

        const first = txt.split('/')[0].trim().toLowerCase();
        if (first !== target) continue;

        // Full click sequence
        try { el.scrollIntoView({ block: 'center' }); } catch (e) {}
        await sleep(40);
        try { el.click(); } catch (e) {}
        try { el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window })); } catch (e) {}
        try { el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window })); } catch (e) {}
        await sleep(350);
        return true;
      }
    }
    return false;
  }

  async function attemptGenderFill(genderValue) {
    const gender = findMainGenderDropdown();
    if (!gender) return false;
    if (isFilled(gender)) return true;

    // Close any lingering panel
    try { document.body.click(); } catch (e) {}
    await sleep(150);

    // Attempt A — reuse content.js's helper if present
    if (typeof window.fillCustomSelect === 'function') {
      try {
        await window.fillCustomSelect(gender, genderValue);
        if (isFilled(gender)) return true;
      } catch (e) {}
    }

    // Attempt B — manual open + click option
    await openDropdown(gender);
    const clicked = await findAndClickOption(genderValue, gender);
    if (clicked) {
      await sleep(400);
      if (isFilled(gender)) return true;
    }

    // Attempt C — keyboard filter + Enter
    try {
      const trigger = gender.querySelector('.value-area') || gender.querySelector('input') || gender;
      try { trigger.focus(); } catch (e) {}

      const firstChars = String(genderValue).replace(/[^a-zA-Z]/g, '').slice(0, 4);
      for (let ci = 0; ci < firstChars.length; ci++) {
        const ch = firstChars[ci];
        try { trigger.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: ch, char: ch })); } catch (e) {}
        try { trigger.dispatchEvent(new KeyboardEvent('keypress', { bubbles: true, cancelable: true, key: ch, char: ch })); } catch (e) {}
        try { trigger.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, cancelable: true, key: ch, char: ch })); } catch (e) {}
        await sleep(50);
      }
      await sleep(200);

      await findAndClickOption(genderValue, gender);
      if (isFilled(gender)) return true;

      try { trigger.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown' })); } catch (e) {}
      await sleep(80);
      try { trigger.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' })); } catch (e) {}
      await sleep(400);
      if (isFilled(gender)) return true;
    } catch (e) {}

    return false;
  }

  // Wait for content.js to finish its fill, then act
  async function waitForFillToSettle() {
    const start = Date.now();
    let sawActivity = false;
    let lastCount = 0;
    let lastChangeTime = Date.now();

    while (Date.now() - start < 15000) {
      const count = document.querySelectorAll('[data-egram-filled="1"]').length;
      if (count > 0) sawActivity = true;
      if (count !== lastCount) {
        lastCount = count;
        lastChangeTime = Date.now();
      }
      // Idle for 2s AND at least some fills → likely done
      if (sawActivity && Date.now() - lastChangeTime > 2000) return true;
      // Or 8s with no activity at all → just proceed
      if (!sawActivity && Date.now() - start > 8000) return true;
      await sleep(250);
    }
    return true;
  }

  async function runGenderFix() {
    if (!isSscPage()) return;

    await waitForFillToSettle();
    await sleep(800);

    const genderValue = await loadGenderValue();

    // Up to 4 attempts, spaced 1.5s apart
    for (let attempt = 0; attempt < 4; attempt++) {
      if (await attemptGenderFill(genderValue)) return;
      await sleep(1500);
    }
  }

  // React to the same "fill" message the popup sends — but don't respond
  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg && msg.action === 'fill') {
      setTimeout(function () { runGenderFix(); }, 300);
    }
  });
})();