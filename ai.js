// ai.js

const AI_SENSITIVE_KEYS = ['aadhaarNumber','panNumber','accountNumber','ifscCode','password','confirmPassword','otp','captcha'];

function hasOnDeviceAI() {
  return typeof window.ai !== 'undefined' && window.ai && window.ai.languageModel;
}

function scrubForAI(profile, skipKeys) {
  const safe = {};
  const fields = profile.fields || {};
  for (const k in fields) {
    if (AI_SENSITIVE_KEYS.indexOf(k) !== -1) continue;
    if (skipKeys && skipKeys.has(k)) continue;
    if (!fields[k]) continue;
    safe[k] = fields[k];
  }
  return safe;
}

function extractFormSnapshot(skipEls) {
  const fields = [];
  const all = document.querySelectorAll(
    'input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=file]), select, textarea'
  );
  let n = 0;
  for (let i = 0; i < all.length; i++) {
    const el = all[i];
    if (el.disabled || el.readOnly) continue;
    if (el.offsetParent === null && el.type !== 'radio' && el.type !== 'checkbox') continue;
    if (skipEls && skipEls.has(el)) continue;

    const id = 'f' + (n++);
    el.dataset.egramAIId = id;

    const item = {
      id: id,
      label: (getLabelText(el) || el.name || el.id || '').slice(0, 120),
      type: el.tagName === 'SELECT' ? 'select' : (el.type || 'text'),
      placeholder: (el.placeholder || '').slice(0, 80)
    };
    if (el.tagName === 'SELECT') {
      item.options = Array.prototype.slice.call(el.options, 0, 30).map(function (o) { return o.text; });
    }
    fields.push(item);
  }
  return fields;
}

async function mapWithOnDevice(fields, profileData) {
  const session = await window.ai.languageModel.create({
    systemPrompt: 'You map web form fields to profile values. Return ONLY a JSON object like {"f0":{"profileKey":"name","value":"Ramesh","confidence":0.95}}. Omit any field with no match. No prose, no markdown.'
  });
  const prompt = 'FIELDS:\n' + JSON.stringify(fields) + '\n\nPROFILE:\n' + JSON.stringify(profileData) + '\n\nJSON only:';
  const raw = await session.prompt(prompt);
  session.destroy();
  return parseAIJson(raw);
}

async function mapWithCloud(fields, profileData, apiKey, provider) {
  const prompt = 'Map form fields to profile values. Return ONLY JSON: {"f0":{"profileKey":"x","value":"y","confidence":0.9}}.\n\nFIELDS:\n' + JSON.stringify(fields) + '\n\nPROFILE:\n' + JSON.stringify(profileData);

  let url, headers, body;
  if (provider === 'openai') {
    url = 'https://api.openai.com/v1/chat/completions';
    headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey };
    body = JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1
    });
  } else {
    url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey;
    headers = { 'Content-Type': 'application/json' };
    body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
    });
  }

  const res = await fetch(url, { method: 'POST', headers: headers, body: body });
  if (!res.ok) throw new Error('AI HTTP ' + res.status);
  const data = await res.json();
  const raw = provider === 'openai' ? data.choices[0].message.content : data.candidates[0].content.parts[0].text;
  return parseAIJson(raw);
}

function parseAIJson(raw) {
  try {
    const clean = String(raw).replace(/```json|```/g, '').trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start === -1 || end === -1) return {};
    const parsed = JSON.parse(clean.slice(start, end + 1));
    const out = {};
    for (const id in parsed) {
      const v = parsed[id];
      if (v && v.value && (v.confidence || 0) >= 0.65) out[id] = v;
    }
    return out;
  } catch (e) { return {}; }
}

let learningAttached = false;

function attachLearning() {
  if (learningAttached) return;
  learningAttached = true;

  document.addEventListener('blur', async function (e) {
    const el = e.target;
    if (!el || !el.matches || !el.matches('input, select, textarea')) return;
    if (!el.value || el.dataset.egramFilled === '1') return;
    if (AI_SENSITIVE_KEYS.indexOf(el.name || '') !== -1) return;

    const label = getLabelText(el);
    if (!label || label.length > 100) return;

    const data = await chrome.storage.local.get('manualFills');
    const manual = data.manualFills || {};
    const key = location.hostname + '::' + label;
    manual[key] = {
      label: label,
      value: el.value,
      count: (manual[key] ? manual[key].count : 0) + 1,
      lastSeen: Date.now()
    };
    await chrome.storage.local.set({ manualFills: manual });

    if (manual[key].count === 3) {
      showSuggestionToast(label, el.value);
    }
  }, true);
}

function showSuggestionToast(label, value) {
  if (document.getElementById('egram-ai-suggest')) return;
  const box = document.createElement('div');
  box.id = 'egram-ai-suggest';
  box.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:2147483647;background:#1e40af;color:#fff;padding:14px 18px;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.3);font-family:Arial;font-size:13px;max-width:300px;';
  box.innerHTML =
    '<div style="font-weight:bold;margin-bottom:6px;">Save this for next time?</div>' +
    '<div style="opacity:.85;margin-bottom:10px;">You have filled "' + label.slice(0, 60) + '" 3 times.</div>' +
    '<button id="egram-save-yes" style="background:#fff;color:#1e40af;border:none;padding:6px 12px;border-radius:5px;cursor:pointer;margin-right:6px;">Save</button>' +
    '<button id="egram-save-no" style="background:transparent;color:#fff;border:1px solid #fff;padding:6px 12px;border-radius:5px;cursor:pointer;">Later</button>';

  document.body.appendChild(box);
  document.getElementById('egram-save-yes').onclick = async function () {
    const data = await chrome.storage.local.get('profiles');
    const profiles = data.profiles || [];
    if (!profiles[0]) { box.remove(); return; }
    profiles[0].fields[label.replace(/\s+/g, '')] = value;
    await chrome.storage.local.set({ profiles: profiles });
    box.innerHTML = '<div style="font-weight:bold;">Saved to profile.</div>';
    setTimeout(function () { box.remove(); }, 1500);
  };
  document.getElementById('egram-save-no').onclick = function () { box.remove(); };
}

const VALIDATORS = {
  aadhaarNumber: function (v) { return /^\d{12}$/.test(v.replace(/\s/g, '')); },
  panNumber: function (v) { return /^[A-Z]{5}\d{4}[A-Z]$/.test(v.toUpperCase()); },
  mobile: function (v) { return /^\d{10}$/.test(v.replace(/\D/g, '')); },
  pincode: function (v) { return /^\d{6}$/.test(v); },
  ifscCode: function (v) { return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v.toUpperCase()); },
  email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); },
  dob: function (v) { const d = new Date(v); return !isNaN(d) && d < new Date(); }
};

function validateProfile(profile) {
  const issues = [];
  const fields = profile.fields || {};
  for (const key in VALIDATORS) {
    const v = fields[key];
    if (!v) continue;
    if (!VALIDATORS[key](String(v))) issues.push({ field: key, value: v, reason: 'Invalid format' });
  }
  return issues;
}

async function translateLabel(label) {
  if (!label) return label;
  if (/^[\x00-\x7F]+$/.test(label)) return label;

  const cache = await chrome.storage.local.get('translationCache');
  const tc = cache.translationCache || {};
  if (tc[label]) return tc[label];

  let translated = label;
  try {
    const s = await chrome.storage.local.get(['aiApiKey', 'aiProvider']);
    if (s.aiApiKey && s.aiProvider === 'gemini') {
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + s.aiApiKey;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Translate to English (only translation): ' + label }] }] })
      });
      const data = await res.json();
      translated = data.candidates[0].content.parts[0].text.trim();
    }
  } catch (e) {}

  tc[label] = translated;
  await chrome.storage.local.set({ translationCache: tc });
  return translated;
}

async function aiFillUnmatched(profile, matchedKeys, matchedEls) {
  const fields = extractFormSnapshot(matchedEls);
  if (!fields.length) return { aiFilled: [], provider: 'none' };

  for (let i = 0; i < fields.length; i++) {
    const original = fields[i].label;
    const tr = await translateLabel(original);
    if (tr !== original) fields[i].label = tr + ' [' + original + ']';
  }

  const profileData = scrubForAI(profile, matchedKeys);
  if (Object.keys(profileData).length === 0) return { aiFilled: [], provider: 'none' };

  const settings = await chrome.storage.local.get(['aiProvider', 'aiApiKey']);
  const provider = settings.aiProvider || 'ondevice';
  const apiKey = settings.aiApiKey || '';

  let mapping = {};
  let used = 'none';

  try {
    if (provider === 'ondevice' && hasOnDeviceAI()) {
      mapping = await mapWithOnDevice(fields, profileData);
      used = 'ondevice';
    } else if ((provider === 'gemini' || provider === 'openai') && apiKey) {
      mapping = await mapWithCloud(fields, profileData, apiKey, provider);
      used = provider;
    }
  } catch (e) {
    used = 'error';
  }

  const aiFilled = [];
  for (const id in mapping) {
    const el = document.querySelector('[data-egram-ai-id="' + id + '"]');
    if (!el) continue;
    const info = mapping[id];
    const ok = await fillInput(el, info.value);
    if (ok) {
      el.style.backgroundColor = '#cce5ff';
      el.dataset.egramFilled = '1';
      aiFilled.push({ key: info.profileKey, value: info.value, confidence: info.confidence });
    }
  }

  return { aiFilled: aiFilled, provider: used };
}

window.aiFillUnmatched = aiFillUnmatched;
window.validateProfile = validateProfile;
window.attachLearning = attachLearning;
window.translateLabel = translateLabel;
window.hasOnDeviceAI = hasOnDeviceAI;