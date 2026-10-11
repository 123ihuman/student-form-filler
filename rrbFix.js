// rrbFix.js — aggressive force-fix for RRB registration form

(function () {
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function isRrb() { return /rrbapply\.gov\.in/i.test(location.hostname); }

  async function loadProfile() {
    try {
      const data = await chrome.storage.local.get(['profiles', 'activeProfileId']);
      const profiles = data.profiles || [];
      return profiles.find(function (p) { return p.id === data.activeProfileId; }) || profiles[0];
    } catch (e) {}
    return null;
  }

  // ── Angular-aware value setter ──
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

  // ═══════════════════════════════════════════════════════════
  // FIX 1 — Country of Nationality → force "India"
  // ═══════════════════════════════════════════════════════════
  async function forceCountryOfNationality() {
    // Find the select inside the nationality block
    const allSelects = document.querySelectorAll('select');
    for (let i = 0; i < allSelects.length; i++) {
      const sel = allSelects[i];
      // Skip if already set to India
      if (sel.value && sel.value.toLowerCase() === 'india') return 1;

      // Look at options — must contain India
      const opts = Array.from(sel.options);
      const indiaOpt = opts.find(function (o) {
        return (o.text || '').trim().toLowerCase() === 'india';
      });
      if (!indiaOpt) continue;

      // Ensure this is the "country" select — check nearby label text
      let ctx = '';
      if (sel.id) {
        const l = document.querySelector('label[for="' + sel.id + '"]');
        if (l) ctx += ' ' + (l.innerText || '');
      }
      if (sel.closest('div')) ctx += ' ' + (sel.closest('div').innerText || '');
      if (sel.parentElement && sel.parentElement.parentElement) {
        ctx += ' ' + (sel.parentElement.parentElement.innerText || '');
      }
      if (!/country of nationality|nationality|राष्ट्रीयता/i.test(ctx)) continue;

      // Force select
      try {
        sel.value = indiaOpt.value;
        setNativeValue(sel, indiaOpt.value);
        sel.style.backgroundColor = '#d4edda';
        return 1;
      } catch (e) {}
    }

    // Fallback: also check for a custom input with that hint text
    const inputs = document.querySelectorAll('input[type="text"], input:not([type])');
    for (let i = 0; i < inputs.length; i++) {
      const inp = inputs[i];
      if (inp.value && inp.value.indexOf('Person of Indian origin') !== -1) {
        try {
          setNativeValue(inp, 'India');
          inp.style.backgroundColor = '#d4edda';
          return 1;
        } catch (e) {}
      }
    }

    return 0;
  }

  // ═══════════════════════════════════════════════════════════
  // FIX 2 — Force Date of Birth (Angular mydatepicker)
  // ═══════════════════════════════════════════════════════════
  async function forceDob(dobStr) {
    if (!dobStr) return 0;
    const d = new Date(dobStr);
    if (isNaN(d.getTime())) return 0;

    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const formatted = dd + '/' + mm + '/' + yyyy;

    // Find DOB target
    let target = null;
    const wrapper = document.querySelector('dp-date-picker[name="dateOfBirth"], dp-date-picker#prel_form_dateofbirth');
    if (wrapper) target = wrapper.querySelector('input');
    if (!target) target = document.querySelector('input[name="effectiveDate"]');
    if (!target) target = document.querySelector('input#jqueryEffectiveDate');

    if (target && (!target.value || target.value.trim().length === 0)) {
      // Attempt A: direct write (unlock readonly)
      try {
        const wasRO = target.readOnly;
        target.readOnly = false;
        target.removeAttribute('readonly');
        setNativeValue(target, formatted);
        if (wasRO) target.setAttribute('readonly', '');
        if (target.value && target.value.length > 0) return 1;
      } catch (e) {}

      // Attempt B: calendar flow
      try {
        const wasRO = target.readOnly;
        target.readOnly = false;
        target.removeAttribute('readonly');

        try { target.scrollIntoView({ block: 'center' }); } catch (e) {}
        try { target.focus(); } catch (e) {}
        try {
          target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
          target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
          target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        } catch (e) {}
        try { target.click(); } catch (e) {}

        await sleep(500);

        let picker = document.querySelector('.dp-popup, .dp-material, dp-date-picker .dp-popup');
        if (!picker && wrapper) {
          const icon = wrapper.querySelector('i, button, [class*="calendar"], svg');
          if (icon) {
            try { icon.click(); } catch (e) {}
            await sleep(500);
            picker = document.querySelector('.dp-popup, .dp-material');
          }
        }
        if (picker) {
          // Navigate to correct month
          const headerText = (picker.querySelector('.dp-calendar-month, [class*="month"]') || picker).innerText || '';
          const monthNames = ['january','february','march','april','may','june','july','august','september','october','november','december'];
          const lower = headerText.toLowerCase();
          let curMonth = -1;
          let curYear = new Date().getFullYear();
          for (let i = 0; i < monthNames.length; i++) {
            if (lower.indexOf(monthNames[i]) !== -1 || lower.indexOf(monthNames[i].slice(0, 3)) !== -1) { curMonth = i; break; }
          }
          const ym = headerText.match(/\b(20\d{2})\b/);
          if (ym) curYear = parseInt(ym[1], 10);

          const diff = (yyyy - curYear) * 12 + (d.getMonth() - curMonth);
          const nextBtn = picker.querySelector('.dp-next, [class*="next"], [aria-label*="next" i]');
          const prevBtn = picker.querySelector('.dp-prev, [class*="prev"], [aria-label*="prev" i]');
          for (let i = 0; i < Math.abs(diff); i++) {
            if (diff > 0 && nextBtn) nextBtn.click();
            else if (diff < 0 && prevBtn) prevBtn.click();
            await sleep(100);
          }
          // Click day
          const dayCells = picker.querySelectorAll('.dp-day, td, button, span');
          const wantDay = String(d.getDate());
          for (let i = 0; i < dayCells.length; i++) {
            if ((dayCells[i].innerText || '').trim() === wantDay) {
              try { dayCells[i].click(); } catch (e) {}
              await sleep(300);
              break;
            }
          }
        }

        if (wasRO) target.setAttribute('readonly', '');
        if (target.value && target.value.length > 0) return 1;
      } catch (e) {}
    }

    // Mirror to Re-type DOB
    let n = 0;
    if (target && target.value && target.value.length > 0) n = 1;

    // Find Re-type DOB and mirror
    const verifyTarget = document.querySelector('input[name="verifyDateOfBirth"], input[name="verifyEffectiveDate"], input[name="retypeDateOfBirth"]');
    if (verifyTarget && target && target.value && (!verifyTarget.value || verifyTarget.value.trim().length === 0)) {
      try {
        const wasRO = verifyTarget.readOnly;
        verifyTarget.readOnly = false;
        verifyTarget.removeAttribute('readonly');
        setNativeValue(verifyTarget, target.value);
        if (wasRO) verifyTarget.setAttribute('readonly', '');
        verifyTarget.style.backgroundColor = '#d4edda';
        n++;
      } catch (e) {}
    }

    return n;
  }

  // ═══════════════════════════════════════════════════════════
  // FIX 3 — Force-tick radios by question text
  // ═══════════════════════════════════════════════════════════
  function radioText(radio) {
    if (radio.id) {
      const l = document.querySelector('label[for="' + radio.id + '"]');
      if (l && l.innerText) return (l.innerText || '').trim().toLowerCase();
    }
    const wrap = radio.closest('label');
    if (wrap && wrap.innerText) return (wrap.innerText || '').trim().toLowerCase();
    if (radio.nextElementSibling) {
      const t = (radio.nextElementSibling.innerText || radio.nextElementSibling.textContent || '').trim().toLowerCase();
      if (t) return t;
    }
    return String(radio.value || '').toLowerCase().trim();
  }

  function optionMatches(optText, wanted) {
    const o = (optText || '').toLowerCase().trim();
    const w = (wanted || '').toLowerCase().trim();
    if (!o || !w) return false;
    if (o === w) return true;
    if (w === 'yes' && /^(yes|y|haan|हाँ|हां)$/.test(o)) return true;
    if (w === 'no'  && /^(no|n|nahi|नहीं)$/.test(o)) return true;
    return false;
  }

  function clickRadio(radio) {
    if (radio.checked) return 1;
    try {
      const wrap = radio.closest('label');
      if (wrap) wrap.click();
      else radio.click();
    } catch (e) {}
    if (!radio.checked) {
      radio.checked = true;
      radio.dispatchEvent(new Event('input', { bubbles: true }));
      radio.dispatchEvent(new Event('change', { bubbles: true }));
      radio.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    }
    radio.style.outline = '2px solid #28a745';
    return radio.checked ? 1 : 0;
  }

  function forceRadio(questionSubstring, wantedAnswer) {
    const q = String(questionSubstring || '').toLowerCase().trim();
    const w = String(wantedAnswer || '').toLowerCase().trim();
    if (!q || !w) return 0;

    const candidates = document.querySelectorAll('label, legend, .form-label, h4, h5, h6, div, span, p');
    for (let i = 0; i < candidates.length; i++) {
      const el = candidates[i];
      if (el.children.length > 8) continue;
      const txt = (el.innerText || '').toLowerCase();
      if (txt.length > 250) continue;
      if (txt.indexOf(q) === -1) continue;

      if (el.tagName === 'LABEL' && el.getAttribute('for')) {
        const forId = el.getAttribute('for');
        const radios = document.querySelectorAll(
          'input[type="radio"][name="' + forId + '"], input[type="radio"][id^="' + forId + '"]'
        );
        for (let r = 0; r < radios.length; r++) {
          if (optionMatches(radioText(radios[r]), w)) return clickRadio(radios[r]);
        }
      }

      let container = el;
      for (let hop = 0; hop < 6 && container; hop++) {
        const radios = container.querySelectorAll('input[type="radio"]');
        if (radios.length > 0 && radios.length <= 6) {
          for (let r = 0; r < radios.length; r++) {
            if (optionMatches(radioText(radios[r]), w)) return clickRadio(radios[r]);
          }
        }
        container = container.parentElement;
      }
    }
    return 0;
  }

  // ═══════════════════════════════════════════════════════════
  // MAIN — run all fixes
  // ═══════════════════════════════════════════════════════════
  async function waitForFillToSettle() {
    const start = Date.now();
    let lastChange = Date.now();
    let lastCount = 0;
    let sawActivity = false;
    while (Date.now() - start < 12000) {
      const count = document.querySelectorAll('[data-egram-filled="1"]').length;
      if (count > 0) sawActivity = true;
      if (count !== lastCount) { lastCount = count; lastChange = Date.now(); }
      if (sawActivity && Date.now() - lastChange > 1800) return true;
      if (!sawActivity && Date.now() - start > 7000) return true;
      await sleep(250);
    }
    return true;
  }

  async function runFix() {
    if (!isRrb()) return;

    await waitForFillToSettle();
    await sleep(500);

    const profile = await loadProfile();
    if (!profile || !profile.fields) return;
    const f = profile.fields;

    for (let attempt = 0; attempt < 5; attempt++) {
      let n = 0;

      // Fix 1 — Country
      n += await forceCountryOfNationality();

      // Fix 2 — DOB + mirror
      if (f.dob) n += await forceDob(f.dob);

      // Fix 3 — Radios
      n += forceRadio('certificate of eligibility', f.certificateOfEligibility || 'no');
      await sleep(150);
      n += forceRadio('have you changed your name', f.changedName || 'No');

      if (n >= 3) {
        console.log('[rrbFix] all 3 issues fixed (' + n + ' actions)');
        return;
      }
      await sleep(700);
    }
  }

  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg && msg.action === 'fill') {
      setTimeout(runFix, 400);
    }
  });
})();