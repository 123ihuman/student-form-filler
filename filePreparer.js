// filePreparer.js — reads page requirements, processes master image, downloads to FormUploads/

// ---------- Shared helpers ----------
function base64ToBlobFP(base64, type) {
  const bin = atob(base64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: type || 'application/octet-stream' });
}

function readImageFP(blob) {
  return new Promise(function (resolve, reject) {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = reject;
    img.src = url;
  });
}

function canvasToBlobFP(canvas, type, quality) {
  return new Promise(function (resolve) { canvas.toBlob(resolve, type, quality); });
}

function injectJpegDpiFP(bytes, dpi) {
  // Must start with SOI (FF D8)
  if (bytes[0] !== 0xFF || bytes[1] !== 0xD8) {
    return bytes;
  }

  // Detect APP0/JFIF right after SOI
  const hasJfif = bytes[2] === 0xFF && bytes[3] === 0xE0 &&
                  bytes[6] === 0x4A && bytes[7] === 0x46 &&
                  bytes[8] === 0x49 && bytes[9] === 0x46;

  if (hasJfif) {
    // Patch existing JFIF
    const copy = new Uint8Array(bytes);
    copy[13] = 1;                        // units = dots per inch
    copy[14] = (dpi >> 8) & 0xFF;
    copy[15] = dpi & 0xFF;
    copy[16] = (dpi >> 8) & 0xFF;
    copy[17] = dpi & 0xFF;
    return copy;
  }

  // Build a fresh JFIF APP0 segment
  const jfif = new Uint8Array([
    0xFF, 0xE0, 0x00, 0x10,             // marker + length
    0x4A, 0x46, 0x49, 0x46, 0x00,       // "JFIF\0"
    0x01, 0x01,                          // version 1.1
    0x01,                                // units = dpi
    (dpi >> 8) & 0xFF, dpi & 0xFF,       // X density
    (dpi >> 8) & 0xFF, dpi & 0xFF,       // Y density
    0x00, 0x00                           // no thumbnail
  ]);

  // Insert: SOI (2 bytes) + JFIF + rest-of-file
  const out = new Uint8Array(bytes.length + jfif.length);
  out.set(bytes.subarray(0, 2), 0);       // SOI
  out.set(jfif, 2);                        // new APP0/JFIF
  out.set(bytes.subarray(2), 2 + jfif.length); // remaining segments
  return out;
}

// ---------- Image processing ----------
async function processImageForUpload(sourceBlob, opts) {
  const width = opts.width || 200;
  const height = opts.height || 230;
  const dpi = opts.dpi || 300;
  const format = opts.format || 'image/jpeg';
  const minKB = opts.minKB || 5;
  const maxKB = opts.maxKB || 100;

  const img = await readImageFP(sourceBlob);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Cover-crop centered
  const scale = Math.max(width / img.width, height / img.height);
  const sw = width / scale;
  const sh = height / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);

  // Binary search quality to fit maxKB
  let lo = 0.25, hi = 0.95, best = null;
  for (let i = 0; i < 10; i++) {
    const q = (lo + hi) / 2;
    const blob = await canvasToBlobFP(canvas, format, q);
    const kb = blob.size / 1024;
    if (kb <= maxKB) { best = blob; lo = q; }
    else { hi = q; }
  }
  if (!best) best = await canvasToBlobFP(canvas, format, 0.3);

  // If too small, boost quality or scale up
  let finalBlob = best;
  let kbNow = finalBlob.size / 1024;
  if (kbNow < minKB) {
    // Try max quality first
    const hq = await canvasToBlobFP(canvas, format, 0.95);
    if (hq.size / 1024 <= maxKB) {
      finalBlob = hq;
      kbNow = finalBlob.size / 1024;
    }
    // Still too small? Bump resolution
    if (kbNow < minKB) {
      const factor = Math.min(3, Math.sqrt(minKB / kbNow));
      const w2 = Math.round(width * factor);
      const h2 = Math.round(height * factor);
      const c2 = document.createElement('canvas');
      c2.width = w2;
      c2.height = h2;
      const c2ctx = c2.getContext('2d');
      c2ctx.fillStyle = '#ffffff';
      c2ctx.fillRect(0, 0, w2, h2);
      c2ctx.drawImage(canvas, 0, 0, w2, h2);
      const boosted = await canvasToBlobFP(c2, format, 0.9);
      if (boosted.size / 1024 <= maxKB) {
        finalBlob = boosted;
      }
    }
  }

  // Inject DPI for JPEG
    let bytes = new Uint8Array(await finalBlob.arrayBuffer());
  if (format === 'image/jpeg') {
    bytes = injectJpegDpiFP(bytes, dpi);

    // Verify the DPI actually landed
    const ok = bytes[0] === 0xFF && bytes[1] === 0xD8 &&
               bytes[2] === 0xFF && bytes[3] === 0xE0 &&
               bytes[13] === 1 &&
               ((bytes[14] << 8) | bytes[15]) === dpi;
    console.log('[filePreparer] DPI inject ' + (ok ? 'OK' : 'FAILED') + ' target=' + dpi);
  }
  return new Blob([bytes], { type: format });
}

// ---------- Page requirement detection ----------
async function detectPageRequirements(tabId) {
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: function () {
        function normalizeFP(str) {
          return (str || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
        }

        function getContextFP(input) {
          let ctx = '';
          if (input.id) {
            const l = document.querySelector('label[for="' + input.id + '"]');
            if (l) ctx += ' ' + l.innerText;
          }
          const wrap = input.closest('label');
          if (wrap) ctx += ' ' + wrap.innerText;
          ctx += ' ' + (input.getAttribute('aria-label') || '');
          ctx += ' ' + (input.name || '');
          ctx += ' ' + (input.id || '');
          ctx += ' ' + (input.accept || '');
          ctx += ' ' + (input.title || '');
          let el = input.parentElement;
          for (let i = 0; i < 4 && el; i++) {
            ctx += ' ' + (el.innerText || '').slice(0, 400);
            el = el.parentElement;
          }
          return ctx;
        }

        function parseReqFP(ctx) {
          const req = {};
          const sizeRange = ctx.match(/(\d{1,4})\s*(?:kb)?\s*(?:to|[-–—]|and)\s*(\d{1,4})\s*kb/i);
          if (sizeRange) {
            req.minKB = parseInt(sizeRange[1], 10);
            req.maxKB = parseInt(sizeRange[2], 10);
          } else {
            const maxOnly = ctx.match(/(?:max|below|under|upto|up to|less than)\s*(\d{1,4})\s*kb/i);
            if (maxOnly) req.maxKB = parseInt(maxOnly[1], 10);
            const minOnly = ctx.match(/(?:min|above|at least|more than)\s*(\d{1,4})\s*kb/i);
            if (minOnly) req.minKB = parseInt(minOnly[1], 10);
          }
          const dim = ctx.match(/(\d{2,4})\s*(?:px|pixels)?\s*[x×]\s*(\d{2,4})/i);
          if (dim) { req.width = parseInt(dim[1], 10); req.height = parseInt(dim[2], 10); }
          const dpi = ctx.match(/(\d{2,4})\s*dpi/i);
          if (dpi) req.dpi = parseInt(dpi[1], 10);
          if (/jpe?g|jpg/i.test(ctx)) req.format = 'image/jpeg';
          else if (/png/i.test(ctx)) req.format = 'image/png';
          return req;
        }

        function classifyFP(input) {
          const ctx = normalizeFP(getContextFP(input));
          const aliases = window.FILE_ALIASES || {};
          let best = { key: null, score: 0 };
          for (const key in aliases) {
            const list = aliases[key] || [];
            for (let i = 0; i < list.length; i++) {
              const alias = normalizeFP(list[i]);
              if (alias && ctx.indexOf(alias) !== -1) {
                if (alias.length > best.score) best = { key: key, score: alias.length };
              }
            }
          }
          return best.key;
        }

        const reqs = {};
        const inputs = document.querySelectorAll('input[type="file"]');
        for (let i = 0; i < inputs.length; i++) {
          const input = inputs[i];
          if (input.disabled) continue;
          const kind = classifyFP(input);
          if (!kind) continue;
          reqs[kind] = parseReqFP(getContextFP(input));
        }
        return reqs;
      }
    });
    return result || {};
  } catch (e) {
    console.warn('[filePreparer] detect error:', e);
    return {};
  }
}

// ---------- Download ----------
async function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  try {
    await chrome.downloads.download({
      url: url,
      filename: 'FormUploads/' + filename,
      saveAs: false,
      conflictAction: 'uniquify'
    });
  } catch (e) {
    console.warn('[filePreparer] download failed:', e);
    // Fallback: anchor click
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { a.remove(); URL.revokeObjectURL(url); }, 3000);
    return;
  }
  setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
}

function buildFilename(kind, req) {
  const ext = (req.format || 'image/jpeg').indexOf('png') !== -1 ? 'png' : 'jpg';
  const SHORT_NAMES = {
    photo:              'photo',
    signature:          'sign',
    signatureHindi:     'sign-hi',
    parentSignature:    'psign',
    thumbLeft:          'lthumb',
    thumbRight:         'rthumb',
    udidCertificate:    'udid',
    casteCertificate:   'caste',
    incomeCertificate:  'income',
    domicileCertificate:'domicile',
    tenthMarksheet:     '10-marks',
    tenthCertificate:   '10-cert',
    twelfthMarksheet:   '12-marks',
    twelfthCertificate: '12-cert',
    graduationMarksheet:'ug-marks',
    graduationCertificate:'ug-cert',
    pgMarksheet:        'pg-marks',
    pgCertificate:      'pg-cert',
    aadhaarCard:        'aadhaar',
    panCard:            'pan',
    consentForm:        'consent'
  };
  const base = SHORT_NAMES[kind] || kind.slice(0, 10);
  return base + '.' + ext;
}

// ---------- Main entry ----------
async function prepareAndDownload(kind) {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (!tab) return { ok: false, error: 'No active tab' };

    const reqs = await detectPageRequirements(tab.id);
    let req = reqs[kind] || {};

    // Fallback defaults per kind
    if (!req.maxKB) {
      if (kind === 'photo' || kind === 'signature' || kind === 'parentSignature') {
        req.minKB = req.minKB || 10;
        req.maxKB = req.maxKB || 100;
      } else if (kind === 'udidCertificate') {
        req.minKB = req.minKB || 50;
        req.maxKB = req.maxKB || 300;
      } else {
        req.maxKB = req.maxKB || 500;
      }
    }
    if (kind === 'photo' && !req.width) { req.width = 200; req.height = 230; req.dpi = req.dpi || 300; }
    if ((kind === 'signature' || kind === 'parentSignature') && !req.width) { req.width = 140; req.height = 60; req.dpi = req.dpi || 300; }
    if (!req.dpi) req.dpi = 300;
    if (!req.format) req.format = 'image/jpeg';

    const data = await chrome.storage.local.get(['profiles', 'activeProfileId']);
    const profiles = data.profiles || [];
    const profile = profiles.find(function (p) { return p.id === data.activeProfileId; }) || profiles[0];
    if (!profile) return { ok: false, error: 'No profile' };

    const stored = profile.files && profile.files[kind];
    if (!stored || !stored.base64) {
      return { ok: false, error: 'No master file saved for ' + kind };
    }

    const sourceBlob = base64ToBlobFP(stored.base64, stored.type || 'image/jpeg');
    const processed = await processImageForUpload(sourceBlob, req);
    const filename = buildFilename(kind, req);
    await downloadBlob(processed, filename);

    return { ok: true, filename: filename, sizeKB: +(processed.size / 1024).toFixed(1), req: req };
  } catch (e) {
    console.error('[filePreparer]', e);
    return { ok: false, error: e.message };
  }
}

window.prepareAndDownload = prepareAndDownload;
window.detectPageRequirements = detectPageRequirements;