// bpscFix.js — site-specific fixes for BPSC (bpsconline.bihar.gov.in)

(function () {
  function sleep(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  function isBpsc() {
    return /bpsconline\.bihar\.gov\.in|bpsc\.bihar\.gov\.in/i.test(location.hostname);
  }

  async function loadProfile() {
    try {
      const data = await chrome.storage.local.get(['profiles', 'activeProfileId']);
      const profiles = data.profiles || [];
      return profiles.find(function (p) { return p.id === data.activeProfileId; }) || profiles[0];
    } catch (e) {}
    return null;
  }

  function setValue(input, value) {
    try {
      input.focus();
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, String(value));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('blur', { bubbles: true }));
      input.style.backgroundColor = '#d4edda';
      return true;
    } catch (e) {
      return false;
    }
  }

  // Match field label containing the given phrase
  function findInputByLabel(phrase) {
    const norm = function (s) {
      return (s || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
    };
    const target = norm(phrase);
    const all = document.querySelectorAll('input:not([type=hidden]):not([type=file]), select, textarea');
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      if (el.disabled || el.readOnly) continue;

      let label = '';
      if (el.id) {
        const l = document.querySelector('label[for="' + el.id + '"]');
        if (l) label += ' ' + (l.innerText || '');
      }
      if (el.closest('label')) label += ' ' + el.closest('label').innerText;
      label += ' ' + (el.placeholder || '');
      label += ' ' + (el.name || '');
      label += ' ' + (el.id || '');
      // Walk up to find nearby text
      let p = el.parentElement;
      let hops = 0;
      while (p && hops < 4) {
        label += ' ' + (p.innerText || '').slice(0, 200);
        p = p.parentElement;
        hops++;
      }

      if (norm(label).indexOf(target) !== -1) return el;
    }
    return null;
  }

  async function fillIfEmpty(phrase, value) {
    if (!value) return 0;
    const el = findInputByLabel(phrase);
    if (!el) return 0;
    if (el.value && el.value.trim().length > 0) return 0;
    if (setValue(el, value)) return 1;
    return 0;
  }

  // Tick the "I Agree" / consent checkbox
  async function tickAgreeCheckbox() {
    const cbs = document.querySelectorAll('input[type="checkbox"]');
    let ticked = 0;
    for (let i = 0; i < cbs.length; i++) {
      const cb = cbs[i];
      if (cb.disabled || cb.checked) continue;

      let text = '';
      if (cb.id) {
        const l = document.querySelector('label[for="' + cb.id + '"]');
        if (l) text += ' ' + (l.innerText || '');
      }
      const wrap = cb.closest('label');
      if (wrap) text += ' ' + (wrap.innerText || '');
      if (cb.parentElement) text += ' ' + (cb.parentElement.innerText || '');
      if (cb.parentElement && cb.parentElement.parentElement) {
        text += ' ' + (cb.parentElement.parentElement.innerText || '');
      }
      text = text.toLowerCase();

      const isConsent =
        /i agree|i hereby|consent|declaration|declare|solemnly affirm|true and correct|confirm|accept|undertake|authorize|authorise/i.test(text);
      if (!isConsent) continue;

      // Try every click method
      try {
        const lbl = cb.closest('label');
        if (lbl) lbl.click();
        else cb.click();

        await sleep(50);

        if (!cb.checked) {
          cb.checked = true;
          cb.dispatchEvent(new Event('input', { bubbles: true }));
          cb.dispatchEvent(new Event('change', { bubbles: true }));
          cb.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        }

        if (cb.checked) {
          cb.style.outline = '2px solid #28a745';
          ticked++;
        }
      } catch (e) {}
    }
    return ticked;
  }

  async function waitForFillToSettle() {
    const start = Date.now();
    let lastChange = Date.now();
    let lastCount = 0;
    let sawActivity = false;

    while (Date.now() - start < 12000) {
      const count = document.querySelectorAll('[data-egram-filled="1"]').length;
      if (count > 0) sawActivity = true;
      if (count !== lastCount) {
        lastCount = count;
        lastChange = Date.now();
      }
      if (sawActivity && Date.now() - lastChange > 1500) return true;
      if (!sawActivity && Date.now() - start > 7000) return true;
      await sleep(200);
    }
    return true;
  }

  async function runFix() {
    if (!isBpsc()) return;

    await waitForFillToSettle();
    await sleep(500);

    const profile = await loadProfile();
    if (!profile || !profile.fields) return;
    const f = profile.fields;

    // Up to 3 attempts — some forms render slower
    for (let attempt = 0; attempt < 3; attempt++) {
      let n = 0;
      n += await fillIfEmpty('candidate name', f.fullName);
      n += await fillIfEmpty('candidate father', f.fatherName);
      n += await fillIfEmpty('candidate mother', f.motherName);
      n += await fillIfEmpty('father name', f.fatherName);
      n += await fillIfEmpty('mother name', f.motherName);
      const t = await tickAgreeCheckbox();
      if (n + t > 0) {
        console.log('[bpscFix] filled ' + n + ' text fields, ticked ' + t + ' checkboxes');
      }
      await sleep(700);
    }
  }

  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg && msg.action === 'fill') {
      setTimeout(runFix, 300);
    }
  });
})();