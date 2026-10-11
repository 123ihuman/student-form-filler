// popup.js

let currentTab = null;
let profilesList = [];

document.addEventListener('DOMContentLoaded', async function () {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tabs[0];
  if (!currentTab || !currentTab.url || currentTab.url.indexOf('chrome://') === 0 || currentTab.url.indexOf('chrome-extension://') === 0) {
    document.getElementById('notEgram').classList.remove('hidden');
    return;
  }
  document.getElementById('mainPanel').classList.remove('hidden');

  const data = await chrome.storage.local.get(['profiles']);
  profilesList = data.profiles || [];
  const sel = document.getElementById('profileSelect');

  // ── Build search index ──
  function buildOption(p) {
    const o = document.createElement('option');
    o.value = p.id;
    o.textContent = p.name || 'Unnamed';
    const f = p.fields || {};
    o.dataset.search = [
      p.name, f.fullName, f.fatherName, f.motherName,
      f.mobile, f.district, f.aadhaarNumber, f.email
    ].filter(Boolean).join(' ').toLowerCase();
    return o;
  }

  let currentSelectedId = null;

  function renderOptions(filter) {
    const q = (filter || '').toLowerCase().trim();
    sel.innerHTML = '';
    let shown = 0;

    profilesList.forEach(function (p) {
      const o = buildOption(p);
      if (!q || o.dataset.search.indexOf(q) !== -1) {
        sel.appendChild(o);
        shown++;
      }
    });

    if (!shown) {
      const o = document.createElement('option');
      o.value = '';
      o.textContent = '— No matches —';
      sel.appendChild(o);
    }

    if (currentSelectedId && profilesList.some(function (p) { return p.id === currentSelectedId; })) {
      sel.value = currentSelectedId;
    }
    updateSelectedHint();
  }

  function updateSelectedHint() {
    const hint = document.getElementById('selectedHint');
    if (!hint) return;
    const selected = profilesList.find(function (p) { return p.id === sel.value; });
    if (!selected) { hint.textContent = ''; return; }
    const f = selected.fields || {};
    const bits = [];
    if (f.mobile) bits.push('📱 ' + f.mobile);
    if (f.district) bits.push('📍 ' + f.district);
    hint.textContent = bits.length ? bits.join(' • ') : '';
  }

  sel.addEventListener('change', function () {
    currentSelectedId = sel.value;
    updateSelectedHint();
    chrome.storage.local.set({ activeProfileId: currentSelectedId });
  });

  const searchBox = document.getElementById('studentSearch');
  if (searchBox) {
    searchBox.addEventListener('input', function () {
      renderOptions(this.value);
    });
    searchBox.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        const first = sel.options[0];
        if (first && first.value) {
          sel.value = first.value;
          currentSelectedId = first.value;
          updateSelectedHint();
          chrome.storage.local.set({ activeProfileId: first.value });
        }
      }
    });
  }

  renderOptions('');

  document.getElementById('openOptions').onclick = function () {
    chrome.runtime.openOptionsPage();
  };

  // ══════ FILL BUTTON ══════
     document.getElementById('fillBtn').onclick = async function () {
    const profile = profilesList.find(function (p) { return p.id === sel.value; });
    if (!profile) return alert('Please select a student from the dropdown.');

    await chrome.storage.local.set({ activeProfileId: profile.id });

    showResult('⏳ Injecting scripts...', 'warn');

    const filesToInject = [
      'aliases.js', 'fuzzy.js', 'smartMatch.js', 'siteRules.js', 'datePicker.js',
      'ai.js', 'fileFiller.js', 'content.js',
      'genderFix.js', 'cbseitmsFix.js', 'nielitFix.js', 'bpscFix.js',
      'rrbFix.js', 'bankingFix.js', 'coastGuardFix.js', 'altMobileFix.js',
      'sscFormFix.js', 'sscVerifyNameFix.js', 'digialmFix.js', 'digialmRadioFix.js',
      'dsssbFix.js', 'dsssbForce.js'
    ];

    // Inject once
    for (let i = 0; i < filesToInject.length; i++) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: currentTab.id },
          files: [filesToInject[i]]
        });
      } catch (e) {
        console.warn('Skip ' + filesToInject[i] + ':', e.message);
      }
    }

    showResult('⏳ Filling... watch the page for green fields.', 'warn');

    // Single fill — fire and forget
    try {
      chrome.tabs.sendMessage(currentTab.id, { action: 'fill', profile: profile });
    } catch (e) {
      console.warn('sendMessage error:', e.message);
    }

    setTimeout(function () {
      showResult('✅ Fill started. Check the page.', 'ok');
    }, 800);
  };
  // ══════ VALIDATE BUTTON ══════
  document.getElementById('validateBtn').onclick = function () {
    const profile = profilesList.find(function (p) { return p.id === sel.value; });
    if (!profile) return alert('No profile.');
    const issues = validateLocal(profile);
    if (!issues.length) return showResult('All fields valid.', 'ok');
    showResult('Issues:\n' + issues.map(function (i) { return ' - ' + i.field + ': ' + i.reason; }).join('\n'), 'warn');
  };

}); // ← CLOSES DOMContentLoaded

// ══════ HELPER FUNCTIONS (outside the listener) ══════
function validateLocal(profile) {
  const V = {
    aadhaarNumber: function (v) { return /^\d{12}$/.test(String(v).replace(/\s/g, '')); },
    panNumber: function (v) { return /^[A-Z]{5}\d{4}[A-Z]$/.test(String(v).toUpperCase()); },
    mobile: function (v) { return /^\d{10}$/.test(String(v).replace(/\D/g, '')); },
    pincode: function (v) { return /^\d{6}$/.test(String(v)); },
    ifscCode: function (v) { return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(String(v).toUpperCase()); },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)); },
    dob: function (v) { const d = new Date(v); return !isNaN(d) && d < new Date(); }
  };
  const issues = [];
  const fields = profile.fields || {};
  Object.keys(V).forEach(function (k) {
    if (fields[k] && !V[k](fields[k])) issues.push({ field: k, reason: 'Invalid format' });
  });
  return issues;
}

function showResult(text, kind) {
  const box = document.getElementById('resultBox');
  if (!box) return;
  box.classList.remove('hidden');
  box.textContent = text;
  box.style.background = kind === 'error' ? '#f8d7da' : kind === 'warn' ? '#fff3cd' : '#d4edda';
  box.style.padding = '10px';
  box.style.borderRadius = '6px';
  box.style.marginTop = '8px';
  box.style.whiteSpace = 'pre-line';
  box.style.fontSize = '12px';
}

// ══════ PREPARE UPLOADS (runs separately) ══════
(async function initPrepareSection() {
  const section = document.getElementById('prepareSection');
  const buttonsBox = document.getElementById('prepareButtons');
  const statusBox = document.getElementById('prepareStatus');
  if (!section || !buttonsBox) return;

  let tab = null;
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    tab = tabs[0];
  } catch (e) {}

  if (!tab || !tab.url || tab.url.indexOf('chrome://') === 0) return;

  section.classList.remove('hidden');

  const LABELS = {
    photo: 'Photo',
    signature: 'Signature (Eng)',
    signatureHindi: 'Signature (Hindi)',
    parentSignature: 'Parent Signature',
    udidCertificate: 'UDID Cert',
    casteCertificate: 'Category Cert',
    incomeCertificate: 'Income Cert',
    tenthMarksheet: '10th Marksheet',
    tenthCertificate: '10th Cert',
    twelfthMarksheet: '12th Marksheet',
    twelfthCertificate: '12th Cert',
    graduationMarksheet: 'UG Marksheet',
    graduationCertificate: 'UG Cert',
    panCard: 'PAN Card',
    aadhaarCard: 'Aadhaar',
    consentForm: 'Consent Form'
  };

  let detected = {};
  try {
    if (typeof window.detectPageRequirements === 'function') {
      detected = await window.detectPageRequirements(tab.id);
    }
  } catch (e) {
    console.warn('detect failed', e);
  }

  const detectedKinds = Object.keys(detected);

  if (!detectedKinds.length) {
    const msg = document.createElement('div');
    msg.className = 'hint';
    msg.textContent = 'No file uploads detected on this page.';
    buttonsBox.appendChild(msg);
    return;
  }

  detectedKinds.forEach(function (kind) {
    const btn = document.createElement('button');
    const label = LABELS[kind] || kind;
    const req = detected[kind] || {};
    let sub = '';
    if (req.minKB && req.maxKB) sub = ' (' + req.minKB + '-' + req.maxKB + ' KB)';
    else if (req.maxKB) sub = ' (max ' + req.maxKB + ' KB)';
    else if (req.minKB) sub = ' (min ' + req.minKB + ' KB)';
    btn.textContent = '⬇ ' + label + sub;
    btn.addEventListener('click', async function () {
      btn.disabled = true;
      statusBox.textContent = 'Preparing ' + label + '...';
      try {
        const r = await window.prepareAndDownload(kind);
        if (r.ok) {
          btn.classList.add('done');
          statusBox.textContent = '✅ ' + label + ' → ' + r.filename + ' (' + r.sizeKB + ' KB)\nFind it in Downloads/FormUploads/';
        } else {
          statusBox.textContent = '❌ ' + label + ': ' + r.error;
        }
      } catch (e) {
        statusBox.textContent = '❌ ' + label + ': ' + e.message;
      } finally {
        btn.disabled = false;
      }
    });
    buttonsBox.appendChild(btn);
  });
})();