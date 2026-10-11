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
  sel.innerHTML = '';
  profilesList.forEach(function (p) {
    const o = document.createElement('option');
    o.value = p.id;
    o.textContent = p.name || 'Unnamed';
    sel.appendChild(o);
  });

  document.getElementById('openOptions').onclick = function () {
    chrome.runtime.openOptionsPage();
  };

  document.getElementById('fillBtn').onclick = async function () {
    const profile = profilesList.find(function (p) { return p.id === sel.value; });
    if (!profile) return alert('Create a profile first.');

        // Check if already injected
    let alreadyLoaded = false;
    try {
      const check = await chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: function () { return typeof window.FIELD_ALIASES !== 'undefined'; }
      });
      alreadyLoaded = check && check[0] && check[0].result === true;
    } catch (e) {}

    if (!alreadyLoaded) {
      const filesToInject = ['aliases.js', 'fuzzy.js', 'smartMatch.js', 'siteRules.js', 'datePicker.js', 'ai.js', 'fileFiller.js', 'content.js', 'genderFix.js', 'cbseitmsFix.js', 'nielitFix.js'];
      for (let i = 0; i < filesToInject.length; i++) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            files: [filesToInject[i]]
          });
        } catch (e) {
          console.warn('Skip missing file: ' + filesToInject[i]);
        }
      }
    }

        let responded = false;
    const timeoutId = setTimeout(function () {
      if (!responded) {
        showResult(
          '⏱ No response from page after 30 seconds.\n\n' +
          'Possible causes:\n' +
          '1. Open DevTools (F12) → Console → look for red errors\n' +
          '2. Refresh the page and try again\n' +
          '3. Some fields may have been filled anyway — check the form',
          'error'
        );
      }
    }, 30000);

    chrome.tabs.sendMessage(currentTab.id, { action: 'fill', profile: profile }, function (r) {
      responded = true;
      clearTimeout(timeoutId);

      if (chrome.runtime.lastError || !r) {
        showResult('❌ Error: could not reach page.\n' + (chrome.runtime.lastError ? chrome.runtime.lastError.message : ''), 'error');
        return;
      }
      const lines = [];
      lines.push('Rules filled: ' + r.filled.length);
      lines.push('AI filled: ' + (r.aiFilled ? r.aiFilled.length : 0) + ' (via ' + (r.aiProvider || 'none') + ')');
      lines.push('Files uploaded: ' + (r.files ? r.files.uploaded.length : 0));
      if (r.files && r.files.uploaded.length) {
        r.files.uploaded.forEach(function (f) {
          lines.push('   - ' + f.kind + ' (' + f.size + ')');
        });
      }
      lines.push('Missed: ' + r.missed.length);
      if (r.validationIssues && r.validationIssues.length) {
        lines.push('');
        lines.push('Validation warnings:');
        r.validationIssues.forEach(function (v) {
          lines.push('   - ' + v.field + ': ' + v.reason);
        });
      }
      showResult(lines.join('\n'), 'ok');
    });
  };

  document.getElementById('validateBtn').onclick = function () {
    const profile = profilesList.find(function (p) { return p.id === sel.value; });
    if (!profile) return alert('No profile.');
    const issues = validateLocal(profile);
    if (!issues.length) return showResult('All fields valid.', 'ok');
    showResult('Issues:\n' + issues.map(function (i) { return ' - ' + i.field + ': ' + i.reason; }).join('\n'), 'warn');
  };
});

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
  box.classList.remove('hidden');
  box.textContent = text;
  box.style.background = kind === 'error' ? '#f8d7da' : kind === 'warn' ? '#fff3cd' : '#d4edda';
  box.style.padding = '10px';
  box.style.borderRadius = '6px';
  box.style.marginTop = '8px';
  box.style.whiteSpace = 'pre-line';
  box.style.fontSize = '12px';
}
// ========== Prepare Uploads section ==========
(async function initPrepareSection() {
  const section = document.getElementById('prepareSection');
  const buttonsBox = document.getElementById('prepareButtons');
  const statusBox = document.getElementById('prepareStatus');
  if (!section || !buttonsBox) return;

  let currentTab = null;
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tabs[0];
  } catch (e) {}

  if (!currentTab || !currentTab.url || currentTab.url.indexOf('chrome://') === 0) return;

  section.classList.remove('hidden');

  // Human-friendly labels
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

  // Detect which kinds exist on the page
  let detected = {};
  try {
    detected = await window.detectPageRequirements(currentTab.id);
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
    btn.title = 'Prepare ' + label + ' and download to FormUploads/';
    btn.addEventListener('click', async function () {
      btn.disabled = true;
      statusBox.textContent = 'Preparing ' + label + '...';
      try {
        const r = await window.prepareAndDownload(kind);
        if (r.ok) {
          btn.classList.add('done');
          statusBox.textContent = '✅ ' + label + ' → ' + r.filename + ' (' + r.sizeKB + ' KB)\nFind it in Downloads/FormUploads/';
        } else {
          statusBox.textContent = '❌ ' + label + ': ' + r.error + '\nSave this file first in Options → File Uploads.';
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