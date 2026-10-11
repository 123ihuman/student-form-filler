// options.js — full (matches new Students Manager UI)

// ─── FIELD_SCHEMA (unchanged) ───
const FIELD_SCHEMA = [
  { group: '👤 Personal Information', fields: [
    { key: 'salutation', label: 'Salutation (Mr./Ms./Shri)', placeholder: 'Mr.' },
    { key: 'fullName', label: 'Full Name', placeholder: 'UMA SHANKER CHOUDHARY', upper: true },
    { key: 'firstName', label: 'First Name', placeholder: 'UMA', upper: true },
    { key: 'middleName', label: 'Middle Name', placeholder: 'SHANKER', upper: true },
    { key: 'lastName', label: 'Last Name / Surname', placeholder: 'CHOUDHARY', upper: true },
    { key: 'fatherName', label: "Father's Name", placeholder: 'SOMAI PRASAD CHAUDHARY', upper: true },
    { key: 'motherName', label: "Mother's Name", placeholder: 'SAVITRI DEVI', upper: true },
    { key: 'guardianName', label: 'Guardian Name (if applicable)', placeholder: '' },
    { key: 'dob', label: 'Date of Birth (YYYY-MM-DD)', placeholder: '2005-08-15', type: 'date' },
    { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Transgender'] },
    { key: 'maritalStatus', label: 'Marital Status', type: 'select', options: ['Unmarried', 'Married', 'Widow', 'Divorced', 'Destitute'] },
    { key: 'nationality', label: 'Nationality', placeholder: 'Indian' },
    { key: 'religion', label: 'Religion', placeholder: 'Hindu' },
    { key: 'category', label: 'Category (GEN/SC/ST/OBC/EWS)', type: 'select', options: ['General', 'OBC', 'SC', 'ST', 'EWS'] },
    { key: 'occupation', label: 'Occupation', placeholder: 'Student' },
    { key: 'identificationMark', label: 'Identification Mark', placeholder: 'A mole on right cheek' },
    { key: 'differentlyAbled', label: 'Differently Abled?', type: 'select', options: ['no', 'yes'] }
  ]},
  { group: '📞 Contact', fields: [
    { key: 'mobile', label: 'Mobile Number (10 digits)', placeholder: '9369724174', validate: 'mobile' },
    { key: 'alternateMobile', label: 'Alternate Mobile', placeholder: '9369724174', validate: 'mobile' },
    { key: 'stdCode', label: 'STD Code', placeholder: '0621' },
    { key: 'email', label: 'Email', placeholder: 'you@example.com', validate: 'email' },
    { key: 'alternateEmail', label: 'Alternate Email', placeholder: '' }
  ]},
  { group: '🏠 Address', fields: [
    { key: 'addressLine1', label: 'Address Line 1', placeholder: 'House 42, Gandhi Road' },
    { key: 'addressLine2', label: 'Address Line 2', placeholder: 'Ward 7, Boring Road' },
    { key: 'addressLine3', label: 'Address Line 3 (optional)', placeholder: '' },
    { key: 'village', label: 'Village / Area', placeholder: '' },
    { key: 'postOffice', label: 'Post Office', placeholder: '' },
    { key: 'taluk', label: 'Taluk / Tehsil', placeholder: '' },
    { key: 'city', label: 'City / Town', placeholder: 'Patna' },
    { key: 'district', label: 'District', placeholder: 'PATNA', upper: true },
    { key: 'state', label: 'State', placeholder: 'BIHAR', upper: true },
    { key: 'pincode', label: 'PIN Code (6 digits)', placeholder: '800001', validate: 'pincode' },
    { key: 'country', label: 'Country', placeholder: 'India' }
  ]},
  { group: '🆔 Identity', fields: [
    { key: 'aadhaarNumber', label: 'Aadhaar Number (12 digits)', placeholder: '738347804630', validate: 'aadhaar' },
    { key: 'panNumber', label: 'PAN Number', placeholder: 'ABCDE1234F', validate: 'pan' },
    { key: 'voterId', label: 'Voter ID', placeholder: '' },
    { key: 'passportNumber', label: 'Passport Number', placeholder: '' },
    { key: 'apaarId', label: 'APAAR ID (if any)', placeholder: '' }
  ]},
  { group: '📚 10th (Matriculation)', fields: [
    { key: 'tenthBoard', label: 'Board', placeholder: 'CBSE' },
    { key: 'tenthSchool', label: 'School Name', placeholder: '' },
    { key: 'tenthRollNumber', label: 'Roll Number', placeholder: '' },
    { key: 'tenthRegistrationNumber', label: 'Registration Number', placeholder: '' },
    { key: 'tenthYear', label: 'Year of Passing', placeholder: '2021', validate: 'year' },
    { key: 'tenthPercentage', label: 'Percentage / CGPA', placeholder: '' },
    { key: 'tenthMarks', label: 'Total Marks', placeholder: '' }
  ]},
  { group: '📚 12th (Higher Secondary)', fields: [
    { key: 'twelfthBoard', label: 'Board', placeholder: '' },
    { key: 'twelfthSchool', label: 'School / College Name', placeholder: '' },
    { key: 'twelfthRollNumber', label: 'Roll Number', placeholder: '' },
    { key: 'twelfthRegistrationNumber', label: 'Registration Number', placeholder: '' },
    { key: 'twelfthYear', label: 'Year of Passing', placeholder: '2025', validate: 'year' },
    { key: 'twelfthPercentage', label: 'Percentage / CGPA', placeholder: '' },
    { key: 'twelfthStream', label: 'Stream', placeholder: '' }
  ]},
  { group: '🎓 Graduation', fields: [
    { key: 'graduationUniversity', label: 'University', placeholder: '' },
    { key: 'graduationCollege', label: 'College', placeholder: '' },
    { key: 'graduationDegree', label: 'Degree', placeholder: '' },
    { key: 'graduationCourse', label: 'Course', placeholder: '' },
    { key: 'graduationRollNumber', label: 'Roll Number', placeholder: '' },
    { key: 'graduationRegistrationNumber', label: 'Registration Number', placeholder: '' },
    { key: 'graduationYear', label: 'Year of Passing', placeholder: '' },
    { key: 'graduationPercentage', label: 'Percentage / CGPA', placeholder: '' },
    { key: 'graduationStream', label: 'Stream', placeholder: '' }
  ]},
  { group: '📝 Exam Details', fields: [
    { key: 'highestQualification', label: 'Highest Qualification', placeholder: '12th Pass' },
    { key: 'yearOfPassing', label: 'Year of Passing (highest)', placeholder: '2025' },
    { key: 'examName', label: 'Exam Name (per site)', placeholder: 'CCC' },
    { key: 'appliedForExamination', label: 'Exam Cycle', placeholder: 'Every Month Exam Cycle' },
    { key: 'examCentreState1', label: 'Exam Center State 1', placeholder: 'Bihar' },
    { key: 'examCentre1', label: 'Exam Center 1', placeholder: 'PAT - PATNA' },
    { key: 'examCentreState2', label: 'Exam Center State 2', placeholder: 'Bihar' },
    { key: 'examCentre2', label: 'Exam Center 2', placeholder: 'PAT - PATNA' },
    { key: 'appliedAs', label: 'Applied As (Direct/Institute)', placeholder: 'direct' },
    { key: 'appliedPreviously', label: 'Applied Previously?', type: 'select', options: ['no', 'yes'] },
    { key: 'changedName', label: 'Have you changed your name?', type: 'select', options: ['No', 'Yes'] },
    { key: 'certificateOfEligibility', label: 'Certificate of Eligibility (RRB)', type: 'select', options: ['no', 'yes'] },
    { key: 'infoSource', label: 'Info Source (CG)', placeholder: 'Official ICG website' }
  ]},
  { group: '🏦 Bank Details (if needed)', fields: [
    { key: 'bankName', label: 'Bank Name', placeholder: '' },
    { key: 'accountNumber', label: 'Account Number', placeholder: '' },
    { key: 'confirmAccountNumber', label: 'Confirm Account Number', placeholder: '' },
    { key: 'ifscCode', label: 'IFSC Code', placeholder: '' },
    { key: 'branchName', label: 'Branch Name', placeholder: '' },
    { key: 'accountHolderName', label: 'Account Holder Name', placeholder: '' }
  ]},
  { group: '🔐 Password / Consent', fields: [
    { key: 'password', label: 'Password', type: 'password', placeholder: '' },
    { key: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: '' },
    { key: 'declaration', label: 'Declaration (Yes/No)', type: 'select', options: ['Yes', 'No'] },
    { key: 'consentPlace', label: 'Consent Place', placeholder: 'Patna' },
    { key: 'consentRelation', label: 'Consent Relation', placeholder: 'Self' },
    { key: 'isProviderPresent', label: 'Is Provider Present', type: 'select', options: ['true', 'false'] }
  ]}
];

function validateValue(rule, value) {
  if (!value) return null;
  const v = String(value).trim();
  if (rule === 'mobile' && !/^\d{10}$/.test(v)) return 'Must be 10 digits';
  if (rule === 'pincode' && !/^\d{6}$/.test(v)) return 'Must be 6 digits';
  if (rule === 'aadhaar' && !/^\d{12}$/.test(v.replace(/\s/g, ''))) return 'Must be 12 digits';
  if (rule === 'pan' && !/^[A-Z]{5}\d{4}[A-Z]$/i.test(v)) return 'Format: ABCDE1234F';
  if (rule === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Invalid email';
  if (rule === 'year' && !/^(19|20)\d{2}$/.test(v)) return 'Must be 4-digit year';
  return null;
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Build editor form for one profile (opens in the profileEditorWrap) ───
function buildProfileForm(container, profile, index) {
  const wrapper = document.createElement('div');
  wrapper.className = 'profile-card';
  const fields = profile.fields || {};

  let html = '<div class="profile-head">' +
    '<input class="profile-name" type="text" placeholder="Profile Name" value="' + esc(profile.name || '') + '">' +
    '<button class="del-btn" title="Delete profile">🗑 Delete</button>' +
    '</div>';

  FIELD_SCHEMA.forEach(function (grp) {
    html += '<details class="field-group"><summary>' + grp.group + '</summary><div class="field-grid">';
    grp.fields.forEach(function (f) {
      const val = esc(fields[f.key] || '');
      const hint = f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : '';
      let input;
      if (f.type === 'select') {
        input = '<select data-key="' + f.key + '">';
        input += '<option value="">— choose —</option>';
        f.options.forEach(function (o) {
          input += '<option value="' + esc(o) + '"' + (String(fields[f.key] || '') === o ? ' selected' : '') + '>' + esc(o) + '</option>';
        });
        input += '</select>';
      } else {
        input = '<input type="' + (f.type || 'text') + '" data-key="' + f.key + '" value="' + val + '"' + hint + (f.upper ? ' data-upper="1"' : '') + '>';
      }
      html += '<div class="field-row"><label>' + esc(f.label) + '</label>' + input + '<div class="err" data-for="' + f.key + '"></div></div>';
    });
    html += '</div></details>';
  });

  html += '<div class="actions">' +
    '<button class="save-btn" style="background:#28a745;color:#fff;">💾 Save Changes</button>' +
    '<button class="toggle-json">📝 Edit JSON (advanced)</button>' +
    '<button class="save-json hidden" style="background:#007bff;color:#fff;">💾 Save JSON Directly</button>' +
    '</div>' +
    '<textarea class="json-view hidden" rows="14" spellcheck="false"></textarea>' +
    '<div class="json-err"></div>';

  wrapper.innerHTML = html;
  container.appendChild(wrapper);

  wrapper.querySelectorAll('input[data-upper]').forEach(function (inp) {
    inp.addEventListener('input', function () {
      const pos = inp.selectionStart;
      inp.value = inp.value.toUpperCase();
      inp.selectionStart = inp.selectionEnd = pos;
    });
  });

  wrapper.querySelector('.save-btn').onclick = async function () {
    const newFields = {};
    wrapper.querySelectorAll('input[data-key], select[data-key]').forEach(function (inp) {
      const key = inp.dataset.key;
      const v = (inp.value || '').trim();
      if (v) newFields[key] = v;
    });

    const d = await chrome.storage.local.get('profiles');
    const all = d.profiles || [];
    all[index] = Object.assign({}, all[index], {
      name: wrapper.querySelector('.profile-name').value || all[index].name || 'Unnamed',
      fields: newFields
    });
    await chrome.storage.local.set({ profiles: all });
    alert('✅ Saved');
    loadProfiles();
    renderFileSlots();
  };

  wrapper.querySelector('.del-btn').onclick = async function () {
    if (!confirm('Delete this student permanently?')) return;
    const d = await chrome.storage.local.get('profiles');
    const all = d.profiles || [];
    all.splice(index, 1);
    await chrome.storage.local.set({ profiles: all });
    document.getElementById('profileEditorWrap').style.display = 'none';
    loadProfiles();
    renderFileSlots();
  };

  wrapper.querySelector('.toggle-json').onclick = function () {
    const ta = wrapper.querySelector('.json-view');
    const saveJsonBtn = wrapper.querySelector('.save-json');
    if (ta.classList.contains('hidden')) {
      ta.value = JSON.stringify(fields, null, 2);
      ta.classList.remove('hidden');
      saveJsonBtn.classList.remove('hidden');
      this.textContent = '👁 Hide JSON';
    } else {
      ta.classList.add('hidden');
      saveJsonBtn.classList.add('hidden');
      this.textContent = '📝 Edit JSON (advanced)';
    }
  };

  wrapper.querySelector('.json-view').addEventListener('input', function () {
    const errBox = wrapper.querySelector('.json-err');
    try { JSON.parse(this.value); errBox.textContent = ''; this.style.borderColor = '#ccc'; }
    catch (e) { errBox.textContent = '⚠ ' + e.message; this.style.borderColor = '#dc3545'; }
  });

  wrapper.querySelector('.save-json').onclick = async function () {
    const ta = wrapper.querySelector('.json-view');
    let parsed;
    try { parsed = JSON.parse(ta.value); }
    catch (e) { alert('❌ Invalid JSON: ' + e.message); return; }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      alert('❌ JSON must be a single object { ... }');
      return;
    }
    const d = await chrome.storage.local.get('profiles');
    const all = d.profiles || [];
    all[index].fields = parsed;
    await chrome.storage.local.set({ profiles: all });
    alert('✅ JSON saved');
    loadProfiles();
  };
}

// ─── Storage meter ───
function computeProfileSize(profile) {
  let total = 0;
  try {
    total += JSON.stringify(profile.fields || {}).length;
    const files = profile.files || {};
    for (const k in files) if (files[k] && files[k].base64) total += files[k].base64.length;
  } catch (e) {}
  return total;
}
function updateStorageBar(profiles) {
  const totalBytes = profiles.reduce(function (s, p) { return s + computeProfileSize(p); }, 0);
  const totalMB = (totalBytes / 1024 / 1024).toFixed(2);
  document.getElementById('storageText').textContent = totalMB + ' MB';
  document.getElementById('profileCount').textContent = profiles.length;
  const capMB = 100;
  const pct = Math.min(100, (totalMB / capMB) * 100);
  const bar = document.getElementById('storageBar');
  bar.style.width = pct + '%';
  bar.style.background = pct > 80 ? '#dc3545' : pct > 50 ? '#ffc107' : '#28a745';
}

// ─── Student grid ───
async function loadProfiles() {
  const data = await chrome.storage.local.get('profiles');
  const profiles = data.profiles || [];
  const grid = document.getElementById('studentGrid');
  const search = (document.getElementById('profileSearch').value || '').toLowerCase().trim();

  updateStorageBar(profiles);

  const filtered = profiles.filter(function (p) {
    if (!search) return true;
    const f = p.fields || {};
    const hay = [p.name, f.fullName, f.fatherName, f.motherName, f.mobile, f.district, f.aadhaarNumber]
      .filter(Boolean).join(' ').toLowerCase();
    return hay.indexOf(search) !== -1;
  });

  grid.innerHTML = '';
  if (!profiles.length) {
    grid.innerHTML = '<p style="color:#888;grid-column:1/-1;">No students yet. Click "📥 Import Multiple Students" or "+ New Student".</p>';
    return;
  }
  if (!filtered.length) {
    grid.innerHTML = '<p style="color:#888;grid-column:1/-1;">No matches.</p>';
    return;
  }

  filtered.forEach(function (p) {
    const realIdx = profiles.indexOf(p);
    const sizeKB = (computeProfileSize(p) / 1024).toFixed(0);
    const files = p.files || {};
    const hasPhoto = files.photo && files.photo.base64;
    const hasSign = files.signature && files.signature.base64;
    const docCount = Object.keys(files).filter(function (k) {
      return ['photo','signature','signatureHindi','parentSignature','thumbLeft','thumbRight'].indexOf(k) === -1 && files[k] && files[k].base64;
    }).length;

    const card = document.createElement('div');
    card.className = 'student-card';
    card.innerHTML =
      '<div class="student-photo">' +
        (hasPhoto ? '<img src="data:' + (files.photo.type || 'image/jpeg') + ';base64,' + files.photo.base64 + '">' : '👤') +
      '</div>' +
      '<div class="student-info">' +
        '<div class="student-name">' + esc(p.name || 'Unnamed') + '</div>' +
        '<div class="student-meta">' +
          (hasPhoto ? '<span class="student-badge badge-photo">📷</span>' : '') +
          (hasSign ? '<span class="student-badge badge-sign">✍</span>' : '') +
          (docCount ? '<span class="student-badge badge-doc">📄 ' + docCount + '</span>' : '') +
          (p.fields && p.fields.mobile ? '<br>' + esc(p.fields.mobile) : '') +
        '</div>' +
        '<div class="student-size">' + sizeKB + ' KB</div>' +
      '</div>';

    card.onclick = function () {
      document.querySelectorAll('.student-card').forEach(function (c) { c.classList.remove('active'); });
      card.classList.add('active');
      openEditorFor(realIdx);
    };
    grid.appendChild(card);
  });
}

function openEditorFor(index) {
  chrome.storage.local.get('profiles').then(function (data) {
    const profiles = data.profiles || [];
    if (!profiles[index]) return;

    const container = document.getElementById('profiles');
    container.innerHTML = '';
    buildProfileForm(container, profiles[index], index);
    document.getElementById('editorTitle').textContent = 'Edit: ' + (profiles[index].name || 'Unnamed');

    const wrap = document.getElementById('profileEditorWrap');
    wrap.style.display = 'block';

    // ⚡ Set dropdown value FIRST, then rebuild slots (renderFileSlots preserves selection now)
    const sel = document.getElementById('fileProfileSelect');
    if (sel) {
      sel.value = profiles[index].id;
      renderFileSlots();
    }

    wrap.scrollIntoView({ behavior: 'smooth' });
  });
}
// ─── Search ───
document.getElementById('profileSearch').addEventListener('input', loadProfiles);

// ─── Close editor ───
document.getElementById('closeEditor').onclick = function () {
  document.getElementById('profileEditorWrap').style.display = 'none';
  document.querySelectorAll('.student-card').forEach(function (c) { c.classList.remove('active'); });
  loadProfiles();
};

// ─── Add new student (full template) ───
document.getElementById('addFullTemplate').onclick = async function () {
  const d = await chrome.storage.local.get('profiles');
  const all = d.profiles || [];
  const fields = {};
  FIELD_SCHEMA.forEach(function (grp) {
    grp.fields.forEach(function (f) { fields[f.key] = ''; });
  });
  const newProfile = {
    id: Date.now().toString(),
    name: 'New Student ' + (all.length + 1),
    fields: fields,
    files: {}
  };
  all.push(newProfile);
  await chrome.storage.local.set({ profiles: all });
  loadProfiles();
  renderFileSlots();
  // Immediately open editor for it
  setTimeout(function () { openEditorFor(all.length - 1); }, 200);
};

// ─── Bulk import ───
document.getElementById('bulkImportBtn').onclick = function () {
  document.getElementById('bulkImportInput').click();
};

document.getElementById('bulkImportInput').onchange = async function (e) {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;

  const status = document.getElementById('importStatus');
  status.textContent = '⏳ Importing ' + files.length + ' file(s)...';

  const d = await chrome.storage.local.get('profiles');
  const all = d.profiles || [];

  let okCount = 0, failCount = 0;
  const errors = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data._type !== 'student-profile' || !data.fields) {
        failCount++; errors.push(file.name + ': not a student profile'); continue;
      }
      all.push({
        id: Date.now().toString() + '_' + i,
        name: data.name || data.fields.fullName || 'Student ' + (all.length + 1),
        fields: data.fields || {},
        files: data.files || {},
        importedAt: new Date().toISOString()
      });
      okCount++;
    } catch (err) {
      failCount++; errors.push(file.name + ': ' + err.message);
    }
  }

  await chrome.storage.local.set({ profiles: all });
  status.innerHTML = '✅ Imported <b>' + okCount + '</b> student(s).' +
    (failCount ? '<br>❌ Failed: ' + failCount + '<br>' + errors.slice(0, 5).join('<br>') : '');

  loadProfiles();
  renderFileSlots();
  e.target.value = '';
};

// ─── Backup all ───
document.getElementById('exportAllBtn').onclick = async function () {
  const d = await chrome.storage.local.get('profiles');
  const profiles = d.profiles || [];
  if (!profiles.length) { alert('No profiles.'); return; }
  const backup = {
    _type: 'student-autofill-backup',
    _version: 1,
    _exportedAt: new Date().toISOString(),
    _count: profiles.length,
    profiles: profiles
  };
  const json = JSON.stringify(backup);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'students-backup-' + new Date().toISOString().slice(0,10) + '-' + profiles.length + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
  document.getElementById('importStatus').innerHTML =
    '💾 Downloaded <b>' + a.download + '</b> (' + (json.length / 1024).toFixed(0) + ' KB)';
};

// ─── AI settings ───
async function loadAI() {
  const d = await chrome.storage.local.get(['aiProvider', 'aiApiKey']);
  document.getElementById('aiProvider').value = d.aiProvider || 'ondevice';
  if (d.aiApiKey) document.getElementById('aiApiKey').value = d.aiApiKey;
}
document.getElementById('saveAI').onclick = async function () {
  await chrome.storage.local.set({
    aiProvider: document.getElementById('aiProvider').value,
    aiApiKey: document.getElementById('aiApiKey').value
  });
  document.getElementById('aiStatus').textContent = '✅ Saved';
  setTimeout(function () { document.getElementById('aiStatus').textContent = ''; }, 2000);
};

// ─── Learned fills ───
async function loadLearned() {
  const d = await chrome.storage.local.get('manualFills');
  const manual = d.manualFills || {};
  const container = document.getElementById('learnedList');
  container.innerHTML = '';
  const keys = Object.keys(manual);
  if (!keys.length) { container.textContent = '(nothing learned yet)'; return; }
  keys.forEach(function (k) {
    const info = manual[k];
    const div = document.createElement('div');
    div.style.cssText = 'padding:6px;background:#f9f9f9;margin:4px 0;border-radius:4px;font-size:12px;';
    div.textContent = info.label + ' = ' + info.value + ' (seen ' + info.count + 'x)';
    container.appendChild(div);
  });
}
document.getElementById('clearLearned').onclick = async function () {
  await chrome.storage.local.set({ manualFills: {} });
  loadLearned();
};

// ─── File uploads (unchanged, works on the currently selected student) ───
const FILE_TYPES = [
  { key: 'photo', label: 'Photo', accepts: 'image/*', processed: true },
  { key: 'signature', label: 'Signature (English)', accepts: 'image/*', processed: true },
  { key: 'signatureHindi', label: 'Signature (Hindi)', accepts: 'image/*', processed: true },
  { key: 'parentSignature', label: 'Parent Signature', accepts: 'image/*', processed: true },
  { key: 'thumbLeft', label: 'Left Thumb', accepts: 'image/*', processed: true },
  { key: 'thumbRight', label: 'Right Thumb', accepts: 'image/*', processed: true },
  { key: 'tenthMarksheet', label: '10th Marksheet', accepts: 'image/*,application/pdf' },
  { key: 'tenthCertificate', label: '10th Certificate', accepts: 'image/*,application/pdf' },
  { key: 'twelfthMarksheet', label: '12th Marksheet', accepts: 'image/*,application/pdf' },
  { key: 'twelfthCertificate', label: '12th Certificate', accepts: 'image/*,application/pdf' },
  { key: 'graduationMarksheet', label: 'UG Marksheet', accepts: 'image/*,application/pdf' },
  { key: 'graduationCertificate', label: 'UG Certificate', accepts: 'image/*,application/pdf' },
  { key: 'aadhaarCard', label: 'Aadhaar Card', accepts: 'image/*,application/pdf' },
  { key: 'panCard', label: 'PAN Card', accepts: 'image/*,application/pdf' },
  { key: 'casteCertificate', label: 'Category Certificate', accepts: 'image/*,application/pdf' },
  { key: 'incomeCertificate', label: 'Income Certificate', accepts: 'image/*,application/pdf' },
  { key: 'domicileCertificate', label: 'Domicile Certificate', accepts: 'image/*,application/pdf' },
  { key: 'udidCertificate', label: 'UDID Certificate', accepts: 'image/*,application/pdf' },
  { key: 'consentForm', label: 'Consent Form', accepts: 'image/*,application/pdf' }
];

async function renderFileSlots() {
  const sel = document.getElementById('fileProfileSelect');
  const data = await chrome.storage.local.get('profiles');
  const profiles = data.profiles || [];

  // ⚡ Save current selection before rebuilding options
  const currentValue = sel.value;

  sel.innerHTML = '';
  profiles.forEach(function (p) {
    const o = document.createElement('option');
    o.value = p.id;
    o.textContent = p.name || 'Unnamed';
    sel.appendChild(o);
  });

  // ⚡ Restore selection if it still exists
  if (currentValue && profiles.some(function (p) { return p.id === currentValue; })) {
    sel.value = currentValue;
  }
  // Otherwise pick the first
  else if (profiles.length) {
    sel.value = profiles[0].id;
  }

  const container = document.getElementById('fileSlots');
  if (!profiles.length) { container.innerHTML = '<p>Create a profile first.</p>'; return; }
    const profile = profiles.find(function (p) { return p.id === sel.value; }) || profiles[0];
  container.innerHTML = '';
  const files = profile.files || {};

  // ⚡ Show which student's files are being edited
  const ownerEl = document.getElementById('fileOwnerName');
  if (ownerEl) ownerEl.textContent = profile.name || 'Unnamed';

  FILE_TYPES.forEach(function (ft) {
    const saved = files[ft.key] || {};
    const div = document.createElement('div');
    div.className = 'file-slot';
    div.innerHTML =
      '<h4>' + ft.label + (saved.base64 ? ' <span style="color:#0a7d33;font-size:12px;">✅ saved</span>' : '') + '</h4>' +
      '<input type="file" class="fileInput" accept="' + ft.accepts + '">' +
      (saved.base64 && (saved.type || '').indexOf('image') === 0
        ? '<div style="margin-top:6px;"><img src="data:' + saved.type + ';base64,' + saved.base64 + '" style="max-height:80px;border:1px solid #ccc;border-radius:4px;"></div>'
        : '') +
      '<div class="fileStatus" style="font-size:12px;color:#555;margin-top:4px;"></div>' +
      '<button class="clearFile" style="background:#dc3545;margin-top:6px;">Remove</button>';
    container.appendChild(div);

    const input = div.querySelector('.fileInput');
    const status = div.querySelector('.fileStatus');
    input.onchange = function (e) {
      const f = e.target.files[0];
      if (!f) return;
      status.textContent = 'Reading...';
      const reader = new FileReader();
      reader.onload = async function () {
        const base64 = reader.result.split(',')[1];
        const d = await chrome.storage.local.get('profiles');
        const all = d.profiles || [];
        const idx = all.findIndex(function (p) { return p.id === profile.id; });
        if (idx === -1) return;
        all[idx].files = all[idx].files || {};
        all[idx].files[ft.key] = { base64: base64, name: f.name, type: f.type, size: f.size, uploadedAt: Date.now() };
        await chrome.storage.local.set({ profiles: all });
        status.textContent = '✅ ' + f.name;
        renderFileSlots();
        loadProfiles(); // refresh grid + storage bar
      };
      reader.readAsDataURL(f);
    };
    div.querySelector('.clearFile').onclick = async function () {
      const d = await chrome.storage.local.get('profiles');
      const all = d.profiles || [];
      const idx = all.findIndex(function (p) { return p.id === profile.id; });
      if (idx === -1) return;
      if (all[idx].files) delete all[idx].files[ft.key];
      await chrome.storage.local.set({ profiles: all });
      renderFileSlots();
      loadProfiles();
    };
  });
}

document.getElementById('fileProfileSelect').addEventListener('change', renderFileSlots);
// ─── Add custom file slot (user-defined file type) ───
document.getElementById('addCustomFileBtn').onclick = async function () {
  const name = prompt('File name (e.g. "Sports Certificate", "Bonafide", "Migration"):');
  if (!name || !name.trim()) return;

  // Build a key from the name
  const key = 'custom_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30);

  // Check if already exists in FILE_TYPES
  if (FILE_TYPES.some(function (ft) { return ft.key === key; })) {
    document.getElementById('customFileStatus').textContent = '❌ A slot with that name already exists.';
    return;
  }

  // Add to FILE_TYPES (in-memory for this session)
  FILE_TYPES.push({
    key: key,
    label: name.trim(),
    accepts: 'image/*,application/pdf',
    custom: true
  });

  // Persist this custom slot so it survives reloads
  const d = await chrome.storage.local.get('customFileTypes');
  const custom = d.customFileTypes || [];
  if (!custom.some(function (c) { return c.key === key; })) {
    custom.push({ key: key, label: name.trim(), accepts: 'image/*,application/pdf' });
    await chrome.storage.local.set({ customFileTypes: custom });
  }

  document.getElementById('customFileStatus').textContent = '✅ Added: ' + name;
  renderFileSlots();
};

// ─── Load custom file types on boot ───
async function loadCustomFileTypes() {
  try {
    const d = await chrome.storage.local.get('customFileTypes');
    const custom = d.customFileTypes || [];
    custom.forEach(function (c) {
      if (!FILE_TYPES.some(function (ft) { return ft.key === c.key; })) {
        FILE_TYPES.push(c);
      }
    });
  } catch (e) {}
}

// ─── Boot ───
(async function boot() {
  await loadCustomFileTypes();
  loadAI();
  loadProfiles();
  loadLearned();
  renderFileSlots();
})();