// sscFormFix.js — direct name-based fill for ssc.gov.in labels rendered empty

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
    const proto = el.tagName === 'SELECT'
      ? window.HTMLSelectElement.prototype
      : (el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype);
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  // Map SSC field names → profile keys
  const NAME_MAP = {
    userName:         'fullName',
    userNameVerify:   'fullName',
    mobileNo:         'mobile',
    userEmail:        'email',
    fatherName:       'fatherName',
    fatherNameVerify: 'fatherName',
    motherName:       'motherName',
    motherNameVerify: 'motherName',
    aadhaarNumber:    'aadhaarNumber',
    aadhaarNumberVerify: 'aadhaarNumber',
    rollNumber:       'tenthRollNumber',
    rollNumberVerify: 'tenthRollNumber',
    yearOfPassing:    'tenthYear',
    yearOfPassingVerify: 'tenthYear'
  };

  async function fillByName(profile) {
    if (!profile || !profile.fields) return 0;
    const f = profile.fields;
    let n = 0;

    const keys = Object.keys(NAME_MAP);
    for (let i = 0; i < keys.length; i++) {
      const sscName = keys[i];
      const profileKey = NAME_MAP[sscName];
      const value = f[profileKey];
      if (!value) continue;

            // Try exact name first
      let el = document.querySelector('input[name="' + sscName + '"], textarea[name="' + sscName + '"]');

      // Fallback: name contains the key (handles different casing)
      if (!el) {
        el = Array.from(document.querySelectorAll('input, textarea')).find(function (i) {
          const n = (i.name || '').toLowerCase();
          return n === sscName.toLowerCase() || n.indexOf(sscName.toLowerCase()) !== -1;
        });
      }

      if (!el) continue;
      if (el.disabled || el.readOnly) continue;
      if (el.value && el.value.trim().length > 0) continue;

      try {
        // Mobile field sometimes has a mask; strip spaces
        let v = String(value);
        if (sscName === 'mobileNo') v = v.replace(/\D/g, '');

        setNativeValue(el, v);
        el.style.backgroundColor = '#d4edda';
        el.dataset.egramFilled = '1';
        n++;
      } catch (e) {}
    }
    return n;
  }

    // Special handling: fill fields by aria-describedby (SSC label IDs)
  async function fillByAriaDescribedBy(profile) {
    if (!profile || !profile.fields) return 0;
    const f = profile.fields;
    let n = 0;

    // Map aria-describedby value → profile key
    // Both "userName" and "userNameVerify" → fullName (Verify gets same value directly)
    const map = {
      'userName':         'fullName',
      'userNameVerify':   'fullName',
      'mobileInfo':       'mobile',
      'mobileInfoVerify': 'mobile',
      'userEmail':        'email',
      'userEmailVerify':  'email',
      'fatherName':       'fatherName',
      'fatherNameVerify': 'fatherName',
      'motherName':       'motherName',
      'motherNameVerify': 'motherName'
    };

    for (const descId in map) {
      const value = f[map[descId]];
      if (!value) continue;

      // Try exact aria-describedby match
      let el = document.querySelector('input[aria-describedby="' + descId + '"], textarea[aria-describedby="' + descId + '"]');

      // Fallback: match by partial aria-describedby containing the id
      if (!el) {
        el = Array.from(document.querySelectorAll('input, textarea')).find(function (i) {
          const ad = i.getAttribute('aria-describedby') || '';
          return ad === descId || ad.split(/\s+/).indexOf(descId) !== -1;
        });
      }

      if (!el) continue;
      if (el.disabled || el.readOnly) continue;
      if (el.value && el.value.trim().length > 0) continue;

      try {
        let v = String(value);
        if (descId === 'mobileInfo' || descId === 'mobileInfoVerify') v = v.replace(/\D/g, '');

        setNativeValue(el, v);
        el.style.backgroundColor = '#d4edda';
        el.dataset.egramFilled = '1';
        n++;
        console.log('[sscFormFix] filled by aria:', descId, '=', v);
      } catch (e) {}
    }
    return n;
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
      await sleep(200);
    }
    return true;
  }
  // Fallback: fill by nearby hint text (SSC shows "1. Candidate Name should be same..." below)
  async function fillByHintText(profile) {
    if (!profile || !profile.fields) return 0;
    const f = profile.fields;
    let n = 0;

    // Pairs of [hint regex, profile key, which occurrence (1st = main, 2nd = verify)]
    const patterns = [
      { re: /candidate name should be same/i, key: 'fullName', index: 0 },
      { re: /candidate name should be same/i, key: 'fullName', index: 1 },
      { re: /father.{0,5}s? name should be same/i, key: 'fatherName', index: 0 },
      { re: /father.{0,5}s? name should be same/i, key: 'fatherName', index: 1 },
      { re: /mother.{0,5}s? name should be same/i, key: 'motherName', index: 0 },
      { re: /mother.{0,5}s? name should be same/i, key: 'motherName', index: 1 }
    ];

    // Collect all hint elements
    const hints = document.querySelectorAll('small, .form-text, .help-text, .text-muted');

    for (let p = 0; p < patterns.length; p++) {
      const pat = patterns[p];
      const value = f[pat.key];
      if (!value) continue;

      const matchingHints = Array.from(hints).filter(function (h) {
        return pat.re.test(h.innerText || '');
      });
      if (matchingHints.length <= pat.index) continue;

      const targetHint = matchingHints[pat.index];

      // Find the nearest preceding input
      let el = targetHint.previousElementSibling;
      let hops = 0;
      while (el && hops < 8) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') break;
        el = el.previousElementSibling;
        hops++;
      }
      if (!el) {
        // Try walking up the DOM
        let parent = targetHint.parentElement;
        let upHops = 0;
        while (parent && upHops < 4 && !el) {
          const inputs = parent.querySelectorAll('input, textarea');
          for (let i = inputs.length - 1; i >= 0; i--) {
            if (inputs[i].value && inputs[i].value.trim().length === 0) {
              el = inputs[i];
              break;
            }
          }
          parent = parent.parentElement;
          upHops++;
        }
      }

      if (!el) continue;
      if (el.disabled || el.readOnly) continue;
      if (el.value && el.value.trim().length > 0) continue;

      try {
        setNativeValue(el, String(value));
        el.style.backgroundColor = '#d4edda';
        el.dataset.egramFilled = '1';
        n++;
      } catch (e) {}
    }
    return n;
  }

  async function runFix() {
    if (!isSsc()) return;

    await waitForFillToSettle();
    await sleep(500);

    const profile = await loadProfile();

        for (let attempt = 0; attempt < 4; attempt++) {
      let n = 0;
      n += await fillByName(profile);
      n += await fillByAriaDescribedBy(profile);
      n += await fillByHintText(profile);
      if (n > 0) {
        console.log('[sscFormFix] filled ' + n + ' SSC fields');
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