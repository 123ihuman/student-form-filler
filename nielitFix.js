// nielitFix.js — exact dropdown fill for student.nielit.gov.in

(function () {

  function sleep(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  function isNielit() {
    return /nielit\.gov\.in/.test(location.hostname);
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
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
    setter.call(el, value);
  }

  function pickOptionByText(selectEl, targetText) {
    if (!selectEl || !targetText) return false;
    const target = String(targetText).toLowerCase().trim();
    const opts = Array.from(selectEl.options);

    // Strategy 1: exact match (before "/" split)
    for (let i = 0; i < opts.length; i++) {
      const first = (opts[i].text || '').split('/')[0].trim().toLowerCase();
      if (first === target) return commit(selectEl, opts[i]);
    }
    // Strategy 2: exact match (full text)
    for (let i = 0; i < opts.length; i++) {
      const t = (opts[i].text || '').trim().toLowerCase();
      if (t === target) return commit(selectEl, opts[i]);
    }
    // Strategy 3: substring either direction
    for (let i = 0; i < opts.length; i++) {
      const t = (opts[i].text || '').trim().toLowerCase();
      if (t.indexOf(target) !== -1 || target.indexOf(t) !== -1) return commit(selectEl, opts[i]);
    }
    return false;
  }

  function commit(selectEl, option) {
    try {
      selectEl.value = option.value;
      setNativeValue(selectEl, option.value);
      selectEl.dispatchEvent(new Event('input', { bubbles: true }));
      selectEl.dispatchEvent(new Event('change', { bubbles: true }));
      selectEl.style.backgroundColor = '#d4edda';
      return true;
    } catch (e) {
      return false;
    }
  }

  // Map NIELIT select ID → profile key
  const SELECT_MAP = {
    'ddlSalutaionName':   'salutation',
    'ddl_gender':         'gender',
    'ddlCategory':        'category',
    'ddlOccupation':      'occupation',
    'ddlCorState':        'state',
    'Ddldistrict':        'district',
    'DDLeducode':         'highestQualification',
    'DdlExamCycle':       'appliedForExamination',
    'DdlApplied4Exam':    'examName',
    'DdlExamCentreState1':'examCentreState1',
    'DdlExamCentre1':     'examCentre1',
    'DdlExamCentreState2':'examCentreState2',
    'DdlExamCentre2':     'examCentre2',
    'ddlConsentRelation': 'consentRelation',
    'ddlAuthMode':        'consentProviderAuthenticationMode'
  };

  // Text-input IDs → profile keys
  const TEXT_MAP = {
    'txtName':       'fullName',
    'txtFatherName': 'fatherName',
    'txtMotherName': 'motherName',
    'txtMobile':     'mobile',
    'txtEmail':      'email',
    'txtAddress1':   'addressLine1',
    'txtAddress2':   'addressLine2',
    'txtAddress3':   'addressLine3',
    'txtPinCode':    'pincode',
    'txtAadhaar':    'aadhaarNumber',
    'txtApaarId':    'apaarId',
    'txtConsentPlace': 'consentPlace'
  };

  function setTextValue(input, value) {
    try {
      input.focus();
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(input, String(value));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('blur', { bubbles: true }));
      input.style.backgroundColor = '#d4edda';
      return true;
    } catch (e) {
      return false;
    }
  }

  async function fillAllDropdowns(profile) {
    if (!profile || !profile.fields) return 0;
    const f = profile.fields;
    let n = 0;

    const ids = Object.keys(SELECT_MAP);
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const key = SELECT_MAP[id];
      const value = f[key];
      if (!value) continue;

      const el = document.getElementById(id);
      if (!el) continue;
      if (el.disabled) continue;

      // Skip if already has non-placeholder value
      const cur = (el.options[el.selectedIndex] || {}).text || '';
      if (cur && !/^-+ ?select/i.test(cur.trim()) && !/please select/i.test(cur)) continue;

      if (pickOptionByText(el, value)) n++;
    }
    return n;
  }

  async function fillAllText(profile) {
    if (!profile || !profile.fields) return 0;
    const f = profile.fields;
    let n = 0;

    const ids = Object.keys(TEXT_MAP);
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const key = TEXT_MAP[id];
      const value = f[key];
      if (!value) continue;

      const el = document.getElementById(id);
      if (!el) continue;
      if (el.disabled || el.readOnly) continue;
      if (el.value && el.value.trim().length > 0) continue;

      if (setTextValue(el, value)) n++;
    }
    return n;
  }

  async function tickConsent() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    let n = 0;

    for (let i = 0; i < checkboxes.length; i++) {
      const cb = checkboxes[i];
      if (cb.disabled) continue;

      let ctx = '';
      if (cb.id) {
        const l = document.querySelector('label[for="' + cb.id + '"]');
        if (l) ctx += ' ' + (l.innerText || '');
      }
      const wrap = cb.closest('label');
      if (wrap) ctx += ' ' + (wrap.innerText || '');
      if (cb.parentElement) ctx += ' ' + (cb.parentElement.innerText || '');
      ctx = ctx.toLowerCase();

      const isConsent = /agree|consent|declare|declaration|authenticate|authorise|authorize|undertake|i hereby|i have read|terms and conditions|voluntarily give|hereby voluntarily|give my consent/i.test(ctx);
      if (!isConsent) continue;

      if (cb.checked) continue;

      try {
        const lbl = cb.closest('label');
        if (lbl) lbl.click();
        else cb.click();
        if (!cb.checked) {
          cb.checked = true;
          cb.dispatchEvent(new Event('change', { bubbles: true }));
        }
        cb.style.backgroundColor = '#d4edda';
        n++;
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
    if (!isNielit()) return;

    await waitForFillToSettle();
    await sleep(500);

    const profile = await loadProfile();

    // 3 attempts — later passes catch fields the site resets
    for (let attempt = 0; attempt < 3; attempt++) {
      const a = await fillAllText(profile);
      const b = await fillAllDropdowns(profile);
      const c = await tickConsent();
      if (a + b + c > 0) {
        console.log('[nielitFix] filled ' + a + ' text, ' + b + ' selects, ' + c + ' checkboxes');
      }
      await sleep(700);
    }
  }

      // ---- Force-tick consent checkboxes (7.1 APAAR + 8 Declaration) the RIGHT way ----
  async function forceTickApaarConsent() {
    const cbs = document.querySelectorAll('input[type="checkbox"]');
    let ticked = 0;

    for (let i = 0; i < cbs.length; i++) {
      const cb = cbs[i];
      if (cb.disabled) continue;

      // Gather nearby text
      let text = '';
      if (cb.id) {
        const lbl = document.querySelector('label[for="' + cb.id + '"]');
        if (lbl) text += ' ' + (lbl.innerText || '');
      }
      const wrap = cb.closest('label');
      if (wrap) text += ' ' + (wrap.innerText || '');
      if (cb.parentElement) text += ' ' + (cb.parentElement.innerText || '');
      if (cb.parentElement && cb.parentElement.parentElement) {
        text += ' ' + (cb.parentElement.parentElement.innerText || '');
      }
      text = text.toLowerCase();

      // Match consent / declaration / APAAR wording
      const isConsent =
        /apaar|aadhaar|aadhar|voluntarily give my consent|hereby voluntarily|give my consent to nielit|hereby declare|i hereby declare|particulars submitted/i.test(text);
      if (!isConsent) continue;

      // Already ticked → nothing to do
      if (cb.checked) continue;

      // ── Approach: click the <label> element (native, lets CSS update) ──
      try {
        // Pattern A: label wraps input
        const wrappingLabel = cb.closest('label');
        if (wrappingLabel) {
          wrappingLabel.click();
        } else {
          // Pattern B: label[for=id] is a sibling
          if (cb.id) {
            const forLabel = document.querySelector('label[for="' + cb.id + '"]');
            if (forLabel) {
              forLabel.click();
            } else {
              // Pattern C: direct click on the input
              cb.click();
            }
          } else {
            cb.click();
          }
        }
      } catch (e) {}

      // Give the site's handler a moment
      await sleep(80);

      // Verify — if still not checked, force state + fire events
      if (!cb.checked) {
        try {
          cb.checked = true;
          cb.dispatchEvent(new Event('input', { bubbles: true }));
          cb.dispatchEvent(new Event('change', { bubbles: true }));
          cb.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        } catch (e) {}
      }

      // Final check
      if (cb.checked) {
        // Green outline so you can spot it, no fake ticks
        cb.style.outline = '2px solid #28a745';
        ticked++;
      }
    }
    return ticked;
  }
  // Call it inside runFix, after the other passes
  const _origRunFix = runFix;
  async function runFixWithConsent() {
    await _origRunFix();
    // Then up to 5 attempts to force-tick the consent box
    for (let i = 0; i < 5; i++) {
      const n = await forceTickApaarConsent();
      if (n > 0) {
        console.log('[nielitFix] force-ticked ' + n + ' APAAR consent box(es)');
        break;
      }
      await sleep(600);
    }
  }

    // ---- On-page helper: download buttons next to each file input ----
  async function addUploadHelpers() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    const REQUIREMENTS = {
      photo: '132×170 px · 5–50 KB · DPI 96–300 · JPEG',
      signature: '170×132 px · 5–20 KB · DPI 96–200 · JPEG',
      thumbLeft: '170×132 px · 5–20 KB · DPI 96–200 · JPEG'
    };

    for (let i = 0; i < fileInputs.length; i++) {
      const input = fileInputs[i];
      if (input.dataset.nielitHelper === '1') continue;
      input.dataset.nielitHelper = '1';

      // Find the section wrapper (search up for "Upload Photo/Signature/Thumb")
      let section = input.closest('div');
      let tries = 0;
      while (section && tries < 6) {
        const t = (section.innerText || '').toLowerCase();
        if (t.indexOf('upload') !== -1 && (t.indexOf('photo') !== -1 || t.indexOf('signature') !== -1 || t.indexOf('thumb') !== -1)) break;
        section = section.parentElement;
        tries++;
      }
      if (!section) continue;

      const sectionText = (section.innerText || '').toLowerCase();
      let kind = null;
      if (sectionText.indexOf('thumb') !== -1 || sectionText.indexOf('अंगूठा') !== -1) kind = 'thumbLeft';
      else if (sectionText.indexOf('signature') !== -1 || sectionText.indexOf('हस्ताक्षर') !== -1) kind = 'signature';
      else if (sectionText.indexOf('photo') !== -1 || sectionText.indexOf('फोटो') !== -1) kind = 'photo';
      if (!kind) continue;

      // Build helper box
      const helper = document.createElement('div');
      helper.style.cssText = 'background:#e8f4ff;border:1px dashed #1e40af;border-radius:6px;padding:8px 12px;margin-top:8px;font-family:Arial,sans-serif;font-size:12px;color:#1e40af;line-height:1.5;';
      helper.innerHTML =
        '<div><b>📐 Requirement:</b> ' + (REQUIREMENTS[kind] || '') + '</div>' +
        '<button type="button" style="margin-top:6px;padding:6px 12px;background:#1e40af;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:bold;">⬇ Prepare & Download ' + kind + '</button>' +
        '<div class="nielit-helper-status" style="margin-top:6px;font-size:11px;color:#333;white-space:pre-line;"></div>';

      // Insert right after the file input's row
      const insertTarget = input.closest('.profileBlk, .form-group, div') || input.parentElement;
      insertTarget.parentNode.insertBefore(helper, insertTarget.nextSibling);

      const btn = helper.querySelector('button');
      const status = helper.querySelector('.nielit-helper-status');

                  btn.onclick = async function () {
        btn.disabled = true;
        btn.textContent = '⏳ Preparing...';
        status.textContent = 'Processing your master image to NIELIT specs...';
        try {
          const r = await new Promise(function (resolve) {
            chrome.runtime.sendMessage({ action: 'prepareUploadFromPage', kind: kind }, resolve);
          });
          if (r.ok) {
            btn.textContent = '✅ Downloaded';
            btn.style.background = '#28a745';
            status.innerHTML =
              '✅ <b>' + r.filename + '</b> (' + r.sizeKB + ' KB)\n' +
              '📁 Location: <b>Downloads/FormUploads/' + r.filename + '</b>\n' +
              '👉 Now click "Choose File" above → pick this file.';
            status.style.color = '#0a7d33';
          } else {
            btn.textContent = '❌ Failed';
            btn.style.background = '#dc3545';
            status.textContent = '❌ ' + (r.error || 'Unknown error');
            btn.disabled = false;
          }
        } catch (e) {
          btn.textContent = '❌ Error';
          status.textContent = '❌ ' + e.message;
          btn.disabled = false;
        }
      };
    }
  }

  // Wrap existing run to also add helpers
  const _origRunFixWithConsent = runFixWithConsent;
  async function runFixFull() {
    await _origRunFixWithConsent();
    await addUploadHelpers();
    // Retry once in case DOM wasn't ready
    setTimeout(addUploadHelpers, 2000);
  }

  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg && msg.action === 'fill') {
      setTimeout(runFixFull, 300);
    }
  });
})();