// altMobileFix.js — clears Alternate Mobile when it matches Mobile
// Runs on every site. Idempotent. Safe.

(function () {
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  // ── Clean a phone number for comparison ──
  function digitsOnly(v) {
    return String(v || '').replace(/\D/g, '').replace(/^(91|0)+/, '');
  }

  // ── Is this input an "alternate" mobile field? ──
  function isAlternateField(input) {
    let ctx = '';
    if (input.id) {
      const l = document.querySelector('label[for="' + input.id + '"]');
      if (l) ctx += ' ' + (l.innerText || '');
    }
    if (input.closest('label')) ctx += ' ' + input.closest('label').innerText;
    ctx += ' ' + (input.placeholder || '');
    ctx += ' ' + (input.getAttribute('aria-label') || '');
    ctx += ' ' + (input.name || '') + ' ' + (input.id || '');
    // Walk up for nearby label text
    let p = input.parentElement;
    let hops = 0;
    while (p && hops < 3) {
      ctx += ' ' + (p.innerText || '').slice(0, 150);
      p = p.parentElement;
      hops++;
    }
    ctx = ctx.toLowerCase();
    return /alternat|alternative|secondary|other\s+number|second\s+number/.test(ctx) &&
           /mobile|phone|contact|number/.test(ctx);
  }

  // ── Is this input the PRIMARY mobile field? ──
  function isPrimaryMobileField(input) {
    let ctx = '';
    if (input.id) {
      const l = document.querySelector('label[for="' + input.id + '"]');
      if (l) ctx += ' ' + (l.innerText || '');
    }
    if (input.closest('label')) ctx += ' ' + input.closest('label').innerText;
    ctx += ' ' + (input.placeholder || '');
    ctx += ' ' + (input.getAttribute('aria-label') || '');
    ctx += ' ' + (input.name || '') + ' ' + (input.id || '');
    ctx = ctx.toLowerCase();

    // Must be mobile/phone, but NOT alternate/confirm
    if (!/mobile|phone|contact/.test(ctx)) return false;
    if (/alternat|alternative|secondary|confirm|verify|re[\s-]?enter/.test(ctx)) return false;
    return true;
  }

  // ── Clear an input properly (Angular/React-aware) ──
  function clearInput(input) {
    try {
      input.focus();
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, '');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('blur', { bubbles: true }));
      return true;
    } catch (e) { return false; }
  }

  // ── Main fix ──
  async function fixAlternateMobile() {
    const inputs = document.querySelectorAll('input[type="text"], input[type="tel"], input:not([type])');
    if (!inputs.length) return 0;

    // Find the primary mobile value(s) on the page
    const primaryValues = [];
    for (let i = 0; i < inputs.length; i++) {
      const inp = inputs[i];
      if (!inp.value || inp.value.trim().length === 0) continue;
      if (!isPrimaryMobileField(inp)) continue;
      primaryValues.push(digitsOnly(inp.value));
    }
    if (!primaryValues.length) return 0;

    let cleared = 0;

    // Now clear any alternate field whose value matches any primary
    for (let i = 0; i < inputs.length; i++) {
      const inp = inputs[i];
      if (inp.disabled || inp.readOnly) continue;
      if (!inp.value || inp.value.trim().length === 0) continue;
      if (!isAlternateField(inp)) continue;

      const altDigits = digitsOnly(inp.value);
      if (!altDigits) continue;

      // Same as any primary → clear it
      const isSame = primaryValues.some(function (p) { return p === altDigits; });
      if (!isSame) continue;

      if (clearInput(inp)) {
        inp.style.backgroundColor = '#fff3cd';
        inp.style.outline = '2px solid #f0ad4e';
        cleared++;

        // Add a hint next to the field (only once)
        if (!inp.dataset.altHintShown) {
          inp.dataset.altHintShown = '1';
          try {
            const hint = document.createElement('div');
            hint.textContent = '⚠ Type a DIFFERENT number (must not match the primary mobile)';
            hint.style.cssText = 'color:#856404;background:#fff3cd;border:1px solid #ffeeba;padding:4px 8px;border-radius:4px;font-size:11px;margin-top:4px;';
            const anchor = inp.parentElement;
            if (anchor) anchor.appendChild(hint);
          } catch (e) {}
        }
      }
    }

    return cleared;
  }

  // ── Wait for main fill to finish ──
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
      await sleep(200);
    }
    return true;
  }

  async function run() {
    await waitForFillToSettle();
    await sleep(400);

    // Retry up to 3 times — the site's own JS may rewrite the alt field after us
    for (let attempt = 0; attempt < 3; attempt++) {
      const n = await fixAlternateMobile();
      if (n > 0) {
        console.log('[altMobileFix] cleared ' + n + ' duplicate alternate number(s)');
      }
      await sleep(700);
    }
  }

  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg && msg.action === 'fill') {
      setTimeout(run, 400);
    }
  });
})();