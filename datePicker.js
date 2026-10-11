// datePicker.js — clean (no duplicates, includes DateTime8 handler)

function _dpSleep(ms) {
  return new Promise(function (r) { setTimeout(r, ms); });
}

const MONTH_NAMES_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function toIsoDate(date) {
  return date.getFullYear() + '-' +
    String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0');
}

function detectDateFormat(input) {
  // ⚡ Direct attribute from most datepicker libraries — highest priority
  const dataFmt = input.getAttribute('data-date-format') ||
                  input.getAttribute('data-format') ||
                  input.getAttribute('data-dateformat');
  if (dataFmt) {
    const f = dataFmt.toLowerCase().replace(/[^a-z\-\.\/]/g, '');
    if (f.indexOf('dd-mm-yyyy') !== -1) return 'dd-mm-yyyy';
    if (f.indexOf('dd/mm/yyyy') !== -1) return 'dd/mm/yyyy';
    if (f.indexOf('mm/dd/yyyy') !== -1) return 'mm/dd/yyyy';
    if (f.indexOf('yyyy-mm-dd') !== -1) return 'yyyy-mm-dd';
    if (f.indexOf('dd-mon-yyyy') !== -1) return 'dd-Mon-yyyy';
    if (f.indexOf('dd-mm-yy') !== -1) return 'dd-mm-yy';
  }

  const clues = [
    input.placeholder || '',
    input.getAttribute('aria-label') || '',
    input.name || '',
    input.id || '',
    input.className || '',
    (input.closest('label') && input.closest('label').innerText) || ''
  ].join(' ').toLowerCase();

  if (/dd[\/\-\.\s]?mon[\/\-\.\s]?yyyy/.test(clues)) return 'dd-Mon-yyyy';
  if (/dd[\/\-\.\s]?mon[\/\-\.\s]?yy(?!y)/.test(clues)) return 'dd-Mon-yy';
  if (/dd[\/\-\.\s]?mm[\/\-\.\s]?yyyy/.test(clues)) return 'dd/mm/yyyy';
  if (/mm[\/\-\.\s]?dd[\/\-\.\s]?yyyy/.test(clues)) return 'mm/dd/yyyy';
  if (/yyyy[\/\-\.\s]?mm[\/\-\.\s]?dd/.test(clues)) return 'yyyy-mm-dd';
  if (/dd[\/\-\.\s]?mm[\/\-\.\s]?yy(?!y)/.test(clues)) return 'dd/mm/yy';

  if (input.value) {
    const v = input.value;
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) return 'yyyy-mm-dd';
    if (/^\d{2}-[A-Za-z]{3}-\d{4}/.test(v)) return 'dd-Mon-yyyy';
    if (/^\d{2}\/\d{2}\/\d{4}/.test(v)) return 'dd/mm/yyyy';
    if (/^\d{2}-\d{2}-\d{4}/.test(v)) return 'dd-mm-yyyy';
  }
  return 'dd/mm/yyyy';
}

function formatForPortal(date, fmt) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const yy = String(y).slice(2);
  const mon = MONTH_NAMES_SHORT[date.getMonth()];

  if (fmt === 'dd-Mon-yyyy') return d + '-' + mon + '-' + y;
  if (fmt === 'dd-MON-yyyy') return d + '-' + mon.toUpperCase() + '-' + y;
  if (fmt === 'dd-Mon-yy') return d + '-' + mon + '-' + yy;
  if (fmt === 'dd/mm/yyyy') return d + '/' + m + '/' + y;
  if (fmt === 'dd-mm-yyyy') return d + '-' + m + '-' + y;
  if (fmt === 'mm/dd/yyyy') return m + '/' + d + '/' + y;
  if (fmt === 'yyyy-mm-dd') return y + '-' + m + '-' + d;
  if (fmt === 'dd/mm/yy') return d + '/' + m + '/' + yy;
  return d + '/' + m + '/' + y;
}

async function setDateField(input, targetDate) {
  if (!(targetDate instanceof Date) || isNaN(targetDate.getTime())) {
    return { success: false, error: 'Invalid date object' };
  }

  // Native <input type="date"> → ISO
  if (input.type === 'date') {
    const iso = toIsoDate(targetDate);
    try {
      input.value = iso;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      if (input.value === iso) {
        input.style.backgroundColor = '#d4edda';
        return { success: true, method: 'native-iso' };
      }
    } catch (e) {}
  }

  // Widget-style date field → force calendar flow
  const isWidget =
    input.hasAttribute('readonly') ||
    input.readOnly === true ||
    input.classList.contains('hasDatepicker') ||
    input.classList.contains('datepicker') ||
    input.classList.contains('date-picker') ||
    input.hasAttribute('angular-mydatepicker') ||
    (input.closest && input.closest('.date-field, .input-group'));

  if (isWidget) {
    const cal = await _openCalendarAndPick(input, targetDate);
    if (cal.success) {
      input.style.backgroundColor = '#d4edda';
      return cal;
    }
  }

  // Direct write fallback
  const siteRule = (typeof window.getSiteRule === 'function') ? window.getSiteRule() : null;
  const fmt = (siteRule && siteRule.dateFormat) || detectDateFormat(input);
  const formatted = formatForPortal(targetDate, fmt);
  const iso = toIsoDate(targetDate);

  try {
    const wasRO = input.readOnly;
    const hadRO = input.hasAttribute('readonly');
    input.readOnly = false;
    input.removeAttribute('readonly');
    input.focus();
    input.value = formatted;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    if (hadRO) input.setAttribute('readonly', '');
    if (wasRO) input.readOnly = true;
    if (input.value === formatted || input.value === iso) {
      input.style.backgroundColor = '#d4edda';
      return { success: true, method: 'direct' };
    }
  } catch (e) {}

  return { success: false, error: 'All methods failed' };
}

async function _openCalendarAndPick(input, targetDate) {
  try { input.scrollIntoView({ block: 'center' }); await _dpSleep(250); } catch (e) {}

  const wasReadonly = input.readOnly;
  const hadReadonlyAttr = input.hasAttribute('readonly');

  try {
    // Force-enable the field
    input.readOnly = false;
    input.removeAttribute('readonly');
    input.disabled = false;
    input.removeAttribute('disabled');

    // ⚡ Try calling a named function from sibling's onclick (like DateTime8('appDob'))
    if (input.id) {
      const container = input.parentElement ? input.parentElement.parentElement : null;
      if (container) {
        const addons = container.querySelectorAll('[onclick]');
        for (let i = 0; i < addons.length; i++) {
          const oc = addons[i].getAttribute('onclick') || '';
          if (oc.indexOf(input.id) !== -1) {
            const fnName = oc.split('(')[0].trim();
            if (typeof window[fnName] === 'function') {
              try { window[fnName](input.id); } catch (e) {}
              await _dpSleep(400);
              let p = _findOpenPicker();
              if (p) return await _dpPickFromOpenPicker(input, targetDate, p, wasReadonly, hadReadonlyAttr);
            }
          }
        }
      }
    }

        // Standard multi-event click
    try { input.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window })); } catch (e) {}
    try { input.focus(); } catch (e) {}
    try { input.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window })); } catch (e) {}
    try { input.click(); } catch (e) {}

    // ⚡ jQuery UI datepicker — call its show() method directly
    try {
      if (typeof window.jQuery !== 'undefined' && window.jQuery(input).datepicker) {
        window.jQuery(input).datepicker('show');
      }
    } catch (e) {}

    // ⚡ Click any sibling calendar icon button
    try {
      const parent = input.parentElement;
      const grand = parent ? parent.parentElement : null;
      const iconSelectors = '.calendar-icon, .date-icon, .datepicker-trigger, [class*="calendar-icon"], [class*="datepicker"]';
      let icon = null;
      if (parent) icon = parent.querySelector(iconSelectors);
      if (!icon && grand) icon = grand.querySelector(iconSelectors);
      if (icon) {
        icon.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        icon.click();
      }
    } catch (e) {}

    await _dpSleep(500);

    let picker = _findOpenPicker();

    // Look for nearby calendar icon and click it
    if (!picker) {
      const nearby = [];
      const parent = input.parentElement;
      const grand = parent ? parent.parentElement : null;
      const iconSels = 'button, [role="button"], .calendar-icon, .date-icon, [class*="calendar"], [class*="datepicker"], [class*="picker"], svg, i, span';
      if (parent) parent.querySelectorAll(iconSels).forEach(function (el) { nearby.push(el); });
      if (grand) grand.querySelectorAll(iconSels).forEach(function (el) { nearby.push(el); });

      for (let i = 0; i < nearby.length && i < 8; i++) {
        const el = nearby[i];
        if (el === input) continue;
        try {
          el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
          el.click();
        } catch (e) {}
        await _dpSleep(250);
        picker = _findOpenPicker();
        if (picker) break;
      }
    }

    // Keyboard fallback
    if (!picker) {
      try {
        input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'F4' }));
        input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown' }));
        input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }));
      } catch (e) {}
      await _dpSleep(300);
      picker = _findOpenPicker();
    }

    if (!picker) {
      if (hadReadonlyAttr) input.setAttribute('readonly', '');
      if (wasReadonly) input.readOnly = true;
      return { success: false, error: 'No picker opened' };
    }

    return await _dpPickFromOpenPicker(input, targetDate, picker, wasReadonly, hadReadonlyAttr);
  } catch (e) {
    if (hadReadonlyAttr) input.setAttribute('readonly', '');
    if (wasReadonly) input.readOnly = true;
    return { success: false, error: e.message };
  }
}

async function _dpPickFromOpenPicker(input, targetDate, picker, wasReadonly, hadReadonlyAttr) {
  try {
    const header = _readPickerHeader(picker);
    let diff = 0;
    if (header.month !== -1) {
      diff = (targetDate.getFullYear() - header.year) * 12 + (targetDate.getMonth() - header.month);
    }

    const next = _findNextMonthBtn(picker);
    const prev = _findPrevMonthBtn(picker);
    for (let i = 0; i < Math.abs(diff); i++) {
      if (diff > 0 && next) next.click();
      else if (diff < 0 && prev) prev.click();
      await _dpSleep(120);
    }

    let cell = _findDayCell(picker, targetDate.getDate());
    if (!cell) {
      await _dpSleep(200);
      cell = _findDayCell(picker, targetDate.getDate());
    }

    if (cell) {
      try { cell.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); } catch (e) {}
      cell.click();
      await _dpSleep(250);
      try { input.dispatchEvent(new Event('blur', { bubbles: true })); } catch (e) {}
      if (hadReadonlyAttr) input.setAttribute('readonly', '');
      if (wasReadonly) input.readOnly = true;
      if (input.value && input.value.length > 0) {
        return { success: true, method: 'calendar' };
      }
      return { success: true, method: 'calendar-no-verify' };
    }

    if (hadReadonlyAttr) input.setAttribute('readonly', '');
    if (wasReadonly) input.readOnly = true;
    return { success: false, error: 'Day cell not found' };
  } catch (e) {
    if (hadReadonlyAttr) input.setAttribute('readonly', '');
    if (wasReadonly) input.readOnly = true;
    return { success: false, error: e.message };
  }
}

function _findOpenPicker() {
  const sels = [
    '.dp-popup', '.dp-date-picker', 'dp-date-picker',
    'dp-date-picker', '.dp-material',
    'mat-datepicker-content', '.mat-datepicker-popup', '.mat-calendar',
    '.datepicker', '.date-picker', '.calendar', '.ui-datepicker',
    '[class*="picker"]', '[class*="calendar"]', '[class*="mydatepicker"]'
  ];
  for (let i = 0; i < sels.length; i++) {
    const list = document.querySelectorAll(sels[i]);
    for (let j = 0; j < list.length; j++) {
      const el = list[j];
      if (el.offsetParent !== null && el.offsetHeight > 0 && (el.innerText || '').length > 0) return el;
    }
  }
  return null;
}

function _readPickerHeader(picker) {
  const el = picker.querySelector('.dp-calendar-month, .datepicker-switch, .ui-datepicker-title, [class*="month"], [class*="header"]');
  const text = el ? el.innerText : picker.innerText.slice(0, 200);
  const months = ['january','february','march','april','may','june','july','august','september','october','november','december'];
  const lower = text.toLowerCase();
  let month = -1;
  let year = new Date().getFullYear();
  for (let i = 0; i < months.length; i++) {
    if (lower.indexOf(months[i]) !== -1 || lower.indexOf(months[i].slice(0, 3)) !== -1) { month = i; break; }
  }
  const ym = text.match(/\b(19|20)\d{2}\b/);
  if (ym) year = parseInt(ym[0], 10);
  return { month: month, year: year };
}

function _findNextMonthBtn(p) {
  return p.querySelector('.dp-next, .next, [class*="next"], [aria-label*="next" i], button[title*="next" i]');
}
function _findPrevMonthBtn(p) {
  return p.querySelector('.dp-prev, .prev, [class*="prev"], [aria-label*="prev" i], button[title*="prev" i]');
}

function _findDayCell(p, day) {
  const cells = p.querySelectorAll('td, .dp-day, .day, [class*="day"], button, span');
  const target = String(day);
  for (let i = 0; i < cells.length; i++) {
    const t = (cells[i].innerText || '').trim();
    if (t === target) return cells[i];
  }
  return null;
}

window.setDateField = setDateField;
window.detectDateFormat = detectDateFormat;
window.formatForPortal = formatForPortal;
window.toIsoDate = toIsoDate;
window.parseRobustDate = function (value) {
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
};