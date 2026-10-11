// cbseitmsFix.js — site-specific overrides for cbseitms.nic.in (name + any other stubborn field)

(function () {
  // No guard — allow re-injection on every fill. runFix is idempotent.

  function sleep(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  function isCbseItms() {
    return /cbseitms\.nic\.in/.test(location.hostname);
  }

  async function loadProfile() {
    try {
      const data = await chrome.storage.local.get(['profiles', 'activeProfileId']);
      const profiles = data.profiles || [];
      return profiles.find(function (p) { return p.id === data.activeProfileId; }) || profiles[0];
    } catch (e) {}
    return null;
  }

  function setValueProperly(input, value) {
    try {
      input.focus();
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(input, String(value));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('blur', { bubbles: true }));
      return true;
    } catch (e) {
      return false;
    }
  }

  // Map cbseitms field IDs → profile keys
  const FIELD_OVERRIDES = {
    'NameOfCandidate': 'fullName',
    'FatherName':      'fatherName',
    'MotherName':      'motherName',
    'MobileNo':        'mobile',
    'AlternateMobileNo': 'alternateMobile',
    'Email':           'email',
    'EmailId':         'email',
    'IdentificationMark': 'identificationMark'
  };

  async function fillOverrides(profile) {
    if (!profile || !profile.fields) return 0;
    let filledCount = 0;

    const keys = Object.keys(FIELD_OVERRIDES);
    for (let i = 0; i < keys.length; i++) {
      const inputId = keys[i];
      const profileKey = FIELD_OVERRIDES[inputId];
      const value = profile.fields[profileKey];
      if (!value) continue;

      const input = document.getElementById(inputId);
      if (!input) continue;
      if (input.disabled || input.readOnly) continue;

      // Skip if already has a value
      if (input.value && input.value.trim().length > 0) continue;

      const ok = setValueProperly(input, value);
      if (ok) {
        input.style.backgroundColor = '#d4edda';
        // Clear any stale AI markers so future scans don't reprocess
        try { delete input.dataset.egramAIId; } catch (e) {}
        try { delete input.dataset.egramAiId; } catch (e) {}
        filledCount++;
      }
    }
    return filledCount;
  }

  async function waitForFillToSettle() {
    const start = Date.now();
    let lastChange = Date.now();
    let lastCount = 0;
    let sawActivity = false;

    while (Date.now() - start < 15000) {
      const count = document.querySelectorAll('[data-egram-filled="1"]').length;
      if (count > 0) sawActivity = true;
      if (count !== lastCount) {
        lastCount = count;
        lastChange = Date.now();
      }
      if (sawActivity && Date.now() - lastChange > 2000) return true;
      if (!sawActivity && Date.now() - start > 8000) return true;
      await sleep(250);
    }
    return true;
  }

  async function runFix() {
    if (!isCbseItms()) return;

    await waitForFillToSettle();
    await sleep(600);

    const profile = await loadProfile();

    // Up to 3 attempts, 700ms apart
    for (let attempt = 0; attempt < 3; attempt++) {
      const n = await fillOverrides(profile);
      if (n > 0) {
        console.log('[cbseitmsFix] filled ' + n + ' override field(s)');
        return;
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