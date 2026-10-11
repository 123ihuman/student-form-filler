// options.js — friendly form-based profile editor (no JSON required)

// ─── Field schema — drives the auto-generated form ───
const FIELD_SCHEMA = [
  { group: '👤 Personal Information', fields: [
    { key: 'salutation', label: 'Salutation (Mr./Ms./Shri)', placeholder: 'Mr.', validate: 'short' },
    { key: 'fullName', label: 'Full Name', placeholder: 'UMA SHANKER CHOUDHARY', validate: 'name', upper: true },
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
    { key: 'tenthBoard', label: 'Board', placeholder: 'Central Board of Secondary Education (CBSE)' },
    { key: 'tenthSchool', label: 'School Name', placeholder: '' },
    { key: 'tenthRollNumber', label: 'Roll Number', placeholder: '236339' },
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
    { key: 'twelfthStream', label: 'Stream (Science/Commerce/Arts)', placeholder: '' }
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
    { key: 'appliedPreviously', label: 'Applied Previously?', type: 'select', options: ['no', 'yes'] }
  ]},

  { group: '🏦 Bank Details (if needed)', fields: [
    { key: 'bankName', label: 'Bank Name', placeholder: '' },
    { key: 'accountNumber', label: 'Account Number', placeholder: '' },
    { key: 'confirmAccountNumber', label: 'Confirm Account Number', placeholder: '' },
    { key: 'ifscCode', label: 'IFSC Code', placeholder: '' },
    { key: 'branchName', label: 'Branch Name', placeholder: '' },
    { key: 'accountHolderName', label: 'Account Holder Name', placeholder: '' }
  ]},

  { group: '🔐 Password / Consent (for some forms)', fields: [
    { key: 'password', label: 'Password', type: 'password', placeholder: '' },
    { key: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: '' },
    { key: 'declaration', label: 'Declaration (Yes/No)', type: 'select', options: ['Yes', 'No'] },
    { key: 'consentPlace', label: 'Consent Place', placeholder: 'Patna' },
    { key: 'consentRelation', label: 'Consent Relation', placeholder: 'Self' },
    { key: 'isProviderPresent', label: 'Is Provider Present', type: 'select', options: ['true', 'false'] }
  ]}
];

// ─── Validation ───
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

// ─── Build the form UI ───
function buildProfileForm(container, profile, index) {
  const wrapper = document.createElement('div');
  wrapper.className = 'profile-card';

  const fields = profile.fields || {};

  let html = '<div class="profile-head">' +
    '<input class="profile-name" type="text" placeholder="Profile Name (e.g. My Profile)" value="' + esc(profile.name || '') + '">' +
    '<button class="del-btn" title="Delete profile">🗑</button>' +
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
      html += '<div class="field-row">' +
        '<label>' + esc(f.label) + '</label>' +
        input +
        '<div class="err" data-for="' + f.key + '"></div>' +
        '</div>';
    });
    html += '</div></details>';
  });

  html += '<div class="actions">' +
    '<button class="save-btn">💾 Save Profile</button>' +
    '<button class="toggle-json">Show JSON (advanced)</button>' +
    '</div>' +
    '<textarea class="json-view hidden" rows="10"></textarea>';

  wrapper.innerHTML = html;
  container.appendChild(wrapper);

  // Auto-uppercase for name fields
  wrapper.querySelectorAll('input[data-upper]').forEach(function (inp) {
    inp.addEventListener('input', function () {
      const pos = inp.selectionStart;
      inp.value = inp.value.toUpperCase();
      inp.selectionStart = inp.selectionEnd = pos;
    });
  });

  // Live validation
  wrapper.querySelectorAll('input, select').forEach(function (inp) {
    const key = inp.dataset.key;
    if (!key) return;
    const rule = (FIELD_SCHEMA.flatMap(function (g) { return g.fields; }).find(function (f) { return f.key === key; }) || {}).validate;
    if (!rule) return;
    inp.addEventListener('blur', function () {
      const errEl = wrapper.querySelector('.err[data-for="' + key + '"]');
      const err = validateValue(rule, inp.value);
      errEl.textContent = err || '';
      inp.classList.toggle('bad', !!err);
    });
  });

  // Save
  wrapper.querySelector('.save-btn').onclick = async function () {
    // Validate all first
    let hasError = false;
    wrapper.querySelectorAll('input, select').forEach(function (inp) {
      const key = inp.dataset.key;
      if (!key) return;
      const fieldDef = FIELD_SCHEMA.flatMap(function (g) { return g.fields; }).find(function (f) { return f.key === key; });
      if (fieldDef && fieldDef.validate) {
        const err = validateValue(fieldDef.validate, inp.value);
        wrapper.querySelector('.err[data-for="' + key + '"]').textContent = err || '';
        inp.classList.toggle('bad', !!err);
        if (err) hasError = true;
      }
    });
    if (hasError) { alert('Please fix the highlighted fields.'); return; }

    const newFields = {};
    wrapper.querySelectorAll('input, select').forEach(function (inp) {
      const key = inp.dataset.key;
      if (!key) return;
      const v = inp.value.trim();
      if (v) newFields[key] = v;
    });

    const data = await chrome.storage.local.get('profiles');
    const all = data.profiles || [];
    all[index] = Object.assign({}, all[index], {
      name: wrapper.querySelector('.profile-name').value || 'Unnamed',
      fields: newFields
    });
    await chrome.storage.local.set({ profiles: all });
    alert('✅ Profile saved');
    loadProfiles();
    renderFileSlots();
  };

  // Delete
  wrapper.querySelector('.del-btn').onclick = async function () {
    if (!confirm('Delete this profile permanently?')) return;
    const data = await chrome.storage.local.get('profiles');
    const all = data.profiles || [];
    all.splice(index, 1);
    await chrome.storage.local.set({ profiles: all });
    loadProfiles();
    renderFileSlots();
  };

  // JSON toggle
  wrapper.querySelector('.toggle-json').onclick = function () {
    const ta = wrapper.querySelector('.json-view');
    const btn = this;
    if (ta.classList.contains('hidden')) {
      ta.value = JSON.stringify(fields, null, 2);
      ta.classList.remove('hidden');
      btn.textContent = 'Hide JSON';
    } else {
      ta.classList.add('hidden');
      btn.textContent = 'Show JSON (advanced)';
    }
  };
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Load profiles ───
async function loadProfiles() {
  const data = await chrome.storage.local.get('profiles');
  const profiles = data.profiles || [];
  const container = document.getElementById('profiles');
  container.innerHTML = '';
  if (!profiles.length) {
    container.innerHTML = '<p style="color:#888;">No profiles yet. Click "Add Full Template" below to start.</p>';
    return;
  }
  profiles.forEach(function (p, i) { buildProfileForm(container, p, i); });
}

// ─── Add buttons ───
document.getElementById('addProfile').onclick = async function () {
  const data = await chrome.storage.local.get('profiles');
  const all = data.profiles || [];
  all.push({ id: Date.now().toString(), name: 'New Profile', fields: {} });
  await chrome.storage.local.set({ profiles: all });
  loadProfiles();
  renderFileSlots();
};

document.getElementById('addFullTemplate').onclick = async function () {
  const data = await chrome.storage.local.get('profiles');
  const all = data.profiles || [];
  const fields = {};
  FIELD_SCHEMA.forEach(function (grp) {
    grp.fields.forEach(function (f) { fields[f.key] = ''; });
  });
  all.push({ id: Date.now().toString(), name: 'My Profile', fields: fields });
  await chrome.storage.local.set({ profiles: all });
  loadProfiles();
  renderFileSlots();
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

// ─── File uploads (unchanged from before) ───
const FILE_TYPES = [
  { key: 'photo',            label: 'Photo',              accepts: 'image/*', processed: true },
  { key: 'signature',        label: 'Signature (English)', accepts: 'image/*', processed: true },
  { key: 'signatureHindi',   label: 'Signature (Hindi)',   accepts: 'image/*', processed: true },
  { key: 'parentSignature',  label: 'Parent Signature',    accepts: 'image/*', processed: true },
  { key: 'thumbLeft',        label: 'Left Thumb',          accepts: 'image/*', processed: true },
  { key: 'thumbRight',       label: 'Right Thumb',         accepts: 'image/*', processed: true },
  { key: 'tenthMarksheet',       label: '10th Marksheet',       accepts: 'image/*,application/pdf' },
  { key: 'tenthCertificate',     label: '10th Certificate',     accepts: 'image/*,application/pdf' },
  { key: 'twelfthMarksheet',     label: '12th Marksheet',       accepts: 'image/*,application/pdf' },
  { key: 'twelfthCertificate',   label: '12th Certificate',     accepts: 'image/*,application/pdf' },
  { key: 'graduationMarksheet',  label: 'UG Marksheet',         accepts: 'image/*,application/pdf' },
  { key: 'graduationCertificate',label: 'UG Certificate',       accepts: 'image/*,application/pdf' },
  { key: 'aadhaarCard',          label: 'Aadhaar Card',         accepts: 'image/*,application/pdf' },
  { key: 'panCard',              label: 'PAN Card',             accepts: 'image/*,application/pdf' },
  { key: 'casteCertificate',     label: 'Category Certificate', accepts: 'image/*,application/pdf' },
  { key: 'incomeCertificate',    label: 'Income Certificate',   accepts: 'image/*,application/pdf' },
  { key: 'domicileCertificate',  label: 'Domicile Certificate', accepts: 'image/*,application/pdf' },
  { key: 'udidCertificate',      label: 'UDID Certificate',     accepts: 'image/*,application/pdf' },
  { key: 'consentForm',          label: 'Consent Form',         accepts: 'image/*,application/pdf' }
];

async function renderFileSlots() {
  const sel = document.getElementById('fileProfileSelect');
  const data = await chrome.storage.local.get('profiles');
  const profiles = data.profiles || [];
  sel.innerHTML = '';
  profiles.forEach(function (p) {
    const o = document.createElement('option');
    o.value = p.id;
    o.textContent = p.name || 'Unnamed';
    sel.appendChild(o);
  });
  const container = document.getElementById('fileSlots');
  if (!profiles.length) { container.innerHTML = '<p>Create a profile first.</p>'; return; }
  const profile = profiles.find(function (p) { return p.id === sel.value; }) || profiles[0];
  container.innerHTML = '';
  const files = profile.files || {};

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
        status.textContent = '✅ Saved: ' + f.name;
        renderFileSlots();
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
    };
  });
}

document.getElementById('fileProfileSelect').addEventListener('change', renderFileSlots);

// ─── Boot ───
loadAI();
loadProfiles();
loadLearned();
renderFileSlots();