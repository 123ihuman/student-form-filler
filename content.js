// content.js — final

function normalize(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
}

function sleep(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

function getLabelText(input) {
  let label = '';

  // 1. label[for=id]
  if (input.id) {
    const l = document.querySelector('label[for="' + input.id + '"]');
    if (l) label = l.innerText;
  }

  // 2. Wrapping label
  if (!label && input.closest('label')) label = input.closest('label').innerText;

  // 3. aria-labelledby
  if (!label) {
    const lby = input.getAttribute('aria-labelledby');
    if (lby) {
      const el = document.getElementById(lby);
      if (el) label = el.innerText;
    }
  }

  // 4. Angular custom-element "label" attribute (SSC app-dropdown uses this)
  if (!label && input.getAttribute && input.getAttribute('label')) {
    label = input.getAttribute('label');
  }
  if (!label) {
    let el = input;
    let hops = 0;
    while (el && hops < 4) {
      if (el.getAttribute && el.getAttribute('label')) { label = el.getAttribute('label'); break; }
      el = el.parentElement;
      hops++;
    }
  }

  // 5. Table cell / row
  if (!label) {
    const td = input.closest('td');
    if (td) {
      let prev = td.previousElementSibling;
      let hops = 0;
      while (prev && hops < 3) {
        const t = (prev.innerText || '').trim();
        if (t && t.length > 2 && t.length < 200) { label = t; break; }
        prev = prev.previousElementSibling;
        hops++;
      }
    }
  }
  if (!label) {
    const tr = input.closest('tr');
    if (tr) {
      const tds = tr.querySelectorAll('td');
      const parts = [];
      for (let i = 0; i < tds.length; i++) {
        if (tds[i].contains(input)) break;
        const t = (tds[i].innerText || '').trim();
        if (t) parts.push(t);
      }
      if (parts.length) label = parts.join(' ');
    }
  }

  // 6. Previous sibling
  if (!label) {
    let prev = input.previousElementSibling;
    let hops = 0;
    while (prev && hops < 3 && !label) {
      if (prev.innerText && prev.innerText.length < 100) label = prev.innerText;
      prev = prev.previousElementSibling;
      hops++;
    }
  }

  // 7. Walk-up fallback for weak labels
  const trimmed = (label || '').trim();
  const isWeak = !trimmed ||
    trimmed.length < 12 ||
    /^(yes|no|y|n|true|false|male|female|other|select|choose)$/i.test(trimmed) ||
    /as recorded|type here|enter here|^dd[\/\-]|^mm[\/\-]|^yyyy/i.test(trimmed) ||
    input.type === 'radio' ||
    input.type === 'checkbox';

  if (isWeak) {
    let el = input;
    let hops = 0;
    let better = '';
    while (el && hops < 7) {
      el = el.parentElement;
      if (!el) break;
      const labels = el.querySelectorAll(':scope > label, :scope > .control-label, :scope > .form-label, :scope > legend');
      for (let i = 0; i < labels.length; i++) {
        if (labels[i].contains(input)) continue;
        const t = (labels[i].innerText || '').trim();
        if (t.length > 3 && t.length < 200 && !/as recorded/i.test(t)) { better = t; break; }
      }
      if (better) break;
      const parent = el.parentElement;
      if (parent) {
        const sibs = parent.children;
        for (let i = 0; i < sibs.length; i++) {
          if (sibs[i] === el) break;
          const t = (sibs[i].innerText || '').trim();
          if (t.length > 3 && t.length < 200 && !/as recorded/i.test(t)) better = t;
        }
        if (better) break;
      }
      hops++;
    }
    if (better) label = better;
  }

  if (!label) label = input.getAttribute('aria-label') || '';
  if (!label) label = input.getAttribute('placeholder') || '';
  if (!label) label = input.getAttribute('title') || '';
  if (!label) label = input.name || input.id || '';

  // Strip leading enumerations: "8. ", "10. ", "a. ", "(i) "
  label = String(label)
    .replace(/^\s*\(?[ivx]+\)\.?\s+/i, '')
    .replace(/^\s*\d+[\.\)]\s+/, '')
    .replace(/^\s*[a-z][\.\)]\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  return normalize(label);
}

function matchField(input, fieldKey, aliases) {
  const rawClues = [
    input.name || '',
    input.id || '',
    input.placeholder || '',
    input.getAttribute('aria-label') || '',
    getLabelText(input) || ''
  ].filter(Boolean);

  const clues = [];
  for (let i = 0; i < rawClues.length; i++) {
    const c = rawClues[i];
    clues.push(c);
    clues.push(c.replace(/([a-z])([A-Z])/g, '$1 $2'));
    clues.push(c.replace(/([a-zA-Z])(\d)/g, '$1 $2'));
    clues.push(c.replace(/[_\-.]+/g, ' '));
    clues.push(c.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_\-.]+/g, ' '));
  }

  let bestScore = 0;
  for (let i = 0; i < clues.length; i++) {
    if (typeof window.smartLabelMatch === 'function') {
      const s = window.smartLabelMatch(clues[i], fieldKey, aliases);
      if (s > bestScore) bestScore = s;
    } else {
      const na = normalize(clues[i]).replace(/\s/g, '');
      const aliasList = aliases[fieldKey] || [];
      for (let j = 0; j < aliasList.length; j++) {
        const a = normalize(aliasList[j]).replace(/\s/g, '');
        if (a && na.indexOf(a) !== -1) { bestScore = 1; break; }
      }
    }
  }
  return { matched: bestScore >= 0.72, score: bestScore };
}

function setNativeValue(element, value) {
  const valueSetter = Object.getOwnPropertyDescriptor(element, 'value') && Object.getOwnPropertyDescriptor(element, 'value').set;
  const prototype = Object.getPrototypeOf(element);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value') && Object.getOwnPropertyDescriptor(prototype, 'value').set;
  if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value);
  } else if (valueSetter) {
    valueSetter.call(element, value);
  } else {
    element.value = value;
  }
}

function realClick(el) {
  try {
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const opts = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y, button: 0 };
    try { el.dispatchEvent(new PointerEvent('pointerdown', Object.assign({ pointerId: 1, pointerType: 'mouse' }, opts))); } catch (e) {}
    try { el.dispatchEvent(new MouseEvent('mousedown', opts)); } catch (e) {}
    try { el.dispatchEvent(new PointerEvent('pointerup', Object.assign({ pointerId: 1, pointerType: 'mouse' }, opts))); } catch (e) {}
    try { el.dispatchEvent(new MouseEvent('mouseup', opts)); } catch (e) {}
    try { el.dispatchEvent(new MouseEvent('click', opts)); } catch (e) {}
    try { el.click(); } catch (e) {}
  } catch (e) {}
}

async function typeCharByChar(input, value) {
  try {
    input.focus();
    input.click();

    setNativeValue(input, '');
    input.dispatchEvent(new Event('input', { bubbles: true }));

    const str = String(value);
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];

      input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: ch, char: ch }));
      input.dispatchEvent(new KeyboardEvent('keypress', { bubbles: true, cancelable: true, key: ch, char: ch }));

      const newVal = input.value + ch;
      setNativeValue(input, newVal);

      try {
        input.dispatchEvent(new InputEvent('input', {
          bubbles: true, cancelable: true, inputType: 'insertText', data: ch
        }));
      } catch (e) {
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }

      input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, cancelable: true, key: ch, char: ch }));

      await sleep(15);
    }

    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));

    const landed = (input.value || '').length;
    return landed >= String(value).length * 0.8;
  } catch (e) {
    return false;
  }
}

function dispatchFull(input) {
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'a' }));
  input.dispatchEvent(new KeyboardEvent('keypress', { bubbles: true, key: 'a' }));
  input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'a' }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.dispatchEvent(new Event('blur', { bubbles: true }));
}

function isPlaceholderOption(opt) {
  const t = (opt.text || '').toLowerCase().trim();
  const v = (opt.value || '').toLowerCase().trim();
  if (!t) return true;
  if (v === '') return true;
  if (t === 'select' || t === '--select--' || t === '-- select --' || t === '-select-') return true;
  if (t === 'choose' || t === 'choose...' || t === 'please select' || t === 'please choose') return true;
  if (t === 'select option' || t === 'select one') return true;
  return false;
}

function parseRobustDate(value) {
  if (!value) return null;
  const v = String(value).trim();
  let d = new Date(v);
  if (!isNaN(d.getTime())) return d;
  const m1 = v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m1) {
    let yy = parseInt(m1[3], 10);
    if (yy < 100) yy += yy < 50 ? 2000 : 1900;
    d = new Date(yy, parseInt(m1[2], 10) - 1, parseInt(m1[1], 10));
    if (!isNaN(d.getTime())) return d;
  }
  const m2 = v.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (m2) {
    d = new Date(parseInt(m2[1], 10), parseInt(m2[2], 10) - 1, parseInt(m2[3], 10));
    if (!isNaN(d.getTime())) return d;
  }
  const m3 = v.match(/^(\d{1,2})[-\s]([A-Za-z]{3,})[-\s](\d{2,4})$/);
  if (m3) {
    const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const mon = m3[2].toLowerCase().slice(0, 3);
    const mi = months.indexOf(mon);
    if (mi !== -1) {
      let yy = parseInt(m3[3], 10);
      if (yy < 100) yy += yy < 50 ? 2000 : 1900;
      d = new Date(yy, mi, parseInt(m3[1], 10));
      if (!isNaN(d.getTime())) return d;
    }
  }
  return null;
}

function formatDateForField(input, dateObj) {
  const clues = (input.placeholder || '') + ' ' + (input.getAttribute('aria-label') || '') + ' ' + (input.name || '') + ' ' + getLabelText(input);
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yyyy = dateObj.getFullYear();
  const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][dateObj.getMonth()];
  if (/dd[-\s]?mon[-\s]?yyyy/i.test(clues)) return dd + '-' + mon + '-' + yyyy;
  if (/yyyy[-\/]mm[-\/]dd/i.test(clues)) return yyyy + '-' + mm + '-' + dd;
  if (/mm[-\/]dd[-\/]yyyy/i.test(clues)) return mm + '/' + dd + '/' + yyyy;
  if (/dd[-\/]mm[-\/]yyyy/i.test(clues)) return dd + '-' + mm + '-' + yyyy;
  return dd + '/' + mm + '/' + yyyy;
}

function sortKeysByPriority(keys, aliases) {
  return keys.slice().sort(function (a, b) {
    const aAliases = aliases[a] || [];
    const bAliases = aliases[b] || [];
    const aMax = aAliases.reduce(function (m, x) { return Math.max(m, x.length); }, 0);
    const bMax = bAliases.reduce(function (m, x) { return Math.max(m, x.length); }, 0);
    return bMax - aMax;
  });
}

async function fillCustomSelect(container, value) {
  try {
    const realInput = container.querySelector('input:not([type="hidden"])');
    if (realInput && !realInput.readOnly && realInput.type !== 'button') {
      return false;
    }

    container.scrollIntoView({ block: 'center' });
    await sleep(200);

    const targetValue = String(value || '').trim();
    if (!targetValue) return false;

    const trigger =
      container.querySelector('.value-area') ||
      container.querySelector('[role="combobox"]') ||
      container.querySelector('.ng-value-container') ||
      container;

    const beforeSet = new Set();
    document.querySelectorAll('*').forEach(function (el) {
      if (el.offsetParent !== null && el.offsetHeight > 0) beforeSet.add(el);
    });

    try { trigger.focus(); } catch (e) {}
    await sleep(60);
    try { trigger.click(); } catch (e) {}

    const panel = await waitForNewPanel(beforeSet, 1500);
    if (!panel) {
      try { trigger.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window })); } catch (e) {}
      try { trigger.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window })); } catch (e) {}
      try { trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window })); } catch (e) {}
    }
    const panel2 = panel || await waitForNewPanel(beforeSet, 1200);
    if (!panel2) {
      console.log('[AI Filler] No panel detected for:', targetValue);
      return false;
    }

    const options = collectLeafOptions(panel2);
    if (!options.length) {
      console.log('[AI Filler] Panel opened but no options found for:', targetValue);
      try { document.body.click(); } catch (e) {}
      return false;
    }

    const nv = normalize(targetValue);
    let bestOpt = null;
    let bestScore = 0;

    for (let i = 0; i < options.length; i++) {
      const el = options[i];
      const text = el.__text;
      if (!text || text.length > 200) continue;
      if (/^(select|--select--|choose|please select)$/i.test(text)) continue;

      const nt = normalize(text);
      let score = 0;
      if (nt === nv) score = 1;
      else if (nt.indexOf(nv) !== -1 || nv.indexOf(nt) !== -1) score = 0.85;
      else if (typeof window.smartSelectMatch === 'function') {
        const m = window.smartSelectMatch({ options: [{ text: text, value: text }] }, targetValue);
        if (m) score = 0.8;
      }

      if (score > bestScore) {
        bestScore = score;
        bestOpt = el;
      }
    }

    if (!bestOpt || bestScore < 0.7) {
      console.log('[AI Filler] No matching option for:', targetValue, 'options:', options.map(function (o) { return o.__text; }).join(' | '));
      try { document.body.click(); } catch (e) {}
      return false;
    }

    const optText = bestOpt.__text;
    try { bestOpt.scrollIntoView({ block: 'center' }); } catch (e) {}
    await sleep(80);

    try { bestOpt.click(); } catch (e) {}
    try { bestOpt.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window })); } catch (e) {}
    try { bestOpt.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window })); } catch (e) {}

    await sleep(400);

    const shown = (container.innerText || container.textContent || '').replace(/\s+/g, ' ').trim();
    if (normalize(shown).indexOf(normalize(optText)) !== -1) return true;

    return false;
  } catch (e) {
    console.log('[AI Filler] fillCustomSelect error:', e.message);
    return false;
  }
}

async function waitForNewPanel(beforeSet, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await sleep(120);

    const all = document.querySelectorAll('div, ul, section, app-dropdown > div');
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      if (beforeSet.has(el)) continue;
      if (el.offsetParent === null || el.offsetHeight < 20) continue;

      const leaves = collectLeafOptions(el);
      if (leaves.length >= 2) return el;
    }
  }
  return null;
}

function collectLeafOptions(parent) {
  const results = [];
  const seenText = new Set();
  const all = parent.querySelectorAll('*');

  for (let i = 0; i < all.length; i++) {
    const el = all[i];
    if (el.offsetParent === null || el.offsetHeight <= 0) continue;

    const text = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text || text.length > 200 || text.length < 1) continue;
    if (seenText.has(text)) continue;

    const childCount = el.querySelectorAll('*').length;
    if (childCount > 3) continue;

    el.__text = text;
    seenText.add(text);
    results.push(el);
  }
  return results;
}

function matchCheckboxLabel(checkbox, value) {
  const v = String(value || '').toLowerCase().trim();
  if (!v) return false;

  const candidates = [];

  if (checkbox.id) {
    const l = document.querySelector('label[for="' + checkbox.id + '"]');
    if (l) candidates.push(l.innerText || '');
  }
  const wrap = checkbox.closest('label');
  if (wrap) candidates.push(wrap.innerText || '');
  if (checkbox.nextElementSibling) {
    candidates.push(checkbox.nextElementSibling.innerText || checkbox.nextElementSibling.textContent || '');
  }
  candidates.push(checkbox.getAttribute('aria-label') || '');
  candidates.push(checkbox.getAttribute('title') || '');
  candidates.push(checkbox.value || '');

  const cleaned = candidates.map(function (c) {
    return String(c).replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  }).filter(Boolean);

  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === v) return true;
  }

  const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('(^|[^a-z0-9])' + escaped + '([^a-z0-9]|$)', 'i');
  for (let i = 0; i < cleaned.length; i++) {
    if (re.test(cleaned[i])) return true;
  }

  return false;
}

async function fillInput(input, value) {
  if (!value || input.type === 'file' || input.type === 'hidden') return false;
  if (input.disabled || input.readOnly) return false;

  if (input.value && input.value.trim() === String(value).trim()) {
    input.style.backgroundColor = '#d4edda';
    return true;
  }

  if (input.type === 'radio') {
    let optionRaw = '';

    const wrap = input.closest('label');
    if (wrap && wrap.innerText) optionRaw = wrap.innerText;

    if (!optionRaw && input.id) {
      const l = document.querySelector('label[for="' + input.id + '"]');
      if (l && l.innerText) optionRaw = l.innerText;
    }

    if (!optionRaw && input.nextElementSibling) {
      const ns = input.nextElementSibling;
      if (ns.innerText) optionRaw = ns.innerText;
      else if (ns.textContent) optionRaw = ns.textContent;
    }

    if (!optionRaw && input.parentElement) {
      const clone = input.parentElement.cloneNode(true);
      const strip = clone.querySelectorAll('input, select, textarea, svg, button, img');
      for (let i = 0; i < strip.length; i++) strip[i].remove();
      optionRaw = (clone.innerText || clone.textContent || '').trim();
    }

    if (!optionRaw) optionRaw = input.value || '';

    let optionText = String(optionRaw)
      .replace(/[^\x20-\x7E]/g, ' ')
      .replace(/\s+/g, ' ')
      .split('/')[0]
      .trim()
      .toLowerCase();

    optionText = optionText.replace(/[\-:.,;*]+$/, '').trim();

    const target = String(value || '').trim().toLowerCase();

    let shouldCheck = false;

    if (target && optionText) {
      if (optionText === target) shouldCheck = true;

      if (!shouldCheck) {
        const yesV = ['yes', 'y', 'true', '1'];
        const noV = ['no', 'n', 'false', '0'];
        if (yesV.indexOf(target) !== -1 && (optionText === 'yes' || optionText === 'y' || optionText === 'true')) shouldCheck = true;
        if (noV.indexOf(target) !== -1 && (optionText === 'no' || optionText === 'n' || optionText === 'false')) shouldCheck = true;
      }

      if (!shouldCheck) {
        const SYN = {
          'general':    ['general', 'gen', 'ur', 'unreserved', 'open'],
          'ur':         ['ur', 'general', 'unreserved', 'open'],
          'female':     ['female', 'f', 'girl', 'woman'],
          'male':       ['male', 'm', 'boy', 'man'],
          'unmarried':  ['unmarried', 'single', 'never married'],
          'married':    ['married'],
          'widow':      ['widow', 'widowed'],
          'divorced':   ['divorced'],
          'destitute':  ['destitute'],
          'indian':     ['indian', 'india'],
          'obc':        ['obc'],
          'sc':         ['sc', 'scheduled caste'],
          'st':         ['st', 'scheduled tribe'],
          'ews':        ['ews'],
          'direct':     ['direct'],
          'institute':  ['institute']
        };
        const tSyn = SYN[target] || [target];
        const oSyn = SYN[optionText] || [optionText];
        for (let i = 0; i < tSyn.length; i++) {
          if (oSyn.indexOf(tSyn[i]) !== -1) { shouldCheck = true; break; }
        }
      }

      if (!shouldCheck && target.length >= 3 && optionText.length >= 3) {
        const re = new RegExp('(^|[^a-z])' + target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z]|$)');
        if (re.test(optionText)) shouldCheck = true;
        if (!shouldCheck) {
          const re2 = new RegExp('(^|[^a-z])' + optionText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z]|$)');
          if (re2.test(target)) shouldCheck = true;
        }
      }
    }

    if (!shouldCheck) return false;

    try {
      const label = input.closest('label');
      if (label) label.click();
      else input.click();
    } catch (e) {}

    if (!input.checked) {
      input.checked = true;
    }
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    input.style.backgroundColor = '#d4edda';
    return true;
  }

  if (input.type === 'checkbox') {
    const val = String(value || '').toLowerCase().trim();
    const yesVals = ['yes', 'true', '1', 'y', 'agree'];
    const noVals = ['no', 'false', '0', 'n', 'disagree'];

    let ownText = '';
    if (input.id) {
      const l = document.querySelector('label[for="' + input.id + '"]');
      if (l) ownText += ' ' + (l.innerText || '');
    }
    const wrapLabel = input.closest('label');
    if (wrapLabel) ownText += ' ' + (wrapLabel.innerText || '');
    if (input.parentElement) ownText += ' ' + (input.parentElement.innerText || '');
    ownText = ownText.toLowerCase().trim();

    const isConsentBox = /agree|consent|declare|declaration|accept|authenticate|authorise|authorize|undertake|confirm|i hereby|i have read|terms and conditions/i.test(ownText);

    let shouldCheck = null;

    if (yesVals.indexOf(val) !== -1) {
      shouldCheck = true;
    } else if (noVals.indexOf(val) !== -1) {
      shouldCheck = false;
    } else if (val) {
      if (isConsentBox) {
        shouldCheck = true;
      } else if (!matchCheckboxLabel(input, val)) {
        return false;
      } else {
        shouldCheck = true;
      }
    } else {
      return false;
    }

    if (input.checked !== shouldCheck) {
      const wrap = input.closest('label');
      if (wrap) wrap.click();
      else input.click();

      if (input.checked !== shouldCheck) {
        input.checked = shouldCheck;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    input.style.backgroundColor = '#d4edda';
    return true;
  }

  if (input.type === 'date') {
    const d = parseRobustDate(value);
    if (d && !isNaN(d.getTime())) {
      const iso = d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
      setNativeValue(input, iso);
      dispatchFull(input);
      input.style.backgroundColor = '#d4edda';
      return true;
    }
    return false;
  }

    const isWidgetDate = input.classList.contains('hasDatepicker') ||
    input.classList.contains('datepicker') ||
    input.classList.contains('date-picker') ||
    input.hasAttribute('angular-mydatepicker') ||
    input.hasAttribute('readonly') ||
    (input.nextElementSibling && input.nextElementSibling.classList &&
     (input.nextElementSibling.classList.contains('calendar-icon') ||
      input.nextElementSibling.querySelector && input.nextElementSibling.querySelector('.calendar-icon'))) ||
    (input.parentElement && input.parentElement.querySelector &&
     input.parentElement.querySelector('.calendar-icon, .datepicker-trigger, [class*="calendar"]')) ||
    /date|dob|birth/i.test(getLabelText(input) + ' ' + (input.name || '') + ' ' + (input.id || ''));

  if (isWidgetDate) {
    const d = parseRobustDate(value);
    if (d && !isNaN(d.getTime())) {
      if (typeof window.setDateField === 'function') {
        const r = await window.setDateField(input, d);
        if (r && r.success) {
          input.style.backgroundColor = '#d4edda';
          return true;
        }
      }
      const wasRO = input.readOnly;
      input.readOnly = false;
      input.removeAttribute('readonly');
      const txt = formatDateForField(input, d);
      setNativeValue(input, txt);
      input.focus();
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('blur', { bubbles: true }));
      if (wasRO) input.setAttribute('readonly', '');
      input.style.backgroundColor = '#d4edda';
      return true;
    }
    return false;
  }

  const inputName = (input.name || '').toLowerCase();
  const inputId = (input.id || '').toLowerCase();

  const labelForKey = getLabelText(input);
  const isMaskedField =
    /aadhaar|aadhar|\buid\b|\bvid\b|\bpan\b|mobile|phone|contact|pincode|\bpin\b|zip|ifsc|account number|account no/i
      .test(inputName + ' ' + inputId + ' ' + labelForKey) &&
    input.type !== 'password' &&
    input.type !== 'email' &&
    input.type !== 'checkbox' &&
    input.type !== 'radio';

  if (isMaskedField) {
    const stripped = String(value).replace(/\s+/g, '');
    if (stripped.length >= 4) {
      let ok = await typeCharByChar(input, stripped);

      if (!ok) {
        try {
          input.focus();
          input.select();
          document.execCommand && document.execCommand('insertText', false, stripped);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          ok = (input.value || '').replace(/\s/g, '').length >= stripped.length * 0.8;
        } catch (e) {}
      }

      if (ok) {
        input.style.backgroundColor = '#d4edda';
        return true;
      }
    }
  }

  const isPasswordField = input.type === 'password' ||
    inputName.indexOf('password') !== -1 ||
    inputId.indexOf('password') !== -1 ||
    inputName.indexOf('pwd') !== -1;

  if (isPasswordField) {
    try {
      input.focus();
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(input, String(value));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('keyup', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('blur', { bubbles: true }));
      input.style.backgroundColor = '#d4edda';
      return true;
    } catch (e) {
      return false;
    }
  }

  if (input.tagName === 'SELECT') {
    const realOptions = Array.from(input.options).filter(function (o) {
      return !isPlaceholderOption(o);
    });
    if (!realOptions.length) return false;

    let chosen = null;
    if (typeof window.smartSelectMatch === 'function') {
      chosen = window.smartSelectMatch({ options: realOptions }, value);
    }
    if (!chosen) {
      const val = normalize(value);
      chosen = realOptions.find(function (o) {
        return normalize(o.value) === val || normalize(o.text) === val;
      }) || realOptions.find(function (o) {
        return normalize(o.text).indexOf(val) !== -1 || val.indexOf(normalize(o.text)) !== -1;
      });
    }
    if (chosen) {
      setNativeValue(input, chosen.value);
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.style.backgroundColor = '#d4edda';
      return true;
    }
    return false;
  }

  if (input.type === 'number') {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setNativeValue(input, String(num));
      dispatchFull(input);
      input.style.backgroundColor = '#d4edda';
      return true;
    }
  }

  input.focus();
  setNativeValue(input, String(value));
  dispatchFull(input);
  input.style.backgroundColor = '#d4edda';
  return true;
}

async function fillForm(profile) {
  if (typeof window.attachLearning === 'function') window.attachLearning();

  document.querySelectorAll('[data-egram-filled]').forEach(function (el) {
    delete el.dataset.egramFilled;
  });

  const issues = (typeof window.validateProfile === 'function') ? window.validateProfile(profile) : [];

  const fields = profile.fields || {};
  const siteRule = (typeof window.getSiteRule === 'function') ? window.getSiteRule() : null;
  const aliases = Object.assign({}, window.FIELD_ALIASES || {});
  if (siteRule && siteRule.extraAliases) {
    for (const k in siteRule.extraAliases) {
      aliases[k] = (aliases[k] || []).concat(siteRule.extraAliases[k]);
    }
  }

  const filled = [];
  const missed = [];
  const matchedKeys = new Set();
  const matchedEls = new Set();

  const sortedKeys = sortKeysByPriority(Object.keys(fields), aliases);

  const inputs = document.querySelectorAll(
    'input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=file]), select, textarea'
  );

  const labelToKey = {};

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    if (input.disabled || input.readOnly) continue;
    if (input.offsetParent === null && input.type !== 'radio' && input.type !== 'checkbox') continue;
    if (input.dataset.egramFilled === '1') continue;

    const labelText = getLabelText(input);
    if (/age as on|age in years|years.*months.*days/i.test(labelText)) continue;

    const strippedLabel = labelText
      .replace(/^\s*\(?[ivx]+\)\.?\s+/i, '')
      .replace(/^\s*\d+[\.\)]\s+/, '')
      .replace(/^\s*[a-z][\.\)]\s+/i, '')
      .replace(/^(verify|confirm|re enter|reenter|retype|re type|repeat)\s+/, '')
      .replace(/\s+/g, ' ')
      .trim();

    let matchedKey = null;
    if (strippedLabel && labelToKey[strippedLabel]) {
      matchedKey = labelToKey[strippedLabel];
    } else {
      let bestScore = 0;
      for (let k = 0; k < sortedKeys.length; k++) {
        const key = sortedKeys[k];
        const r = matchField(input, key, aliases);
        if (r.matched && r.score > bestScore) {
          bestScore = r.score;
          matchedKey = key;
        }
      }
      if (!matchedKey) continue;
      if (bestScore < 0.72) continue;
      if (strippedLabel) labelToKey[strippedLabel] = matchedKey;
    }

        let value = fields[matchedKey];
    if (siteRule && siteRule.fieldOverrides && siteRule.fieldOverrides[matchedKey]) {
      value = siteRule.fieldOverrides[matchedKey];
    }
    if (!value) continue;

    let finalValue = value;
    if (/date|dob|birth/i.test(matchedKey) && input.type !== 'date') {
      const d = parseRobustDate(value);
      if (d && !isNaN(d.getTime())) finalValue = formatDateForField(input, d);
    }

    const ok = await fillInput(input, finalValue);
    if (ok) {
      filled.push(matchedKey);
      matchedKeys.add(matchedKey);
      matchedEls.add(input);
      input.dataset.egramFilled = '1';
    } else {
      missed.push(matchedKey);
      input.style.backgroundColor = '#fff3cd';
    }
  }

  // ---- AUTO-TICK: any remaining consent/declaration checkboxes ----
  const remainingCbs = document.querySelectorAll('input[type="checkbox"]:not([data-egram-filled="1"])');
  for (let ci = 0; ci < remainingCbs.length; ci++) {
    const cb = remainingCbs[ci];
    if (cb.disabled || cb.checked) continue;

    let ctx = '';
    if (cb.id) {
      const l = document.querySelector('label[for="' + cb.id + '"]');
      if (l) ctx += ' ' + (l.innerText || '');
    }
    const wrapCb = cb.closest('label');
    if (wrapCb) ctx += ' ' + (wrapCb.innerText || '');
    if (cb.parentElement) ctx += ' ' + (cb.parentElement.innerText || '');
    ctx = ctx.toLowerCase();

    if (/agree|consent|declare|declaration|accept|authenticate|authorise|authorize|undertake|confirm|i hereby|i have read|terms and conditions/i.test(ctx)) {
      try {
        if (wrapCb) wrapCb.click();
        else cb.click();
        if (!cb.checked) {
          cb.checked = true;
          cb.dispatchEvent(new Event('change', { bubbles: true }));
        }
        cb.style.backgroundColor = '#d4edda';
        cb.dataset.egramFilled = '1';
        filled.push('consent-checkbox');
      } catch (e) {}
    }
  }

  // ---- PASS 1.5: custom non-native dropdowns ----
  try { document.body.click(); } catch (e) {}
  await sleep(200);

  const customDropsAll = document.querySelectorAll(
    'app-dropdown, ' +
    '.ng-dropdown:not(app-dropdown *), ' +
    '.form-control[role="combobox"], [role="combobox"]:not(input):not(select), ' +
    '.p-dropdown, .mat-select, .ant-select-selection, .select2-selection__rendered, ' +
    '.dropdown-toggle:not(a):not(button), [aria-haspopup="listbox"]:not(input):not(select)'
  );

  const customDrops = [];
  for (let i = 0; i < customDropsAll.length; i++) {
    const cd = customDropsAll[i];

    const realInput = cd.querySelector('input:not([type="hidden"]):not([type="button"]):not([type="submit"])');
    if (realInput && realInput.type !== 'radio' && realInput.type !== 'checkbox' && !realInput.readOnly) continue;

    if (cd.querySelector('input[type="radio"], input[type="checkbox"]')) continue;

    customDrops.push(cd);
  }

  for (let round = 0; round < 1; round++) {
    for (let i = 0; i < customDrops.length; i++) {
      const cd = customDrops[i];
      if (cd.dataset.egramFilled === '1') continue;
      if (cd.offsetParent === null) continue;

      let matchedKey = null;
      let bestScore = 0;
      for (let k = 0; k < sortedKeys.length; k++) {
        const key = sortedKeys[k];
        const r = matchField(cd, key, aliases);
        if (r.matched && r.score > bestScore) {
          bestScore = r.score;
          matchedKey = key;
        }
      }
            if (!matchedKey) continue;
      let value = fields[matchedKey];
      if (siteRule && siteRule.fieldOverrides && siteRule.fieldOverrides[matchedKey]) {
        value = siteRule.fieldOverrides[matchedKey];
      }
      if (!value) continue;

      const ok = await fillCustomSelect(cd, value);
      if (ok) {
        filled.push(matchedKey + ' (custom-r' + (round + 1) + ')');
        cd.dataset.egramFilled = '1';
      } else {
        console.log('[AI Filler] Round ' + (round + 1) + ' failed:', matchedKey, '=', value);
      }
    }
  }

  // ---- PASS 2: cascading retry (2 rounds, short waits) ----
  const retryDelays = [400, 900];
  for (let round = 0; round < retryDelays.length; round++) {
    await sleep(retryDelays[round]);

    const retrySelects = document.querySelectorAll('select');
    let pendingSelects = 0;
    for (let ps = 0; ps < retrySelects.length; ps++) {
      if (retrySelects[ps].dataset.egramFilled !== '1' && !retrySelects[ps].disabled && retrySelects[ps].offsetParent !== null) {
        pendingSelects++;
      }
    }
    if (pendingSelects === 0) break;

    let didFill = 0;

    for (let i = 0; i < retrySelects.length; i++) {
      const sel = retrySelects[i];
      if (sel.dataset.egramFilled === '1') continue;
      if (sel.disabled) continue;
      if (sel.offsetParent === null) continue;

      const curOpt = sel.options[sel.selectedIndex];
      const currentIsPlaceholder = !curOpt || isPlaceholderOption(curOpt) || !sel.value;
      if (!currentIsPlaceholder) continue;

      const realOptions = Array.from(sel.options).filter(function (o) {
        return !isPlaceholderOption(o);
      });
      if (!realOptions.length) continue;

      let matchedKey = null;
      let bestScore = 0;
      for (let k = 0; k < sortedKeys.length; k++) {
        const key = sortedKeys[k];
        const r = matchField(sel, key, aliases);
        if (r.matched && r.score > bestScore) {
          bestScore = r.score;
          matchedKey = key;
        }
      }
            if (!matchedKey) continue;
      let value = fields[matchedKey];
      if (siteRule && siteRule.fieldOverrides && siteRule.fieldOverrides[matchedKey]) {
        value = siteRule.fieldOverrides[matchedKey];
      }
      if (!value) continue;

      const ok = await fillCustomSelect(cd, value);
      if (ok) {
        filled.push(matchedKey + ' (retry-' + (round + 1) + ')');
        sel.dataset.egramFilled = '1';
        didFill++;
      }
    }

    if (didFill === 0 && round > 0) break;
  }

  if (fields.password) {
    const pwInputs = document.querySelectorAll('input[type="password"]');
    for (let i = 0; i < pwInputs.length; i++) {
      const el = pwInputs[i];
      if (el.dataset.egramFilled === '1' || el.value) continue;
      try {
        el.focus();
        const ns = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        ns.call(el, String(fields.password));
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));
        el.style.backgroundColor = '#d4edda';
        el.dataset.egramFilled = '1';
        filled.push('password (mirror)');
      } catch (e) {}
    }
  }

  let aiFilled = [];
  let aiProvider = 'none';
  try {
    if (typeof window.aiFillUnmatched === 'function') {
      const r = await window.aiFillUnmatched(profile, matchedKeys, matchedEls);
      aiFilled = r.aiFilled || [];
      aiProvider = r.provider || 'none';
    }
  } catch (e) {}

    let fileResults = { uploaded: [], skipped: [], failed: [] };
  try {
    const skipFiles = siteRule && siteRule.disableAutoFileInject === true;
    if (!skipFiles && typeof window.fillAllFileInputs === 'function') {
      fileResults = await window.fillAllFileInputs(profile);
    } else if (skipFiles) {
      console.log('[AI Filler] Auto file inject disabled for this site — use panel buttons.');
    }
  } catch (e) {}

  return {
    success: filled.length + aiFilled.length + fileResults.uploaded.length > 0,
    filled: filled,
    missed: missed,
    aiFilled: aiFilled,
    aiProvider: aiProvider,
    validationIssues: issues,
    files: fileResults
  };
}

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.action === 'fillFromPanel') {
    (async function () {
      try {
        const result = await fillForm(msg.profile);
        sendResponse(result);
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (msg.action === 'fill') {
    (async function () {
      try {
        const result = await fillForm(msg.profile);
        sendResponse(result);
      } catch (err) {
        sendResponse({
          success: false,
          error: err.message,
          filled: [],
          missed: [],
          aiFilled: [],
          files: { uploaded: [], skipped: [], failed: [] }
        });
      }
    })();
    return true;
  }
  return true;
});