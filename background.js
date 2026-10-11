// background.js

const activeTabs = new Set();

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.action === 'getState') {
    sendResponse({ active: activeTabs.has(msg.tabId) });
    return true;
  }
  if (msg.action === 'setState') {
    if (msg.active) activeTabs.add(msg.tabId);
    else activeTabs.delete(msg.tabId);
    sendResponse({ active: msg.active });
    return true;
  }
  if (msg.action === 'startBatch') {
    startBatch(msg.vendors || [], msg.profileId, msg.url || null);
    sendResponse({ started: true });
    return true;
  }
  return true;
});

chrome.tabs.onRemoved.addListener(function (tabId) {
  activeTabs.delete(tabId);
});

async function startBatch(vendors, profileId, url) {
  const data = await chrome.storage.local.get(['profiles']);
  const profile = (data.profiles || []).find(function (p) { return p.id === profileId; });
  if (!profile) return;

  const results = [];

  for (let i = 0; i < vendors.length; i++) {
    const vendor = vendors[i];
    let tab = null;
    try {
      tab = await chrome.tabs.create({
        url: url || 'about:blank',
        active: false
      });
      await waitForTab(tab.id);
      await sleep(1500);

      const filesToInject = ['aliases.js', 'fuzzy.js', 'smartMatch.js', 'siteRules.js', 'datePicker.js', 'ai.js', 'fileFiller.js', 'content.js'];
      for (let fi = 0; fi < filesToInject.length; fi++) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: [filesToInject[fi]]
          });
        } catch (e) {}
      }

      const resp = await sendMessage(tab.id, { action: 'fill', profile: profile });

      results.push({
        vendor: vendor.vendorName || vendor.fullName || ('Row ' + (i + 1)),
        status: resp && resp.success ? 'filled' : 'failed',
        filled: resp ? resp.filled.length : 0,
        aiFilled: resp && resp.aiFilled ? resp.aiFilled.length : 0,
        files: resp && resp.files ? resp.files.uploaded.length : 0,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      results.push({
        vendor: vendor.vendorName || vendor.fullName || ('Row ' + (i + 1)),
        status: 'failed',
        error: err.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      if (tab) setTimeout(function () { chrome.tabs.remove(tab.id).catch(function () {}); }, 3000);
    }
  }

  await chrome.storage.local.set({
    lastBatchResults: results,
    lastBatchTime: new Date().toISOString()
  });
}

function waitForTab(tabId) {
  return new Promise(function (resolve) {
    const listener = function (id, info) {
      if (id === tabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
}

function sendMessage(tabId, msg) {
  return new Promise(function (resolve) {
    chrome.tabs.sendMessage(tabId, msg, function (response) {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
      } else {
        resolve(response || { success: false, error: 'No response' });
      }
    });
  });
}

function sleep(ms) {
  return new Promise(function (r) { setTimeout(r, ms); });
}
// ========== File preparation (called from nielitFix.js helper buttons) ==========
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg && msg.action === 'prepareUploadFromPage') {
    (async function () {
      try {
        const tab = sender.tab;
        if (!tab) { sendResponse({ ok: false, error: 'No tab' }); return; }

        // 1. Detect page requirements via injected script
        const [{ result: reqs }] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: function () {
            // This runs INSIDE the page — can use DOM
            function norm(str) { return (str || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').trim(); }
            function getCtx(input) {
              let ctx = '';
              if (input.id) {
                const l = document.querySelector('label[for="' + input.id + '"]');
                if (l) ctx += ' ' + l.innerText;
              }
              const wrap = input.closest('label');
              if (wrap) ctx += ' ' + wrap.innerText;
              ctx += ' ' + (input.getAttribute('aria-label') || '');
              ctx += ' ' + (input.name || '') + ' ' + (input.id || '');
              let el = input.parentElement;
              for (let i = 0; i < 4 && el; i++) {
                ctx += ' ' + (el.innerText || '').slice(0, 400);
                el = el.parentElement;
              }
              return norm(ctx);
            }
            function parse(ctx) {
              const req = {};
              const sr = ctx.match(/(\d{1,4})\s*(?:kb)?\s*(?:to|[-–—]|and)\s*(\d{1,4})\s*kb/i);
              if (sr) { req.minKB = parseInt(sr[1], 10); req.maxKB = parseInt(sr[2], 10); }
              const dim = ctx.match(/(\d{2,4})\s*(?:px|pixels)?\s*[x×]\s*(\d{2,4})/i);
              if (dim) { req.width = parseInt(dim[1], 10); req.height = parseInt(dim[2], 10); }
              const dpi = ctx.match(/(\d{2,4})\s*dpi/i);
              if (dpi) req.dpi = parseInt(dpi[1], 10);
              if (/jpe?g/i.test(ctx)) req.format = 'image/jpeg';
              else if (/png/i.test(ctx)) req.format = 'image/png';
              return req;
            }
            function classify(input) {
              const ctx = getCtx(input);
              const aliases = window.FILE_ALIASES || {};
              let best = { key: null, score: 0 };
              for (const key in aliases) {
                const list = aliases[key] || [];
                for (let i = 0; i < list.length; i++) {
                  const a = norm(list[i]);
                  if (a && ctx.indexOf(a) !== -1 && a.length > best.score) best = { key: key, score: a.length };
                }
              }
              return best.key;
            }
            const out = {};
            document.querySelectorAll('input[type="file"]').forEach(function (inp) {
              if (inp.disabled) return;
              const k = classify(inp);
              if (!k) return;
              out[k] = parse(getCtx(inp));
            });
            return out;
          }
        });

        // 2. Read profile
        const data = await chrome.storage.local.get(['profiles', 'activeProfileId']);
        const profiles = data.profiles || [];
        const profile = profiles.find(function (p) { return p.id === data.activeProfileId; }) || profiles[0];
        if (!profile) { sendResponse({ ok: false, error: 'No profile saved' }); return; }

        const kind = msg.kind;
        const stored = profile.files && profile.files[kind];
        if (!stored || !stored.base64) {
          sendResponse({ ok: false, error: 'No master ' + kind + ' uploaded in Options' });
          return;
        }

        // 3. Merge requirements — site rule beats page detection
        let req = reqs[kind] || {};
        const host = new URL(tab.url).hostname.replace(/^www\./, '');
        const siteRules = {
          'nielit.gov.in': {
            photo:     { width: 132, height: 170, minKB: 5, maxKB: 50, dpi: 200, format: 'image/jpeg' },
            signature: { width: 170, height: 132, minKB: 5, maxKB: 20, dpi: 150, format: 'image/jpeg' },
            thumbLeft: { width: 170, height: 132, minKB: 5, maxKB: 20, dpi: 150, format: 'image/jpeg' }
          }
        };
        if (siteRules[host] && siteRules[host][kind]) req = Object.assign({}, req, siteRules[host][kind]);

        // Defaults per kind
        if (!req.width) {
          if (kind === 'photo') { req.width = 200; req.height = 230; }
          else if (kind === 'signature' || kind === 'parentSignature' || kind === 'thumbLeft') { req.width = 170; req.height = 132; }
        }
        if (!req.dpi) req.dpi = 200;
        if (!req.minKB) req.minKB = 5;
        if (!req.maxKB) req.maxKB = kind === 'udidCertificate' ? 300 : 100;
        if (!req.format) req.format = 'image/jpeg';

        // 4. Prepare the file in a sandbox tab (uses offscreen page)
        const prepResult = await prepareInPage(stored.base64, stored.type || 'image/jpeg', req, kind);

        // 5. Download
        const filename = shortName(kind) + (req.format === 'image/png' ? '.png' : '.jpg');
        await chrome.downloads.download({
          url: prepResult.dataUrl,
          filename: 'FormUploads/' + filename,
          saveAs: false,
          conflictAction: 'overwrite'
        });

        sendResponse({
          ok: true,
          filename: filename,
          sizeKB: prepResult.sizeKB,
          width: req.width,
          height: req.height,
          dpi: req.dpi
        });
      } catch (e) {
        sendResponse({ ok: false, error: e.message });
      }
    })();
    return true;
  }
});

// Helper — opens hidden extension page to do the image work
async function prepareInPage(base64, type, req, kind) {
  // Open preparer.html as a hidden tab
  const url = chrome.runtime.getURL('preparer.html');
  const tab = await chrome.tabs.create({ url: url, active: false });
  await waitForTab(tab.id);
  await sleep(300);

  // Ask the preparer page to process + return the result
  const response = await new Promise(function (resolve) {
    chrome.tabs.sendMessage(tab.id, {
      action: 'runPrepare',
      base64: base64,
      type: type,
      req: req
    }, function (r) {
      if (chrome.runtime.lastError) resolve({ ok: false, error: chrome.runtime.lastError.message });
      else resolve(r || { ok: false, error: 'No response' });
    });
  });

  chrome.tabs.remove(tab.id).catch(function () {});

  if (!response.ok) throw new Error(response.error || 'Prepare failed');
  return response.result;
}

function waitForTab(tabId) {
  return new Promise(function (resolve) {
    const listener = function (id, info) {
      if (id === tabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        setTimeout(resolve, 200);
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
}

function shortName(kind) {
  const MAP = {
    photo: 'photo', signature: 'sign', signatureHindi: 'sign-hi',
    parentSignature: 'psign', thumbLeft: 'lthumb', thumbRight: 'rthumb',
    udidCertificate: 'udid', casteCertificate: 'caste', incomeCertificate: 'income',
    domicileCertificate: 'domicile', tenthMarksheet: '10-marks', tenthCertificate: '10-cert',
    twelfthMarksheet: '12-marks', twelfthCertificate: '12-cert',
    graduationMarksheet: 'ug-marks', graduationCertificate: 'ug-cert',
    pgMarksheet: 'pg-marks', pgCertificate: 'pg-cert',
    aadhaarCard: 'aadhaar', panCard: 'pan', consentForm: 'consent'
  };
  return MAP[kind] || kind.slice(0, 10);
}