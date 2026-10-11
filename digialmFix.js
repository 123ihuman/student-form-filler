// digialmFix.js — direct-ID fill for cdn*.digialm.com forms (JPSC, many state exams)

(function () {
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function isDigialm() { return /digialm\.com/i.test(location.hostname); }

  async function loadProfile() {
    try {
      const d = await chrome.storage.local.get(['profiles', 'activeProfileId']);
      const profiles = d.profiles || [];
      return profiles.find(function (p) { return p.id === d.activeProfileId; }) || profiles[0];
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
    el.dispatchEvent(new Event('keyup', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    // ⚡ Do NOT fire blur — their onblur validator wipes the field
  }

  // Map digialm input IDs → profile keys
  const ID_MAP = {
    txtAppName:         'fullName',
    txtName:            'fullName',
    txtFatherName:      'fatherName',
    txtMotherName:      'motherName',
    txtMobile:          'mobile',
    txtMobileNo:        'mobile',
    txtEmail:           'email',
    txtEmailId:         'email',
    txtAddress1:        'addressLine1',
    txtAddress2:        'addressLine2',
    txtAddress3:        'addressLine3',
    txtPin:             'pincode',
    txtPincode:         'pincode',
    txtAadhaar:         'aadhaarNumber',
    txtAadhaarNo:       'aadhaarNumber',
    txtDOB:             'dob',
    txtRegistrationNo:  'tenthRegistrationNumber',
    txtRollNo:          'tenthRollNumber'
  };

  async function fillByID(profile) {
    if (!profile || !profile.fields) return 0;
    const f = profile.fields;
    let n = 0;

    const ids = Object.keys(ID_MAP);
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const profileKey = ID_MAP[id];
      const value = f[profileKey];
      if (!value) continue;

      const el = document.getElementById(id) ||
                 document.querySelector('input[name="' + id + '"]');
      if (!el) continue;
      if (el.disabled || el.readOnly) continue;

      // Skip if already correct
      const cur = (el.value || '').trim();
      let v = String(value).trim();
      if (id === 'txtMobile' || id === 'txtMobileNo') v = v.replace(/\D/g, '').slice(0, 10);
      if (cur === v) continue;

      try {
        el.focus();
        setNativeValue(el, v);
        el.style.backgroundColor = '#d4edda';
        el.style.outline = '2px solid #28a745';
        el.dataset.egramFilled = '1';
        n++;
        console.log('[digialmFix] filled #' + id + ' = ' + v);
      } catch (e) {}
    }
    return n;
  }

  // Also fill confirm fields by mirroring
  async function mirrorConfirm(profile) {
    if (!profile || !profile.fields) return 0;
    const f = profile.fields;
    let n = 0;

    const pairs = [
      ['txtAppName',      ['txtAppNameConfirm', 'txtConfirmAppName', 'txtNameConfirm']],
      ['txtMobile',       ['txtMobileConfirm', 'txtConfirmMobile']],
      ['txtEmail',        ['txtEmailConfirm', 'txtConfirmEmail']],
      ['txtFatherName',   ['txtFatherNameConfirm', 'txtConfirmFatherName']],
      ['txtMotherName',   ['txtMotherNameConfirm', 'txtConfirmMotherName']]
    ];

    for (let p = 0; p < pairs.length; p++) {
      const srcId = pairs[p][0];
      const src = document.getElementById(srcId) || document.querySelector('input[name="' + srcId + '"]');
      if (!src || !src.value) continue;

      for (let t = 0; t < pairs[p][1].length; t++) {
        const tid = pairs[p][1][t];
        const target = document.getElementById(tid) || document.querySelector('input[name="' + tid + '"]');
        if (!target) continue;
        if (target.disabled || target.readOnly) continue;
        if (target.value && target.value.trim() === src.value.trim()) continue;

        try {
          target.focus();
          setNativeValue(target, src.value);
          target.style.backgroundColor = '#d4edda';
          target.style.outline = '2px solid #28a745';
          target.dataset.egramFilled = '1';
          n++;
        } catch (e) {}
      }
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

  async function run() {
    if (!isDigialm()) return;
    await waitForFillToSettle();
    await sleep(500);

    const profile = await loadProfile();

    // 4 attempts — some fields are re-rendered by Angular/re-validated
    for (let i = 0; i < 4; i++) {
      let n = 0;
      n += await fillByID(profile);
      n += await mirrorConfirm(profile);
      if (n > 0) console.log('[digialmFix] attempt ' + (i + 1) + ': filled ' + n + ' field(s)');
      await sleep(700);
    }
  }

  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg && msg.action === 'fill') {
      setTimeout(run, 400);
    }
  });
})();