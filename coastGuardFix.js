// coastGuardFix.js — Indian Coast Guard (cgept.parikshasaarthi.in) site fixes

(function () {
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function isCgForm() {
    return /parikshasaarthi\.in|indiancoastguard|cgept\./i.test(location.hostname);
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

  function labelOf(el) {
    let t = '';
    if (el.id) {
      const l = document.querySelector('label[for="' + el.id + '"]');
      if (l) t += ' ' + (l.innerText || '');
    }
    if (el.closest('label')) t += ' ' + el.closest('label').innerText;
    t += ' ' + (el.placeholder || '');
    t += ' ' + (el.getAttribute('aria-label') || '');
    t += ' ' + (el.name || '') + ' ' + (el.id || '');
    let p = el.parentElement;
    let hops = 0;
    while (p && hops < 3) {
      t += ' ' + (p.innerText || '').slice(0, 150);
      p = p.parentElement;
      hops++;
    }
    return t.toLowerCase();
  }

    // ── FIX 1: Prefix dropdown (Mr. / Ms. / Mrs.) based on gender ──
  async function fixPrefixDropdown(profile) {
    if (!profile || !profile.fields) return 0;
    const gender = (profile.fields.gender || '').toLowerCase();
    let wanted = null;
    if (gender === 'male' || gender === 'm') wanted = 'mr';
    else if (gender === 'female' || gender === 'f') wanted = 'ms';
    if (!wanted) return 0;

    // Exact target from diagnostic
    let sel = document.querySelector('#prefixDropdown, select[name="namePrefix"]');
    if (!sel) {
      // Fallback — find any select with Mr./Ms. options
      const all = document.querySelectorAll('select');
      for (let i = 0; i < all.length; i++) {
        const opts = Array.from(all[i].options || []);
        if (opts.some(function (o) { return /^mr\.?$/i.test((o.text || '').trim()); }) &&
            opts.some(function (o) { return /^mrs?\.?$/i.test((o.text || '').trim()); })) {
          sel = all[i];
          break;
        }
      }
    }
    if (!sel) return 0;

    const opts = Array.from(sel.options);
    let chosen = null;
    for (let i = 0; i < opts.length; i++) {
      const t = (opts[i].text || '').trim().toLowerCase().replace(/\./g, '');
      if (wanted === 'mr' && t === 'mr') { chosen = opts[i]; break; }
      if (wanted === 'ms' && (t === 'ms' || t === 'mrs')) { chosen = opts[i]; break; }
    }
    if (chosen) {
      setNativeValue(sel, chosen.value);
      sel.style.backgroundColor = '#d4edda';
      return 1;
    }
    return 0;
  }

    // ── FIX 2: Candidate's Name input ──
  async function fixCandidateName(profile) {
    if (!profile || !profile.fields || !profile.fields.fullName) return 0;

    // Exact target from diagnostic
    let inp = document.querySelector('#selfName, input[name="selfName"]');

    if (!inp) {
      // Fallback — scan for input near "Candidate's Name"
      const inputs = document.querySelectorAll('input[type="text"], input:not([type])');
      for (let i = 0; i < inputs.length; i++) {
        const el = inputs[i];
        if (el.disabled || el.readOnly) continue;
        const label = labelOf(el);
        if (!/candidate.?s?\s*name|candidate name|name.*as per/i.test(label)) continue;
        if (/father|mother|email|gender/i.test(label)) continue;
        inp = el;
        break;
      }
    }
    if (!inp) return 0;
    if (inp.value && inp.value.trim().length > 0) return 1; // already filled

    try {
      setNativeValue(inp, profile.fields.fullName);
      inp.style.backgroundColor = '#d4edda';
      return 1;
    } catch (e) {}
    return 0;
  }

  // ── FIX 3: Force-tick radios by option text ──
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
    if (w === 'female' && /^(female|f|woman|girl)$/.test(o)) return true;
    if (w === 'male' && /^(male|m|man|boy)$/.test(o)) return true;
    if (w === 'indian' && /^(indian|india)$/.test(o)) return true;
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

  // Find radios grouped under a question heading
  function forceRadioByQuestion(questionRegex, wanted) {
    const labels = document.querySelectorAll('label, legend, h4, h5, h6, .form-label, div, span, p');
    for (let i = 0; i < labels.length; i++) {
      const el = labels[i];
      if (el.children.length > 6) continue;
      const txt = (el.innerText || '').toLowerCase();
      if (txt.length > 200) continue;
      if (!questionRegex.test(txt)) continue;

      // Find nearby radios
      let container = el;
      for (let hop = 0; hop < 5 && container; hop++) {
        const radios = container.querySelectorAll('input[type="radio"]');
        if (radios.length > 0 && radios.length <= 6) {
          for (let r = 0; r < radios.length; r++) {
            if (optionMatches(radioText(radios[r]), wanted)) {
              return clickRadio(radios[r]);
            }
          }
        }
        container = container.parentElement;
      }
    }
    return 0;
  }
  // ── Force-tick a radio group by its name attribute ──
  function forceRadioByName(nameValue, wanted) {
    const radios = document.querySelectorAll('input[type="radio"][name="' + nameValue + '"]');
    if (!radios.length) return 0;
    for (let i = 0; i < radios.length; i++) {
      const r = radios[i];
      const val = (r.value || '').toLowerCase().trim();
      const txt = radioText(r);
      if (optionMatches(val, wanted) || optionMatches(txt, wanted)) {
        return clickRadio(r);
      }
    }
    return 0;
  }

     // ── FIX 4: "Where did you get information" dropdown ──
  async function fixInfoSourceDropdown(profile) {
    const wanted = (profile && profile.fields && profile.fields.infoSource) || 'Official ICG website';

    // Exact target from diagnostic
    const sel = document.querySelector('#socialDropdown, select[name="sourceOfInformation"]');
    if (!sel) return 0;

    const opts = Array.from(sel.options);
    if (!opts.length) return 0;

    // Filter out placeholder options (any dash + "select" text, or empty)
    const validOpts = opts.filter(function (o) {
      const t = (o.text || '').trim().toLowerCase();
      if (!t) return false;
      // Match: "-- Select --", "– Select –", "- Select -", "select", "choose"
      if (/^[\-\u2010-\u2015\s]*select[\s\-\u2010-\u2015]*$/i.test(t)) return false;
      if (/^choose$/i.test(t)) return false;
      return true;
    });
    if (!validOpts.length) return 0;

    // Find best match
    let chosen = validOpts.find(function (o) {
      return (o.text || '').trim().toLowerCase() === wanted.toLowerCase();
    });
    if (!chosen) {
      chosen = validOpts.find(function (o) {
        return (o.text || '').toLowerCase().indexOf(wanted.toLowerCase()) !== -1;
      });
    }
    if (!chosen) {
      // Fallback: any valid option
      chosen = validOpts[0];
    }
    if (!chosen) return 0;

    // Skip if already selected
    if (sel.value === chosen.value) return 1;

    // Force set via every method
    try {
      sel.selectedIndex = opts.indexOf(chosen);
      sel.value = chosen.value;

      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
      setter.call(sel, chosen.value);

      sel.dispatchEvent(new Event('input', { bubbles: true }));
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      sel.dispatchEvent(new Event('blur', { bubbles: true }));
      sel.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      sel.style.backgroundColor = '#d4edda';
      return 1;
    } catch (e) {}
    return 0;
  }
  // ── Wait for main fill ──
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
    if (!isCgForm()) return;
    await waitForFillToSettle();
    await sleep(500);

    const profile = await loadProfile();
    if (!profile) return;

    for (let attempt = 0; attempt < 4; attempt++) {
      let n = 0;

      // Prefix dropdown (Mr. / Ms.)
      n += await fixPrefixDropdown(profile);
      await sleep(200);

      // Candidate's Name text input
      n += await fixCandidateName(profile);
      await sleep(200);

            // Nationality → Indian (direct name target)
      n += forceRadioByName('nationality', 'indian') ||
           forceRadioByQuestion(/\bnationality\b/i, 'indian');
      await sleep(200);

      // Gender → from profile
      const gender = (profile.fields && profile.fields.gender || 'female').toLowerCase();
      n += forceRadioByName('gender', gender) ||
           forceRadioByQuestion(/\bgender\b/i, gender);
      await sleep(200);

      // Info source dropdown
      n += await fixInfoSourceDropdown(profile);

            if (n >= 5) {
        console.log('[coastGuardFix] fixed ' + n + ' fields');
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