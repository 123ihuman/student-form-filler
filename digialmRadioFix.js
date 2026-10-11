// digialmRadioFix.js — fills common Yes/No radio groups across all digialm.com forms
// Works on JPSC, Supreme Court, High Courts, many state exam portals

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

  // ── Click a radio cleanly ──
  function clickRadio(radio) {
    if (radio.checked) return 1;
    try {
      const wrap = radio.closest('label') || radio.parentElement;
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

  // ── Get the option's visible text ──
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

  // ── Match option text against answer ──
  function matchesOption(optText, wanted) {
    const o = (optText || '').toLowerCase().trim();
    const w = (wanted || '').toLowerCase().trim();
    if (!o || !w) return false;
    if (o === w) return true;
    if (w === 'yes' && /^(yes|y)$/.test(o)) return true;
    if (w === 'no' && /^(no|n)$/.test(o)) return true;
    if (o.indexOf(w) !== -1 || w.indexOf(o) !== -1) return true;
    return false;
  }

  // ── Fill one radio group by name and desired value ──
  function fillRadioGroup(name, wantedValue) {
    const radios = document.querySelectorAll('input[type="radio"][name="' + name + '"]');
    if (!radios.length) return 0;
    for (let i = 0; i < radios.length; i++) {
      const r = radios[i];
      const text = radioText(r);
      const val = (r.value || '').toLowerCase().trim();
      if (matchesOption(text, wantedValue) || matchesOption(val, wantedValue)) {
        return clickRadio(r);
      }
    }
    return 0;
  }

  // ── Answer "No" to a whole family of "Yes/No" default questions ──
  function fillFamily(prefix, wanted) {
    // Match names like txtQuestionfor02_R, txtPostSpecQue1_R, etc.
    const all = document.querySelectorAll('input[type="radio"]');
    const names = new Set();
    all.forEach(function (r) {
      if (!r.name) return;
      if (r.name.indexOf(prefix) === 0 || r.name.match(new RegExp('^' + prefix + '\\d+_R$'))) {
        names.add(r.name);
      }
    });
    let n = 0;
    names.forEach(function (name) {
      n += fillRadioGroup(name, wanted);
    });
    return n;
  }

  // ── MAIN: fill known digialm radio names ──
  async function fillAllRadios(profile) {
    const f = (profile && profile.fields) || {};
    let n = 0;

    // ── Helper: yes/no from profile value ──
    function yno(v, defaultVal) {
      if (v === undefined || v === null || v === '') return defaultVal || 'no';
      const s = String(v).toLowerCase().trim();
      if (s === 'yes' || s === 'y' || s === 'true' || s === '1') return 'yes';
      if (s === 'no' || s === 'n' || s === 'false' || s === '0') return 'no';
      return defaultVal || 'no';
    }

    // ═════ Exact name → answer (in order of certainty) ═════

    // Nationality — always "A citizen of India"
    n += fillRadioGroup('txtNationality_R', 'a citizen of india');

    // Kashmir Migrant? → No unless profile says yes
    n += fillRadioGroup('txtKMigrant_R', yno(f.kashmirMigrant, 'no'));

    // Person With Disability? → from profile
    n += fillRadioGroup('txtPWD_R', yno(f.disability, 'no'));

    // Need Scribe? → No (unless disabled + requires)
    n += fillRadioGroup('txtScribe_R', yno(f.needsScribe, 'no'));

    // Own Scribe — "I will bring my own Scribe" (safe choice if scribe is needed)
    n += fillRadioGroup('txtOwnScribe_R', 'own scribe');

    // Org Scribe → No
    n += fillRadioGroup('txtOrgScribe_R', 'no');

    // Ex-Serviceman? → from profile
    n += fillRadioGroup('txtExServiceman_R', yno(f.exServicemen, 'no'));

    // Domicile? → default Yes (student applying in home state)
    n += fillRadioGroup('txtDomicile_R', yno(f.isDomicile, 'yes'));

    // Ex-Serviceman Disabled ESM? → No
    n += fillRadioGroup('txtExSerDisabledESM_R', yno(f.exSerDisabled, 'no'));

    // Ex-Serviceman Dependent Killed in Action? → No
    n += fillRadioGroup('txtExSerDepOfKilledInAct_R', yno(f.exSerDepKilled, 'no'));

    // Government Employee? → from profile
    n += fillRadioGroup('txtGovtEmp_R', yno(f.mpGovtEmployee || f.govtEmployee, 'no'));

    // Confirm Employee? → same as above
    n += fillRadioGroup('txtConfirmEmployee_R', yno(f.mpGovtEmployee || f.govtEmployee, 'no'));

    // Sports Quota? → No
    n += fillRadioGroup('txtSportQ_R', yno(f.sportsQuota, 'no'));

    // Apprentice? → No
    n += fillRadioGroup('txtApprenticeYN_R', yno(f.isApprentice, 'no'));

    // Permanent Address? → Yes
    n += fillRadioGroup('txtPerAddress_R', yno(f.hasPermanentAddress, 'yes'));

    // Experienced? → No (default — most are freshers)
    n += fillRadioGroup('txtIsExperienced_R', yno(f.isExperienced, 'no'));

    // No Objection? → Yes (giving consent)
    n += fillRadioGroup('txtnoObj_R', yno(f.noObjection, 'yes'));

    // Payment mode → Online
    n += fillRadioGroup('payment_mode_R', 'online');

    // ═════ Families: default "No" for post/specific questions ═════
    // txtQuestionfor02_R ... txtQuestionfor08_R
    n += fillFamily('txtQuestionfor', 'no');

    // txtPostSpecQue1_R ... txtPostSpecQue24_R (nobody claims special category unless they do)
    n += fillFamily('txtPostSpecQue', 'no');

    return n;
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
      await sleep(200);
    }
    return true;
  }

  async function run() {
    if (!isDigialm()) return;
    await waitForFillToSettle();
    await sleep(500);

    const profile = await loadProfile();

    for (let attempt = 0; attempt < 4; attempt++) {
      const n = await fillAllRadios(profile);
      if (n > 0) console.log('[digialmRadioFix] ticked ' + n + ' radio(s) — attempt ' + (attempt + 1));
      await sleep(700);
    }
  }

  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg && msg.action === 'fill') {
      setTimeout(run, 500);
    }
  });
})();