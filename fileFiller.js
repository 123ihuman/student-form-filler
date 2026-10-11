// fileFiller.js

function fileNormalize(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
}

function getFileFieldContext(input) {
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
  for (let i = 0; i < 3 && el; i++) {
    const t = (el.innerText || '').slice(0, 300);
    if (t) ctx += ' ' + t;
    el = el.parentElement;
  }
  return fileNormalize(ctx);
}

function classifyFileInput(input) {
  const ctx = getFileFieldContext(input);
  if (!ctx) return null;

  const aliases = window.FILE_ALIASES || {};
  let best = { key: null, score: 0 };

  for (const key in aliases) {
    const list = aliases[key] || [];
    for (let i = 0; i < list.length; i++) {
      const alias = fileNormalize(list[i]);
      if (alias && ctx.indexOf(alias) !== -1) {
        const score = alias.length;
        if (score > best.score) best = { key: key, score: score };
      }
    }
  }
  return best.key;
}

function readImage(fileOrBlob) {
  return new Promise(function (resolve, reject) {
    const img = new Image();
    const url = URL.createObjectURL(fileOrBlob);
    img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = reject;
    img.src = url;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise(function (resolve) {
    canvas.toBlob(resolve, type, quality);
  });
}

function injectJpegDpi(bytes, dpi) {
  const hasJfif = bytes[2] === 0xFF && bytes[3] === 0xE0 &&
                  bytes[6] === 0x4A && bytes[7] === 0x46 &&
                  bytes[8] === 0x49 && bytes[9] === 0x46;
  if (hasJfif) {
    const copy = new Uint8Array(bytes);
    copy[13] = 1;
    copy[14] = (dpi >> 8) & 0xFF;
    copy[15] = dpi & 0xFF;
    copy[16] = (dpi >> 8) & 0xFF;
    copy[17] = dpi & 0xFF;
    return copy;
  }
  const jfif = new Uint8Array([
    0xFF, 0xE0, 0x00, 0x10,
    0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01,
    (dpi >> 8) & 0xFF, dpi & 0xFF,
    (dpi >> 8) & 0xFF, dpi & 0xFF,
    0x00, 0x00
  ]);
  const out = new Uint8Array(bytes.length + jfif.length);
  out.set(bytes.subarray(0, 2), 0);
  out.set(jfif, 2);
  out.set(bytes.subarray(2), 2 + jfif.length);
  return out;
}

async function processPhoto(sourceBlob, opts) {
  const width = opts.width || 200;
  const height = opts.height || 230;
  const dpi = opts.dpi || 300;
  const format = opts.format || 'image/jpeg';
  const maxKB = opts.maxKB || 50;
  const minKB = opts.minKB || 5;

  const img = await readImage(sourceBlob);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Cover-crop: fills the target dimensions exactly
  const scale = Math.max(width / img.width, height / img.height);
  const sw = width / scale;
  const sh = height / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);

    // Binary search quality so we land within [minKB, maxKB]
  let lo = 0.4, hi = 0.95, best = null;
  for (let i = 0; i < 10; i++) {
    const q = (lo + hi) / 2;
    const blob = await canvasToBlob(canvas, format, q);
    const kb = blob.size / 1024;
    if (kb <= maxKB && kb >= minKB) { best = blob; break; }
    if (kb > maxKB) { hi = q; } else { best = blob; lo = q; }
  }
  if (!best) best = await canvasToBlob(canvas, format, 0.6);

    let bytes = new Uint8Array(await best.arrayBuffer());
  if (format === 'image/jpeg') {
    bytes = injectJpegDpi(bytes, dpi);

    // Verify the DPI landed
    const dpiOk = bytes[0] === 0xFF && bytes[1] === 0xD8 &&
                  bytes[2] === 0xFF && bytes[3] === 0xE0 &&
                  bytes[13] === 1 &&
                  ((bytes[14] << 8) | bytes[15]) === dpi;

    if (!dpiOk) {
      // Retry once with a fresh inject (some blobs come back without proper SOI)
      bytes = injectJpegDpi(new Uint8Array(await best.arrayBuffer()), dpi);
      console.log('[fileFiller] DPI re-injected for safety, target=' + dpi);
    } else {
      console.log('[fileFiller] DPI inject OK, target=' + dpi);
    }
  }
  return new Blob([bytes], { type: format });
}

function parseUploadRequirements(ctx) {
  const req = {};

  // ⚡ Handle: "10-100 KB", "10 KB to 100 KB", "10KB-100KB", "50-300 KB"
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

  if (/jpe?g/i.test(ctx)) req.format = 'image/jpeg';
  else if (/png/i.test(ctx)) req.format = 'image/png';

  return req;
}

async function injectFileInto(input, blob, filename) {
  const file = new File([blob], filename, { type: blob.type });
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.style.outline = '3px solid #1e40af';
  return true;
}

function base64ToBlob(base64, type) {
  const bin = atob(base64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: type });
}

async function fillAllFileInputs(profile) {
  const files = profile.files || {};
  const results = { uploaded: [], skipped: [], failed: [] };

  const inputs = document.querySelectorAll('input[type="file"]');
  if (!inputs.length) return results;

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    if (input.disabled) continue;

    const kind = classifyFileInput(input);
    if (!kind) { results.skipped.push({ reason: 'no match' }); continue; }

    const stored = files[kind];
    if (!stored || !stored.base64) { results.skipped.push({ kind: kind, reason: 'not saved' }); continue; }

    try {
            const isProcessed = ['photo','signature','parentSignature','thumbLeft','thumbRight'].indexOf(kind) !== -1;
      const ctx = getFileFieldContext(input);
      const req = parseUploadRequirements(ctx);

      // ⚡ Merge site-specific file requirements (siteRules.js)
      const siteRule = (typeof window.getSiteRule === 'function') ? window.getSiteRule() : null;
      const siteFileReq = siteRule && siteRule.fileRequirements && siteRule.fileRequirements[kind];
      const effectiveReq = siteFileReq ? Object.assign({}, req, siteFileReq) : req;

      let blob;
      if (isProcessed && (effectiveReq.width || effectiveReq.maxKB || effectiveReq.dpi)) {
        const sourceBlob = base64ToBlob(stored.base64, stored.type || 'image/jpeg');
        blob = await processPhoto(sourceBlob, {
          width: effectiveReq.width || stored.width || 200,
          height: effectiveReq.height || stored.height || 230,
          dpi: effectiveReq.dpi || stored.dpi || 300,
          maxKB: effectiveReq.maxKB || 50,
          format: effectiveReq.format || 'image/jpeg'
        });
      } else {
        blob = base64ToBlob(stored.base64, stored.type || 'application/octet-stream');
      }

                  // ⚡ Short, site-safe names (NIELIT requires < 14 chars)
      const SHORT_NAMES = {
        photo: 'photo',
        signature: 'sign',
        signatureHindi: 'sign-hi',
        parentSignature: 'psign',
        thumbLeft: 'lthumb',
        thumbRight: 'rthumb',
        udidCertificate: 'udid',
        casteCertificate: 'caste',
        incomeCertificate: 'income',
        domicileCertificate: 'domicile',
        tenthMarksheet: '10-marks',
        tenthCertificate: '10-cert',
        twelfthMarksheet: '12-marks',
        twelfthCertificate: '12-cert',
        graduationMarksheet: 'ug-marks',
        graduationCertificate: 'ug-cert',
        pgMarksheet: 'pg-marks',
        pgCertificate: 'pg-cert',
        aadhaarCard: 'aadhaar',
        panCard: 'pan',
        consentForm: 'consent'
      };
      const ext = (stored.type || '').indexOf('pdf') !== -1 ? '.pdf' : '.jpg';
      const filename = (SHORT_NAMES[kind] || kind.slice(0, 10)) + ext;
      await injectFileInto(input, blob, filename);
      results.uploaded.push({ kind: kind, size: (blob.size / 1024).toFixed(1) + 'KB', filename: filename });
    } catch (e) {
      results.failed.push({ kind: kind, error: e.message });
    }
  }

  return results;
}

window.fillAllFileInputs = fillAllFileInputs;
window.classifyFileInput = classifyFileInput;
window.processPhoto = processPhoto;