// bankingFix.js — handles split email/phone/mobile fields on IBPS/SBI/PO/PSU bank forms

(function () {
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function isBankForm() {
    return /ibps\.in|sbi\.co\.in|bankofbaroda|canarabank|pnbindia|unionbankofindia|bankofindia|centralbankofindia|iob\.in|ucobank|rbi\.org|nabard\.org|sidbi\.in|ibpsonline|bank\.sbi|onlinesbi|sbi\.onlinesbi/i
      .test(location.hostname);
  }

  async function loadProfile() {
    try {
      const data = await chrome.storage.local.get(['profiles', 'activeProfileId']);
      const profiles = data.profiles || [];
      return profiles.find(function (p) { return p.id === data.activeProfileId; }) || profiles[0];
    } catch (e) {}
    return null;
  }

  function setNativeValue(el, value) {
    const proto = el.tagName === 'SELECT'
      ? window.HTMLSelectElement.prototype
      : (el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype);
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  // ── Get label text for an input ──
  function labelOf(el) {
    let t = '';
    if (el.id) {
      const l = document.querySelector('label[for="' + el.id + '"]');
      if (l) t += ' ' + (l.innerText || '');
    }
    if (el.closest('label')) t += ' ' + el.closest('label').innerText;
    t += ' ' + (el.placeholder || '');
    t += ' ' + (el.getAttribute('aria-label') || '');
    t += ' ' + (el.name || '');
    t += ' ' + (el.id || '');
    // Walk up for nearby text
    let p = el.parentElement;
    let hops = 0;
    while (p && hops < 3) {
      t += ' ' + (p.innerText || '').slice(0, 150);
      p = p.parentElement;
      hops++;
    }
    return t.toLowerCase();
  }

  // ── Is this input the LOCAL part of a split email? ──
  function isLocalEmailPart(el) {
    // Must be an input
    if (el.tagName !== 'INPUT') return false;
    // Skip if it's a domain part (usually has "domain" or is a select)
    const label = labelOf(el);
    if (!/email/i.test(label)) return false;
    // Check for split: look for a sibling with "@" or a domain select nearby
    let scope = el.parentElement;
    for (let hop = 0; hop < 4 && scope; hop++) {
      // Domain indicator
      if (scope.querySelector('select')) {
        // Check if any select has gmail/yahoo/domain options
        const selects = scope.querySelectorAll('select');
        for (let i = 0; i < selects.length; i++) {
          const opts = Array.from(selects[i].options || []);
          const hasDomain = opts.some(function (o) {
            return /gmail|yahoo|outlook|hotmail|rediff/i.test(o.text || '');
          });
          if (hasDomain) return true;
        }
      }
      // "@" text node or badge
      if (scope.textContent && scope.textContent.indexOf('@') !== -1 && scope.textContent.indexOf('@') < 30) return true;
      scope = scope.parentElement;
    }
    // Also: the input's immediate next sibling is a span/badge with "@"
    if (el.nextElementSibling) {
      const nxt = el.nextElementSibling;
      const t = (nxt.innerText || nxt.textContent || '').trim();
      if (t === '@' || t.indexOf('@') !== -1) return true;
    }
    return false;
  }

  // ── Split a full email into local + domain ──
  function splitEmail(email) {
    const e = String(email || '').trim();
    const at = e.indexOf('@');
    if (at === -1) return { local: e, domain: '' };
    return {
      local: e.slice(0, at),
      domain: e.slice(at + 1)
    };
  }

  // ── Set the domain part (via dropdown if possible) ──
  async function setDomainPart(localInput, domain) {
    if (!domain) return;
    const scope = localInput.parentElement ? localInput.parentElement.parentElement : null;
    if (!scope) return;

    // Try to find a select for the domain
    const selects = scope.querySelectorAll('select');
    for (let i = 0; i < selects.length; i++) {
      const sel = selects[i];
      const opts = Array.from(sel.options);
      const match = opts.find(function (o) {
        const txt = (o.text || '').trim().toLowerCase();
        const val = (o.value || '').trim().toLowerCase();
        const dom = domain.toLowerCase();
        return txt === dom || val === dom || txt.indexOf(dom) !== -1;
      });
      if (match) {
        try {
          setNativeValue(sel, match.value);
          sel.style.backgroundColor = '#d4edda';
          return;
        } catch (e) {}
      }
    }

    // No select — check for a read-only text input for domain
    const inputs = scope.querySelectorAll('input[type="text"], input:not([type])');
    for (let i = 0; i < inputs.length; i++) {
      if (inputs[i] === localInput) continue;
      const lbl = labelOf(inputs[i]);
      if (/domain|@/.test(lbl)) {
        try {
          setNativeValue(inputs[i], domain);
          inputs[i].style.backgroundColor = '#d4edda';
          return;
        } catch (e) {}
      }
    }
  }

  // ── Handle split email fields ──
  async function fixSplitEmails(profile) {
    if (!profile || !profile.fields || !profile.fields.email) return 0;
    const { local, domain } = splitEmail(profile.fields.email);
    if (!local) return 0;

    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input:not([type])');
    let fixed = 0;

    for (let i = 0; i < inputs.length; i++) {
      const inp = inputs[i];
      if (inp.disabled || inp.readOnly) continue;

      const current = (inp.value || '').trim();
      const looksLikeFullEmail = /@/.test(current);
      const label = labelOf(inp);

      // Case 1: input already has full email but is a split local part → fix it
      if (looksLikeFullEmail && isLocalEmailPart(inp)) {
        try {
          setNativeValue(inp, local);
          inp.style.backgroundColor = '#d4edda';
          fixed++;
          // Also set the domain side
          await setDomainPart(inp, domain);
        } catch (e) {}
        continue;
      }

      // Case 2: input is empty and it's a split local part → fill it
      if (!current && isLocalEmailPart(inp)) {
        try {
          setNativeValue(inp, local);
          inp.style.backgroundColor = '#d4edda';
          fixed++;
          await setDomainPart(inp, domain);
        } catch (e) {}
        continue;
      }

      // Case 3: input is the Confirm Email field and has full email → make sure
      if (/confirm.*email|email.*confirm|re.*enter.*email/i.test(label)) {
        if (current !== profile.fields.email) {
          try {
            setNativeValue(inp, profile.fields.email);
            inp.style.backgroundColor = '#d4edda';
            fixed++;
          } catch (e) {}
        }
      }
    }

    return fixed;
  }

  // ── Handle split mobile (STD code + number) — same idea ──
  async function fixSplitMobile(profile) {
    if (!profile || !profile.fields || !profile.fields.mobile) return 0;
    // Only relevant if a mobile field also looks split
    // Some banks have: [ STD code ] [ @ ] [ mobile ]
    // Detect: an input whose next sibling has "@" or "STD"
    return 0;
  }

  async function waitForFillToSettle() {
    const start = Date.now();
    let lastChange = Date.now();
    let lastCount = 0;
    let sawActivity = false;
    while (Date.now() - start < 12000) {
      const count = document.querySelectorAll('[data-egram-filled="1"]').length;
      if (count > 0) sawActivity = true;
      if (count !== lastCount) { lastCount = count; lastChange = Date.now(); }
      if (sawActivity && Date.now() - lastChange > 1500) return true;
      if (!sawActivity && Date.now() - start > 7000) return true;
      await sleep(250);
    }
    return true;
  }

  async function runFix() {
    if (!isBankForm()) return;
    await waitForFillToSettle();
    await sleep(400);

    const profile = await loadProfile();
    if (!profile) return;

    for (let attempt = 0; attempt < 4; attempt++) {
      let n = 0;
      n += await fixSplitEmails(profile);
      if (n > 0) {
        console.log('[bankingFix] fixed ' + n + ' split email/confirm fields');
        return;
      }
      await sleep(600);
    }
  }

  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg && msg.action === 'fill') {
      setTimeout(runFix, 400);
    }
  });
})();