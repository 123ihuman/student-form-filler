// sscVerifyNameFix.js — DOM-order fill for Verify Candidate Name

(function () {
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function isSsc() { return /ssc\.gov\.in/i.test(location.hostname); }

  async function loadProfile() {
    try {
      const data = await chrome.storage.local.get(['profiles', 'activeProfileId']);
      const profiles = data.profiles || [];
      return profiles.find(function (p) { return p.id === data.activeProfileId; }) || profiles[0];
    } catch (e) {}
    return null;
  }

  function setNativeValue(el, value) {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  // Visible + empty + not readonly
  function isUsable(inp) {
    if (inp.disabled || inp.readOnly) return false;
    if (inp.type === 'hidden' || inp.type === 'submit' || inp.type === 'button' || inp.type === 'file') return false;
    if (inp.offsetParent === null) return false;
    return true;
  }

  // Return ALL visible text-like inputs in DOM order
  function visibleTextInputs() {
    return Array.from(document.querySelectorAll('input'))
      .filter(function (inp) {
        if (!isUsable(inp)) return false;
        const t = (inp.type || 'text').toLowerCase();
        return t === 'text' || t === 'email' || t === 'tel' || t === 'number' || t === '';
      });
  }

  // Find the "main name" input by aria or name
  function findMainNameInput() {
    return document.querySelector('input[aria-describedby="userName"]')
        || document.querySelector('input[name="userName"]')
        || document.querySelector('input#userName');
  }

  // Was this input already filled with the target value?
  function alreadyCorrect(el, target) {
    return el.value && el.value.trim() === target.trim();
  }

  // ── MAIN: after main name is filled, find the next empty text input and fill ──
  async function fillVerifyName() {
    const profile = await loadProfile();
    if (!profile || !profile.fields || !profile.fields.fullName) return false;

    const wanted = String(profile.fields.fullName).trim();

    // 1. Try direct selectors first
    const directSelectors = [
      'input[aria-describedby="userNameVerify"]',
      'input[name="userNameVerify"]',
      'input#userNameVerify',
      'input[id*="userNameVerify" i]',
      'input[name*="userNameVerify" i]',
      'input[aria-describedby*="userNameVerify" i]'
    ];
    for (let i = 0; i < directSelectors.length; i++) {
      const el = document.querySelector(directSelectors[i]);
      if (el && isUsable(el)) {
        if (alreadyCorrect(el, wanted)) return true;
        setNativeValue(el, wanted);
        el.style.backgroundColor = '#d4edda';
        el.style.outline = '2px solid #28a745';
        el.dataset.egramFilled = '1';
        console.log('[sscVerifyNameFix] direct fill via:', directSelectors[i]);
        return true;
      }
    }

    // 2. Fallback — DOM-order approach
    const mainName = findMainNameInput();
    if (!mainName) {
      console.log('[sscVerifyNameFix] main name input not found — aborting');
      return false;
    }

    const all = visibleTextInputs();
    const mainIdx = all.indexOf(mainName);
    if (mainIdx === -1) {
      console.log('[sscVerifyNameFix] main name not in visible list');
      return false;
    }

    // Search forward up to 3 inputs for the first empty one
    for (let i = mainIdx + 1; i < Math.min(all.length, mainIdx + 4); i++) {
      const el = all[i];

      // Skip fields that clearly belong to a different section
      const ad = (el.getAttribute('aria-describedby') || '').toLowerCase();
      const nm = (el.name || '').toLowerCase();
      const combined = ad + ' ' + nm;
      if (/mobile|email|phone|aadhaar|password|pin|pan/i.test(combined)) continue;

      if (alreadyCorrect(el, wanted)) return true;

      try {
        el.focus();
        setNativeValue(el, wanted);
        el.style.backgroundColor = '#d4edda';
        el.style.outline = '2px solid #28a745';
        el.dataset.egramFilled = '1';
        console.log('[sscVerifyNameFix] DOM-order fill (index ' + i + ', main was ' + mainIdx + ')');
        return true;
      } catch (e) {
        console.log('[sscVerifyNameFix] DOM-order error:', e.message);
      }
    }

    console.log('[sscVerifyNameFix] no suitable verify field nearby');
    return false;
  }

  // ── Runner: retries until success or 60s timeout ──
  let running = false;
  async function run(reason) {
    if (!isSsc() || running) return;
    running = true;
    console.log('[sscVerifyNameFix] start (' + reason + ')');

    const start = Date.now();
    let filled = false;
    while (Date.now() - start < 60000) {
      filled = await fillVerifyName();
      if (filled) {
        // Keep polling for 5 more seconds — site may rewrite
        const confirmUntil = Date.now() + 5000;
        while (Date.now() < confirmUntil) {
          await sleep(500);
          await fillVerifyName();
        }
        break;
      }
      await sleep(500);
    }
    running = false;
    console.log(filled ? '[sscVerifyNameFix] done' : '[sscVerifyNameFix] gave up');
  }

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(function () { run('load'); }, 2500);
    });
  } else {
    setTimeout(function () { run('load'); }, 2500);
  }

  // Run on fill message
  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg && msg.action === 'fill') {
      setTimeout(function () { run('message'); }, 800);
    }
  });
})();