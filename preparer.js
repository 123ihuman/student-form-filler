// preparer.js — runs in extension context, processes images on request

window.prepare = async function (base64, type, req) {
  function b64ToBlob(b64, t) {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: t });
  }

  function loadImg(blob) {
    return new Promise(function (res, rej) {
      const i = new Image();
      const u = URL.createObjectURL(blob);
      i.onload = function () { URL.revokeObjectURL(u); res(i); };
      i.onerror = rej;
      i.src = u;
    });
  }

  function cBlob(c, t, q) {
    return new Promise(function (r) { c.toBlob(r, t, q); });
  }

  function injectDpi(bytes, dpi) {
    const has = bytes[2] === 0xFF && bytes[3] === 0xE0 &&
                bytes[6] === 0x4A && bytes[7] === 0x46 &&
                bytes[8] === 0x49 && bytes[9] === 0x46;
    if (has) {
      const c = new Uint8Array(bytes);
      c[13] = 1;
      c[14] = (dpi >> 8) & 0xFF; c[15] = dpi & 0xFF;
      c[16] = (dpi >> 8) & 0xFF; c[17] = dpi & 0xFF;
      return c;
    }
    const jfif = new Uint8Array([
      0xFF, 0xE0, 0x00, 0x10,
      0x4A, 0x46, 0x49, 0x46, 0x00,
      0x01, 0x01, 0x01,
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

  const blob = b64ToBlob(base64, type);
  const img = await loadImg(blob);

  const c = document.createElement('canvas');
  c.width = req.width;
  c.height = req.height;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, req.width, req.height);

  const scale = Math.max(req.width / img.width, req.height / img.height);
  const sw = req.width / scale;
  const sh = req.height / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, req.width, req.height);

  let lo = 0.4, hi = 0.95, best = null;
  for (let i = 0; i < 10; i++) {
    const q = (lo + hi) / 2;
    const b = await cBlob(c, req.format, q);
    const kb = b.size / 1024;
    if (kb <= req.maxKB && kb >= req.minKB) { best = b; break; }
    if (kb > req.maxKB) hi = q; else { best = b; lo = q; }
  }
  if (!best) best = await cBlob(c, req.format, 0.6);

  let bytes = new Uint8Array(await best.arrayBuffer());
  if (req.format === 'image/jpeg') bytes = injectDpi(bytes, req.dpi);

  const finalBlob = new Blob([bytes], { type: req.format });
  const reader = new FileReader();
  return new Promise(function (resolve) {
    reader.onload = function () {
      resolve({
        dataUrl: reader.result,
        sizeKB: (finalBlob.size / 1024).toFixed(1)
      });
    };
    reader.readAsDataURL(finalBlob);
  });
};

// Listen for prepare requests from background.js
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg && msg.action === 'runPrepare') {
    (async function () {
      try {
        const result = await window.prepare(msg.base64, msg.type, msg.req);
        sendResponse({ ok: true, result: result });
      } catch (e) {
        sendResponse({ ok: false, error: e.message });
      }
    })();
    return true;
  }
});