// fileFiller.js — universal (parses any site's requirements automatically)

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
  ctx += ' ' + (input.name || '') + ' ' + (input.id || '');
  ctx += ' ' + (input.accept || '') + ' ' + (input.title || '');
  let el = input.parentElement;
  for (let i = 0; i < 4 && el; i++) {
    ctx += ' ' + (el.innerText || '').slice(0, 500);
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
      const a = fileNormalize(list[i]);
      if (a && ctx.indexOf(a) !== -1 && a.length > best.score) best = { key: key, score: a.length };
    }
  }
  return best.key;
}

// ─── Universal requirement parser ───
function parseUniversalRequirements(rawCtx) {
  const ctx = (rawCtx || '').toLowerCase().replace(/\s+/g, ' ');
  const req = {};

  // Size ranges — "10-100 KB", "10 KB to 100 KB", "between 20 and 50 KB"
  let m = ctx.match(/(\d{1,4})\s*(?:kb)?\s*(?:to|[-–—]|and)\s*(\d{1,4})\s*kb/);
  if (m) { req.minKB = +m[1]; req.maxKB = +m[2]; }
  if (!req.minKB && !req.maxKB) {
    m = ctx.match(/(?:between|from)\s*(\d{1,4})\s*(?:to|and)\s*(\d{1,4})\s*kb/);
    if (m) { req.minKB = +m[1]; req.maxKB = +m[2]; }
  }
  if (!req.maxKB) {
    m = ctx.match(/(?:max(?:imum)?|less than|below|under|up ?to|upto)\s*(\d{1,4})\s*kb/);
    if (m) req.maxKB = +m[1];
  }
  if (!req.minKB) {
    m = ctx.match(/(?:min(?:imum)?|more than|above|at least|greater than)\s*(\d{1,4})\s*kb/);
    if (m) req.minKB = +m[1];
  }
  if (!req.minKB && !req.maxKB) {
    m = ctx.match(/(\d{1,4})\s*kb/);
    if (m) { req.maxKB = +m[1]; req.minKB = Math.max(1, Math.floor(req.maxKB * 0.3)); }
  }

  // Dimensions
  m = ctx.match(/(\d{2,4})\s*(?:px|pixels?)?\s*[x×]\s*(\d{2,4})\s*(?:px|pixels?)?/);
  if (m) { req.width = +m[1]; req.height = +m[2]; }
  if (!req.width) {
    m = ctx.match(/width\s*(\d{2,4})\s*(?:px)?\s*(?:and|,)\s*height\s*(\d{2,4})/);
    if (m) { req.width = +m[1]; req.height = +m[2]; }
  }

  // DPI — mid-range for "96-300 dpi"
  m = ctx.match(/(\d{2,4})\s*(?:-|to)?\s*(\d{2,4})?\s*dpi/);
  if (m) req.dpi = m[2] ? Math.round((+m[1] + +m[2]) / 2) : +m[1];

  // Format
  if (/pdf/.test(ctx)) req.format = 'application/pdf';
  else if (/png/.test(ctx)) req.format = 'image/png';
  else if (/jpe?g/.test(ctx)) req.format = 'image/jpeg';

  // Orientation
  if (/portrait/.test(ctx)) req.orientation = 'portrait';
  if (/landscape/.test(ctx)) req.orientation = 'landscape';

  // Filename length rule
  m = ctx.match(/file\s*name.{0,30}?(?:less than|under|max)\s*(\d+)\s*(?:char|letter)/);
  if (m) req.maxFilenameLen = +m[1];

  return req;
}

// ─── Safe defaults per file kind ───
function getSafeDefaults(kind) {
  const D = {
    photo:              { width: 200, height: 230, minKB: 10, maxKB: 50, dpi: 200, format: 'image/jpeg' },
    signature:          { width: 140, height: 60,  minKB: 10, maxKB: 20, dpi: 200, format: 'image/jpeg' },
    signatureHindi:     { width: 140, height: 60,  minKB: 10, maxKB: 20, dpi: 200, format: 'image/jpeg' },
    parentSignature:    { width: 140, height: 60,  minKB: 10, maxKB: 20, dpi: 200, format: 'image/jpeg' },
    thumbLeft:          { width: 170, height: 132, minKB: 10, maxKB: 20, dpi: 200, format: 'image/jpeg' },
    thumbRight:         { width: 170, height: 132, minKB: 10, maxKB: 20, dpi: 200, format: 'image/jpeg' },
    tenthMarksheet:     { minKB: 50, maxKB: 500, format: 'application/pdf' },
    twelfthMarksheet:   { minKB: 50, maxKB: 500, format: 'application/pdf' },
    graduationMarksheet:{ minKB: 50, maxKB: 500, format: 'application/pdf' },
    aadhaarCard:        { minKB: 50, maxKB: 500, format: 'application/pdf' },
    panCard:            { minKB: 50, maxKB: 500, format: 'application/pdf' },
    casteCertificate:   { minKB: 50, maxKB: 500, format: 'application/pdf' },
    incomeCertificate:  { minKB: 50, maxKB: 500, format: 'application/pdf' },
    domicileCertificate:{ minKB: 50, maxKB: 500, format: 'application/pdf' },
    udidCertificate:    { minKB: 50, maxKB: 500, format: 'application/pdf' }
  };
  return D[kind] || { minKB: 10, maxKB: 500, format: 'image/jpeg' };
}

// ─── Helpers ───
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
  return new Promise(function (resolve) { canvas.toBlob(resolve, type, quality); });
}

function injectJpegDpi(bytes, dpi) {
  if (bytes[0] !== 0xFF || bytes[1] !== 0xD8) return bytes;
  const hasJfif = bytes[2] === 0xFF && bytes[3] === 0xE0 &&
                  bytes[6] === 0x4A && bytes[7] === 0x46 &&
                  bytes[8] === 0x49 && bytes[9] === 0x46;
  if (hasJfif) {
    const c = new Uint8Array(bytes);
    c[13] = 1;
    c[14] = (dpi >> 8) & 0xFF; c[15] = dpi & 0xFF;
    c[16] = (dpi >> 8) & 0xFF; c[17] = dpi & 0xFF;
    return c;
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

function buildShortName(kind, format, maxLen) {
  const MAP = {
    photo: 'photo', signature: 'sign', signatureHindi: 'sign-hi',
    parentSignature: 'psign', thumbLeft: 'lthumb', thumbRight: 'rthumb',
    udidCertificate: 'udid', casteCertificate: 'caste', incomeCertificate: 'income',
    domicileCertificate: 'domicile', tenthMarksheet: '10-marks',
    tenthCertificate: '10-cert', twelfthMarksheet: '12-marks',
    twelfthCertificate: '12-cert', aadhaarCard: 'aadhaar',
    panCard: 'pan', consentForm: 'consent'
  };
  const ext = format === 'application/pdf' ? '.pdf' : format === 'image/png' ? '.png' : '.jpg';
  let base = MAP[kind] || kind.slice(0, 8);
  if (maxLen && (base.length + ext.length) > maxLen) {
    base = base.slice(0, maxLen - ext.length);
  }
  return base + ext;
}

// ─── Image processing ───
async function imageToTarget(sourceBlob, req, kind) {
  const targetW = req.width || 200;
  const targetH = req.height || 230;
  const format = req.format || 'image/jpeg';
  const minKB = req.minKB || 5;
  const maxKB = req.maxKB || 500;
  const dpi = req.dpi || 200;

  const img = await readImage(sourceBlob);
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetW, targetH);
  const scale = Math.max(targetW / img.width, targetH / img.height);
  const sw = targetW / scale, sh = targetH / scale;
  const sx = (img.width - sw) / 2, sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);

  // Binary search quality
  let lo = 0.3, hi = 0.95, best = null;
  for (let i = 0; i < 12; i++) {
    const q = (lo + hi) / 2;
    const blob = await canvasToBlob(canvas, format, q);
    const kb = blob.size / 1024;
    if (kb >= minKB && kb <= maxKB) { best = blob; break; }
    if (kb > maxKB) hi = q; else { best = blob; lo = q; }
  }

  // Upscale if too small
  if (!best || best.size / 1024 < minKB) {
    const factor = Math.min(3, Math.sqrt(minKB / Math.max(1, (best ? best.size / 1024 : 5))) * 1.3);
    const c2 = document.createElement('canvas');
    c2.width = Math.round(targetW * factor);
    c2.height = Math.round(targetH * factor);
    c2.getContext('2d').drawImage(canvas, 0, 0, c2.width, c2.height);
    const up = await canvasToBlob(c2, format, 0.9);
    if (up.size / 1024 <= maxKB && up.size / 1024 >= minKB) best = up;
  }

  if (!best) best = await canvasToBlob(canvas, format, 0.6);

  let bytes = new Uint8Array(await best.arrayBuffer());
  if (format === 'image/jpeg') bytes = injectJpegDpi(bytes, dpi);

  return {
    blob: new Blob([bytes], { type: format }),
    filename: buildShortName(kind, format, req.maxFilenameLen),
    sizeKB: bytes.length / 1024
  };
}

// ─── Image → PDF ───
async function imageToPdf(sourceBlob, req, kind) {
  const imgReq = Object.assign({}, req, {
    width: req.width || 800,
    height: req.height || 1000,
    minKB: 5, maxKB: Math.min(400, req.maxKB || 400),
    dpi: 200, format: 'image/jpeg'
  });
  const imgResult = await imageToTarget(sourceBlob, imgReq, kind);
  const jpegBytes = new Uint8Array(await imgResult.blob.arrayBuffer());
  const w = imgReq.width, h = imgReq.height;
  const enc = new TextEncoder();

  const header = '%PDF-1.4\n';
  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + w + ' ' + h +
               '] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n';
  const obj4Head = '4 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + w +
                   ' /Height ' + h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 ' +
                   '/Filter /DCTDecode /Length ' + jpegBytes.length + ' >>\nstream\n';
  const obj4Foot = '\nendstream\nendobj\n';
  const content = 'q\n' + w + ' 0 0 ' + h + ' 0 0 cm\n/Im0 Do\nQ\n';
  const obj5 = '5 0 obj\n<< /Length ' + content.length + ' >>\nstream\n' + content + 'endstream\nendobj\n';

  const parts = [enc.encode(header)];
  let offset = header.length;
  const offsets = [0];

  [obj1, obj2, obj3].forEach(function (o) {
    offsets.push(offset);
    const b = enc.encode(o); parts.push(b); offset += b.length;
  });
  offsets.push(offset);
  const h4 = enc.encode(obj4Head); parts.push(h4); offset += h4.length;
  parts.push(jpegBytes); offset += jpegBytes.length;
  const f4 = enc.encode(obj4Foot); parts.push(f4); offset += f4.length;
  offsets.push(offset);
  const b5 = enc.encode(obj5); parts.push(b5); offset += b5.length;

  const xrefStart = offset;
  let xref = 'xref\n0 6\n0000000000 65535 f \n';
  for (let i = 1; i <= 5; i++) xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  parts.push(enc.encode(xref));
  parts.push(enc.encode('trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xrefStart + '\n%%EOF\n'));

  const total = parts.reduce(function (s, p) { return s + p.length; }, 0);
  const pdf = new Uint8Array(total);
  let cur = 0;
  parts.forEach(function (p) { pdf.set(p, cur); cur += p.length; });

  return {
    blob: new Blob([pdf], { type: 'application/pdf' }),
    filename: buildShortName(kind, 'application/pdf', req.maxFilenameLen),
    sizeKB: pdf.length / 1024
  };
}

// ─── Orchestrator ───
async function prepareFile(kind, sourceBlob, pageContext, storedType) {
  let req = parseUniversalRequirements(pageContext);

  const siteRule = (typeof window.getSiteRule === 'function') ? window.getSiteRule() : null;
  if (siteRule && siteRule.fileRequirements && siteRule.fileRequirements[kind]) {
    req = Object.assign(req, siteRule.fileRequirements[kind]);
  }

  const defaults = getSafeDefaults(kind);
  for (const key in defaults) {
    if (!req[key]) req[key] = defaults[key];
  }

  if (req.minKB && req.maxKB && req.minKB > req.maxKB) {
    req.minKB = Math.floor(req.maxKB * 0.3);
  }
  if (!req.width || !req.height) {
    if (req.width && !req.height) req.height = Math.round(req.width * 1.29);
    else if (req.height && !req.width) req.width = Math.round(req.height * 0.78);
    else { req.width = 200; req.height = 230; }
  }

  // PDF path
  if (req.format === 'application/pdf') {
    if (storedType === 'application/pdf' || sourceBlob.type === 'application/pdf') {
      const fname = buildShortName(kind, 'application/pdf', req.maxFilenameLen);
      return { blob: sourceBlob, filename: fname, sizeKB: sourceBlob.size / 1024 };
    }
    return await imageToPdf(sourceBlob, req, kind);
  }

  return await imageToTarget(sourceBlob, req, kind);
}

// ─── Injection ───
async function injectFileInto(input, blob, filename) {
  const file = new File([blob], filename, { type: blob.type });
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.style.outline = '3px solid #1e40af';
}

function base64ToBlob(base64, type) {
  const bin = atob(base64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: type });
}

// ─── Main entry ───
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
      const pageContext = getFileFieldContext(input);
      const sourceBlob = base64ToBlob(stored.base64, stored.type || 'image/jpeg');
      const processed = await prepareFile(kind, sourceBlob, pageContext, stored.type);
      await injectFileInto(input, processed.blob, processed.filename);
      results.uploaded.push({
        kind: kind,
        size: processed.sizeKB.toFixed(1) + 'KB',
        filename: processed.filename
      });
    } catch (e) {
      results.failed.push({ kind: kind, error: e.message });
    }
  }

  return results;
}

window.fillAllFileInputs = fillAllFileInputs;
window.classifyFileInput = classifyFileInput;
window.prepareFile = prepareFile;
window.parseUniversalRequirements = parseUniversalRequirements;