// smartMatch.js — smart dropdown + label matching with synonyms

window.SYNONYMS = window.SYNONYMS || {};
window.SYNONYMS = {
  // ---- Education Boards ----
  'cbse': ['cbse', 'central board of secondary education'],
  'icse': ['icse', 'cisce', 'indian certificate of secondary education'],
  'state board': ['state board', 'state', 'ssc', 'sslc', 'board of secondary education'],
  'matriculation': ['matriculation', '10th', 'class 10', 'ssc', 'sslc', 'tenth', 'secondary'],
  'general': ['general', 'gen', 'ur', 'unreserved', 'open'],
  'ur': ['ur', 'unreserved', 'general', 'open'],
  'ews': ['ews', 'economically weaker section', 'gen ews'],
  'indian': ['indian', 'india', 'bharatiya'],
  'unmarried': ['unmarried', 'single', 'never married', 'avivahit'],
  'married': ['married', 'vivahit'],
  'widow': ['widow', 'widowed', 'vidhwa'],
  'divorced': ['divorced', 'talakshuda'],
  'higher secondary': ['higher secondary', '12th', 'class 12', 'intermediate', 'puc', 'hsc', 'senior secondary', '10+2', 'plus two'],
  'graduation': ['graduation', 'bachelor', 'ug', 'degree', 'b.a', 'b.sc', 'b.com', 'b.tech', 'undergraduate'],
  'post graduation': ['post graduation', 'pg', 'master', 'masters', 'm.a', 'm.sc', 'm.com', 'm.tech'],
  'higher secondary 10+2': ['higher secondary (10+2)', 'higher secondary', '12th', 'class 12', 'hsc', 'intermediate', 'puc', '10+2'],
  'secondary': ['secondary', '10th', 'class 10', 'sslc', 'ssc', 'matriculation'],
  '10th pass': ['10th pass', '10th', 'class 10', 'sslc', 'ssc', 'matriculation', 'secondary'],
  '12th pass': ['12th pass', '12th', 'class 12', 'higher secondary', 'higher secondary (10+2)', 'intermediate', 'hsc', 'puc', 'senior secondary', '10+2'],
  'graduation or higher': ['graduation or higher', 'graduation', 'degree', 'ug', 'bachelor', 'b.a', 'b.sc', 'b.com', 'b.tech'],
  'polytechnic diploma': ['polytechnic diploma', 'diploma', 'polytechnic'],
  'below 10th': ['below 10th', 'below 10', 'under 10th'],
  'others': ['others', 'other', 'any other'],
  'mr': ['mr', 'mr.', 'shri', 'श्री', 'mr./श्री'],
  'mrs': ['mrs', 'mrs.', 'smt', 'श्रीमती'],
  'ms': ['ms', 'ms.', 'sushri', 'सुश्री'],
  'government employee': ['government employee', 'govt employee', 'sarkari karmchari', 'सरकारी कर्मचारी'],
  'government undertaking': ['government undertaking', 'psu', 'सरकार के उपक्रम'],
  'self employed': ['self employed', 'self-employed', 'स्व कार्यरत'],
  'every month exam cycle': ['every month exam cycle', 'monthly exam cycle', 'every month'],
  'quarterly exam cycle': ['quarterly exam cycle', 'quarterly exam', 'quarterly'],

  // ---- Gender ----
  'male': ['male', 'm', 'boy', 'purush'],
  'female': ['female', 'f', 'girl', 'stri'],
  'other': ['other', 'o', 'third gender', 'transgender', 'tg'],

  // ---- Yes/No ----
  'yes': ['yes', 'y', 'true', '1', 'haan'],
  'no': ['no', 'n', 'false', '0', 'nahi'],

  // ---- Category ----
    'general': ['general', 'gen', 'ur', 'unreserved', 'open', 'gen category', 'general category'],
  'ur': ['ur', 'general', 'gen', 'unreserved', 'open', 'ur category'],
  'gen': ['gen', 'general', 'ur', 'unreserved', 'open'],
  'obc': ['obc', 'other backward class', 'other backward caste', 'obc category'],
  'sc': ['sc', 'scheduled caste', 'sc category'],
  'st': ['st', 'scheduled tribe', 'st category'],
  'ews': ['ews', 'economically weaker section', 'ews category'],
  'minority': ['minority', 'muslim', 'christian', 'sikh', 'buddhist', 'jain', 'parsi'],

  // ---- Marital Status ----
  'married': ['married', 'vivahit'],
  'unmarried': ['unmarried', 'single', 'never married', 'avivahit'],

  // ---- Nationality ----
  'indian': ['indian', 'india', 'bharatiya'],

  // ---- Blood group ----
  'o+': ['o+', 'o positive', 'o pos'],
  'o-': ['o-', 'o negative', 'o neg'],
  'a+': ['a+', 'a positive'],
  'a-': ['a-', 'a negative'],
  'b+': ['b+', 'b positive'],
  'b-': ['b-', 'b negative'],
  'ab+': ['ab+', 'ab positive'],
  'ab-': ['ab-', 'ab negative']
};

function _smNorm(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9+]/g, ' ').replace(/\s+/g, ' ').trim();
}

function expandSynonyms(value) {
  const v = _smNorm(value);
  if (!v) return [];
  const list = [v];

  if (SYNONYMS[v]) {
    for (let i = 0; i < SYNONYMS[v].length; i++) list.push(SYNONYMS[v][i]);
  }

  const vWords = v.split(/\s+/).filter(Boolean);
  if (vWords.length > 1) {
    for (let w = 0; w < vWords.length; w++) {
      if (vWords[w].length >= 4 && SYNONYMS[vWords[w]]) {
        for (let i = 0; i < SYNONYMS[vWords[w]].length; i++) list.push(SYNONYMS[vWords[w]][i]);
      }
    }
  }

  const seen = {};
  return list.filter(function (x) {
    if (seen[x]) return false;
    seen[x] = 1;
    return true;
  });
}

function _similarity(a, b) {
  a = _smNorm(a).replace(/\s/g, '');
  b = _smNorm(b).replace(/\s/g, '');
  if (!a || !b) return 0;
  if (a === b) return 1;

  // Simple Levenshtein
  const m = a.length, n = b.length;
  if (m === 0) return 0;
  if (n === 0) return 0;
  const d = [];
  for (let i = 0; i <= n; i++) d[i] = [i];
  for (let j = 0; j <= m; j++) d[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      d[i][j] = b[i - 1] === a[j - 1]
        ? d[i - 1][j - 1]
        : Math.min(d[i - 1][j - 1] + 1, d[i][j - 1] + 1, d[i - 1][j] + 1);
    }
  }
  const dist = d[n][m];
  return 1 - dist / Math.max(a.length, b.length);
}

// Score how well an option matches a target value
function scoreOptionMatch(targetValue, optionText, optionValue) {
  const target = _smNorm(targetValue);
  const optText = _smNorm(optionText);
  const optValue = _smNorm(optionValue);
  if (!target) return 0;

  // Exact match — highest score
  if (target === optText || target === optValue) return 1;

  // Synonym overlap
  const targetSyn = expandSynonyms(target);
  const optSyn = expandSynonyms(optText).concat(expandSynonyms(optValue));
  let overlap = 0;
  for (let i = 0; i < targetSyn.length; i++) {
    if (optSyn.indexOf(targetSyn[i]) !== -1) overlap++;
  }
  const synScore = overlap > 0 ? Math.min(0.95, 0.6 + overlap * 0.15) : 0;

  // Substring
  const subScore = (optText.indexOf(target) !== -1 || target.indexOf(optText) !== -1) ? 0.75 : 0;

  // Fuzzy
  const fuzScore = _similarity(target, optText);

  return Math.max(synScore, subScore, fuzScore);
}

// Main: pick best option from a <select>
function smartSelectMatch(select, targetValue) {
  const options = Array.from(select.options);
  if (!options.length || !targetValue) return null;

  let best = { score: 0, option: null };
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    if (!opt.value && !opt.text) continue; // skip placeholder
    const score = scoreOptionMatch(targetValue, opt.text || '', opt.value || '');
    if (score > best.score) best = { score: score, option: opt };
  }

  return best.score >= 0.6 ? best.option : null;
}

// Smart label match: does this form field label match any profile key?
function smartLabelMatch(labelText, profileKey, aliases) {
  const label = _smNorm(labelText);
  if (!label) return 0;

  const aliasList = [profileKey].concat(aliases[profileKey] || []);

  // Strip common prefixes: "Verify ", "Confirm ", "Re-enter ", "a. Verify ", "b. Confirm "
  const stripped = label
    .replace(/^[a-z]\s+/, '')                                        // remove "a ", "b "
    .replace(/^(verify|confirm|re enter|reenter|retype|re type|repeat|please enter|please select|enter|select)\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();

    let best = 0;
  for (let i = 0; i < aliasList.length; i++) {
    const alias = _smNorm(aliasList[i]);
    if (!alias) continue;

    if (label === alias || stripped === alias) { return 1; }

    if (label.indexOf(alias) !== -1 || alias.indexOf(label) !== -1) {
      best = Math.max(best, 0.85);
    }
    if (stripped.indexOf(alias) !== -1 || alias.indexOf(stripped) !== -1) {
      best = Math.max(best, 0.8);
    }

    best = Math.max(best, _similarity(label, alias));
    best = Math.max(best, _similarity(stripped, alias));
  }
  return best;
}

function smartRadioMatch(profileValue, radioValue, radioLabel) {
  const target = String(profileValue || '').toLowerCase().trim();
  const rv = String(radioValue || '').toLowerCase().trim();
  const rlabel = String(radioLabel || '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  if (!target) return false;

  // Exact matches
  if (rv === target) return true;
  if (rlabel === target) return true;

  // Whole-word match — MUST be a full word, not a substring
  const targetWords = target.split(/\s+/).filter(Boolean);
  const labelWords = rlabel.split(/[\s\/,;()\-\.]+/).filter(Boolean);
  for (let i = 0; i < targetWords.length; i++) {
    const tw = targetWords[i];
    if (tw.length >= 3 && labelWords.indexOf(tw) !== -1) return true;
  }

  // Synonym overlap with strict equality
  if (typeof expandSynonyms === 'function') {
    const tSyn = expandSynonyms(target);
    const lSyn = expandSynonyms(rlabel).concat(expandSynonyms(rv));
    for (let i = 0; i < tSyn.length; i++) {
      if (lSyn.indexOf(tSyn[i]) !== -1) return true;
    }
  }

  return false;
}
window.smartRadioMatch = smartRadioMatch;
// Expose
window.SYNONYMS = SYNONYMS;
window.smartSelectMatch = smartSelectMatch;
window.smartLabelMatch = smartLabelMatch;
window.expandSynonyms = expandSynonyms;