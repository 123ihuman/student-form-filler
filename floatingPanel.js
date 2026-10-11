// floatingPanel.js — persistent on-page panel with Fill + Prepare buttons

(function () {
  function isFormPage() {
    const h = location.hostname;
    return /nielit|ssc|cbseitms|rrbapply|ibps|upsc|mponline|digialm|cbse|nic\.in|gov\.in/i.test(h);
  }

  // Persist "panel visible" so it re-appears after page reloads
  const PANEL_KEY = 'aifpPanelVisible_' + location.hostname;

  function markPanelVisible() {
    try { sessionStorage.setItem(PANEL_KEY, '1'); } catch (e) {}
  }
  function isPanelMarkedVisible() {
    try { return sessionStorage.getItem(PANEL_KEY) === '1'; } catch (e) { return false; }
  }

  function makePanel() {
    if (document.getElementById('aifpPanel')) return;

    const panel = document.createElement('div');
    panel.id = 'aifpPanel';
    panel.style.cssText = [
      'position:fixed',
      'bottom:20px',
      'right:20px',
      'z-index:2147483647',
      'width:230px',
      'background:#fff',
      'border:2px solid #1e40af',
      'border-radius:10px',
      'box-shadow:0 6px 24px rgba(0,0,0,0.25)',
      'font-family:Arial,sans-serif',
      'font-size:12px',
      'color:#222',
      'user-select:none'
    ].join(';');

    panel.innerHTML =
      '<div id="aifpHeader" style="background:#1e40af;color:#fff;padding:8px 10px;border-radius:8px 8px 0 0;display:flex;justify-content:space-between;align-items:center;cursor:move;">' +
        '<b>AI Form Filler</b>' +
        '<button id="aifpMin" style="background:transparent;border:none;color:#fff;cursor:pointer;font-size:14px;padding:0 4px;">–</button>' +
      '</div>' +
      '<div id="aifpBody" style="padding:10px;">' +
        '<button id="aifpFill" style="width:100%;padding:8px;background:#1e40af;color:#fff;border:none;border-radius:5px;font-weight:bold;cursor:pointer;margin-bottom:8px;">Fill This Page</button>' +
        '<div id="aifpPrepareList" style="display:grid;grid-template-columns:1fr 1fr;gap:5px;"></div>' +
        '<div id="aifpStatus" style="margin-top:8px;font-size:11px;color:#333;min-height:12px;white-space:pre-line;"></div>' +
      '</div>';

        document.body.appendChild(panel);
    markPanelVisible();

    // Minimize/expand
    let minimized = false;
    document.getElementById('aifpMin').onclick = function () {
      minimized = !minimized;
      document.getElementById('aifpBody').style.display = minimized ? 'none' : 'block';
      this.textContent = minimized ? '+' : '–';
    };

    // Fill button — sends message to content script
    document.getElementById('aifpFill').onclick = async function () {
      const status = document.getElementById('aifpStatus');
      status.textContent = 'Filling...';
      try {
        const data = await chrome.storage.local.get(['profiles', 'activeProfileId']);
        const profiles = data.profiles || [];
        const profile = profiles.find(function (p) { return p.id === data.activeProfileId; }) || profiles[0];
        if (!profile) {
          status.textContent = 'No profile saved. Open Options first.';
          return;
        }
        chrome.runtime.sendMessage({ action: 'fillFromPanel', profile: profile });
        status.textContent = 'Fill requested. Watch the form.';
      } catch (e) {
        status.textContent = 'Error: ' + e.message;
      }
    };

    buildPrepareButtons();

    // Drag to move
    let dragging = false, ox = 0, oy = 0;
    const header = document.getElementById('aifpHeader');
    header.addEventListener('mousedown', function (e) {
      if (e.target.id === 'aifpMin') return;
      dragging = true;
      ox = e.clientX - panel.offsetLeft;
      oy = e.clientY - panel.offsetTop;
    });
    document.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      panel.style.left = (e.clientX - ox) + 'px';
      panel.style.top = (e.clientY - oy) + 'px';
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
    });
    document.addEventListener('mouseup', function () { dragging = false; });
  }

  async function buildPrepareButtons() {
    const box = document.getElementById('aifpPrepareList');
    if (!box) return;
    box.innerHTML = '';

    const LABELS = {
      photo: 'Photo', signature: 'Sign', signatureHindi: 'Sign-HI',
      parentSignature: 'PSign', thumbLeft: 'LThumb', thumbRight: 'RThumb',
      udidCertificate: 'UDID', casteCertificate: 'Caste',
      incomeCertificate: 'Income', tenthMarksheet: '10-Mk',
      tenthCertificate: '10-Cert', twelfthMarksheet: '12-Mk',
      twelfthCertificate: '12-Cert', graduationMarksheet: 'UG-Mk',
      graduationCertificate: 'UG-Cert', aadhaarCard: 'Aadhaar',
      panCard: 'PAN', consentForm: 'Consent'
    };

    let detected = {};
    try {
      if (typeof window.detectPageRequirements === 'function') {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]) detected = await window.detectPageRequirements(tabs[0].id);
      }
    } catch (e) {}

    const kinds = Object.keys(detected);
    if (!kinds.length) {
      box.innerHTML = '<span style="grid-column:span 2;color:#888;font-size:11px;">No uploads detected</span>';
      return;
    }

    kinds.forEach(function (kind) {
      const btn = document.createElement('button');
      btn.textContent = '⬇ ' + (LABELS[kind] || kind);
      btn.title = 'Download ' + kind + ' to Downloads/FormUploads/';
      btn.style.cssText = 'padding:5px;font-size:10px;border:1px solid #b8daff;background:#f0f7ff;color:#1e40af;border-radius:4px;cursor:pointer;';
      btn.onclick = async function () {
        btn.disabled = true;
        btn.textContent = '⏳';
        try {
          const r = await window.prepareAndDownload(kind);
          if (r.ok) {
            btn.textContent = '✅ ' + (LABELS[kind] || kind);
            btn.style.background = '#d4edda';
            btn.style.color = '#0a7d33';
            document.getElementById('aifpStatus').textContent = kind + ' → ' + r.filename + ' (' + r.sizeKB + ' KB)';
          } else {
            btn.textContent = '❌ ' + (LABELS[kind] || kind);
            document.getElementById('aifpStatus').textContent = kind + ': ' + r.error;
          }
        } catch (e) {
          btn.textContent = '❌';
          document.getElementById('aifpStatus').textContent = kind + ': ' + e.message;
        } finally {
          btn.disabled = false;
        }
      };
      box.appendChild(btn);
    });
  }

    // Inject on load — ALWAYS on form pages, or when previously shown
    // ── Panel persistence: check every 2 seconds, re-inject if missing ──
  function ensurePanel() {
    if (!isFormPage()) return;
    if (!document.body) return;

    const existing = document.getElementById('aifpPanel');
    if (!existing) {
      makePanel();
    } else {
      // Re-verify it's still visible (page may hide it)
      if (existing.offsetParent === null) {
        existing.style.display = 'block';
      }
    }
  }

  // Initial injection
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(ensurePanel, 800);
    });
  } else {
    setTimeout(ensurePanel, 800);
  }

  // Re-inject on any navigation event
  window.addEventListener('pageshow', function () { setTimeout(ensurePanel, 500); });
  window.addEventListener('load', function () { setTimeout(ensurePanel, 500); });

  // Watch DOM mutations — many forms wipe body content after submit/refresh
  try {
    const mo = new MutationObserver(function () {
      if (!document.getElementById('aifpPanel') && isFormPage()) {
        ensurePanel();
      }
    });
    mo.observe(document.documentElement || document.body, { childList: true, subtree: false });
  } catch (e) {}

  // Safety net — re-check every 2 seconds
  setInterval(ensurePanel, 2000);

  // Also react to popup "prepare" request
  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg && msg.action === 'showPanel') {
      makePanel();
    }
  });
})();