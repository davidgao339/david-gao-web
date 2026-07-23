/* ============================================================
   SETUP: Populate date dropdowns
   ============================================================ */
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

function populateSelects() {
  ['m','f'].forEach(prefix => {
    const dayEl   = document.getElementById(`${prefix}-day`);
    const monthEl = document.getElementById(`${prefix}-month`);
    const yearEl  = document.getElementById(`${prefix}-year`);

    for (let d = 1; d <= 31; d++) {
      const o = document.createElement('option');
      o.value = d; o.textContent = d;
      dayEl.appendChild(o);
    }

    MONTHS.forEach((m, i) => {
      const o = document.createElement('option');
      o.value = i + 1; o.textContent = m;
      monthEl.appendChild(o);
    });

    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1920; y--) {
      const o = document.createElement('option');
      o.value = y; o.textContent = y;
      yearEl.appendChild(o);
    }
  });
}

/* ============================================================
   PROGRESS BAR
   ============================================================ */
const progressBar = document.getElementById('progress-bar');

function setProgress(pct) {
  progressBar.style.width = pct + '%';
}

/* ============================================================
   RENDER: CHAKRAS
   ============================================================ */
const CHAKRA_NAMES = {
  physical:  'Muladhara (Physical/Sex)',
  emotional: 'Svadhisthana (Emotional)',
  heart:     'Anahata (Heart)'
};

function renderChakras(data) {
  const top     = data.bio_result_top;
  const chart   = data.bio_result_chart;
  const labels  = data.bio_result_chart_labels;
  const balance = data.bio_result_balance;

  document.getElementById('chakra-compat').textContent    = top.totalCompatibility;
  document.getElementById('chakra-dissonance').textContent = top.totalDissonance;
  document.getElementById('chakra-balance').textContent   = balance.balanceTotal;

  const barsEl = document.getElementById('chakra-bars');
  barsEl.innerHTML = '';

  Object.entries(CHAKRA_NAMES).forEach(([key, name]) => {
    const rawVal = chart[key] ?? 0;
    const pct    = Math.abs(rawVal);
    const label  = labels[`${key}-label`] || '';
    const isNeg  = rawVal < 0;

    const row = document.createElement('div');
    row.className = 'chakra-bar-row';
    row.innerHTML = `
      <div class="chakra-bar-label">${name}</div>
      <div class="chakra-bar-track">
        <div class="chakra-bar-fill ${isNeg ? 'negative' : ''}" style="width:${pct}%"></div>
      </div>
      <div class="chakra-bar-pct">${rawVal}% <span style="color:#aaa;font-size:11px">${label}</span></div>
    `;
    barsEl.appendChild(row);
  });
}

/* ============================================================
   RENDER: ZODIAC
   ============================================================ */
function renderZodiac(data) {
  const signs = data.zodiac_result_signs;
  const roles = data.zodiac_result_roles;

  document.getElementById('zodiac-sign-male').textContent    = signs.zodiacSignMale;
  document.getElementById('zodiac-element-male').textContent = signs.zodiacElementMale;
  document.getElementById('zodiac-period-male').textContent  = signs.zodiacPeriodMale;

  document.getElementById('zodiac-sign-female').textContent    = signs.zodiacSignFemale;
  document.getElementById('zodiac-element-female').textContent = signs.zodiacElementFemale;
  document.getElementById('zodiac-period-female').textContent  = signs.zodiacPeriodFemale;

  document.getElementById('zodiac-harmony').textContent   = signs.zodiacElementHarmony;
  document.getElementById('zodiac-role-title').textContent = roles.zodiacRoleTitle;
  document.getElementById('zodiac-role-diff').textContent  = roles.zodiacRoleDifference;
  document.getElementById('zodiac-role-desc').textContent  = roles.zodiacRoleDescription;
  document.getElementById('zodiac-pair-text').textContent  = roles.zodiacPairText;
}



/* ============================================================
   MAIN CALCULATE HANDLER
   ============================================================ */
function calculate() {
  const mDay   = document.getElementById('m-day').value;
  const mMonth = document.getElementById('m-month').value;
  const mYear  = document.getElementById('m-year').value;
  const fDay   = document.getElementById('f-day').value;
  const fMonth = document.getElementById('f-month').value;
  const fYear  = document.getElementById('f-year').value;

  const errEl = document.getElementById('calc-error');
  if (!mDay || !mMonth || !mYear || !fDay || !fMonth || !fYear) {
    errEl.classList.remove('hidden');
    return;
  }
  errEl.classList.add('hidden');

  const btn = document.getElementById('calc-btn');
  btn.disabled = true;
  btn.textContent = 'Calculating…';
  setProgress(20);

  try {
    setProgress(40);
    const data = calculateCompatibility(mDay, mMonth, mYear, fDay, fMonth, fYear);
    setProgress(80);

    renderChakras(data);
    renderZodiac(data);
    
    document.getElementById('final-verdict').textContent = data.final_verdict;

    setProgress(100);
    document.getElementById('results').classList.remove('hidden');

    setTimeout(() => {
      document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => setProgress(0), 600);
    }, 100);

  } catch (err) {
    console.error(err);
    errEl.textContent = 'Failed to calculate results. Please try again.';
    errEl.classList.remove('hidden');
    setProgress(0);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Calculate Compatibility';
  }
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  populateSelects();
  document.getElementById('calc-btn').addEventListener('click', calculate);
});
