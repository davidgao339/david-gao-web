/* ============================================================
   RENDER: METRICS
   ============================================================ */
const METRIC_NAMES = {
  heart:     'HARMONY WAVES',
  emotional: 'EMOTIONAL RESONANCE',
  physical:  'PHYSICAL AND INTIMATE CHEMISTRY'
};

const METRIC_DESCS = {
  heart:     'High capacity for active listening. You share compatible lifestyle habits. There is mutual trust between partners. Great for friendships and long-term relationships.',
  emotional: 'Empathetic conflict resolution and shared humor. You love spending time with each other and love similar activities.',
  physical:  'Strong physical connection, complementary attachment styles, and alignment in intimacy preferences'
};

function renderChakras(data) {
  const chart   = data.bio_result_chart;

  const barsEl = document.getElementById('chakra-bars');
  barsEl.innerHTML = '';

  Object.entries(METRIC_NAMES).forEach(([key, name]) => {
    // If Sexual Compatibility toggle is off, don't show the physical bar
    const includeSexCompat = document.getElementById('sex-compat-toggle').checked;
    if (key === 'physical' && !includeSexCompat) {
      return; 
    }

    const rawVal = chart[key] ?? 0;
    const pct    = Math.abs(rawVal);
    const isNeg  = rawVal < 0;
    const desc   = METRIC_DESCS[key];

    const row = document.createElement('div');
    row.className = 'chakra-bar-row';
    row.innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
        <div class="chakra-bar-label">${name}</div>
        <div class="chakra-bar-pct" style="margin-top:0;">${rawVal}%</div>
      </div>
      <div class="chakra-bar-track">
        <div class="chakra-bar-fill ${isNeg ? 'negative' : ''}" style="width: 0%"></div>
      </div>
      <div style="font-size:0.8rem; color:#8daed8; margin-top:8px; line-height:1.4;">${desc}</div>
    `;
    barsEl.appendChild(row);

    // Animate the bar width
    setTimeout(() => {
      row.querySelector('.chakra-bar-fill').style.width = pct + '%';
    }, 100);
  });
}

/* ============================================================
   RENDER: ZODIAC
   ============================================================ */
function renderZodiac(data, yourName, partnerName) {
  const signs = data.zodiac_result_signs;
  const roles = data.zodiac_result_roles;

  document.getElementById('zodiac-name-male').textContent = yourName || "You";
  document.getElementById('zodiac-sign-male').textContent    = signs.zodiacSignMale;
  document.getElementById('zodiac-element-male').textContent = signs.zodiacElementMale;

  document.getElementById('zodiac-name-female').textContent = partnerName || "Partner";
  document.getElementById('zodiac-sign-female').textContent    = signs.zodiacSignFemale;
  document.getElementById('zodiac-element-female').textContent = signs.zodiacElementFemale;

  document.getElementById('zodiac-harmony').textContent   = signs.zodiacElementHarmony;
  document.getElementById('zodiac-role-title').textContent = roles.zodiacRoleTitle;
  document.getElementById('zodiac-role-desc').textContent  = roles.zodiacRoleDescription;
  document.getElementById('zodiac-pair-text').textContent  = roles.zodiacPairText;
}

/* ============================================================
   MAIN CALCULATE HANDLER
   ============================================================ */
function calculate() {
  const yourName = document.getElementById('your-name').value.trim();
  const partnerName = document.getElementById('partner-name').value.trim();
  
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
  btn.textContent = 'ANALYZING...';

  try {
    const data = calculateCompatibility(
      parseInt(mDay), parseInt(mMonth), parseInt(mYear),
      parseInt(fDay), parseInt(fMonth), parseInt(fYear)
    );

    // Render components
    renderChakras(data);
    renderZodiac(data, yourName, partnerName);
    
    // Modify verdict if sexual compatibility is turned off
    let verdict = data.final_verdict;
    const includeSexCompat = document.getElementById('sex-compat-toggle').checked;
    if (!includeSexCompat) {
      verdict = verdict.replace(' (Great Physical Chemistry!)', '');
    }

    if (verdict.includes('Perfect Match')) {
      verdict = "Its a perfect match. You found TRUE LOVE";
    }

    document.getElementById('final-verdict').textContent = verdict;

    // Trigger wave animation
    const waveOverlay = document.getElementById('wave-transition');
    waveOverlay.classList.remove('hidden');
    waveOverlay.classList.add('active');

    // Swap the cards halfway through the wave (when screen is covered)
    setTimeout(() => {
      document.getElementById('input-card').classList.add('hidden');
      document.getElementById('results-card').classList.remove('hidden');
      window.scrollTo(0, 0); // Reset scroll position for new page
    }, 1400);

    // Hide wave overlay after animation finishes
    setTimeout(() => {
      waveOverlay.classList.remove('active');
      waveOverlay.classList.add('hidden');
      btn.disabled = false;
      btn.textContent = 'BEGIN ANALYSIS';
    }, 3000);

  } catch (err) {
    console.error(err);
    errEl.textContent = 'Failed to calculate results. Please try again.';
    errEl.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = 'BEGIN ANALYSIS';
  }
}

/* ============================================================
   UI HELPERS
   ============================================================ */
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function populateSelects() {
  ['m','f'].forEach(prefix => {
    const dayEl   = document.getElementById(`${prefix}-day`);
    const monthEl = document.getElementById(`${prefix}-month`);
    const yearEl  = document.getElementById(`${prefix}-year`);

    const do1 = document.createElement('option'); do1.value = ""; do1.textContent = "Day"; do1.selected = true; dayEl.appendChild(do1);
    const mo1 = document.createElement('option'); mo1.value = ""; mo1.textContent = "Month"; mo1.selected = true; monthEl.appendChild(mo1);
    const yo1 = document.createElement('option'); yo1.value = ""; yo1.textContent = "Year"; yo1.selected = true; yearEl.appendChild(yo1);

    for (let d = 1; d <= 31; d++) {
      const o = document.createElement('option'); o.value = d; o.textContent = d; dayEl.appendChild(o);
    }
    MONTHS.forEach((m, i) => {
      const o = document.createElement('option'); o.value = i + 1; o.textContent = m; monthEl.appendChild(o);
    });
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1920; y--) {
      const o = document.createElement('option'); o.value = y; o.textContent = y; yearEl.appendChild(o);
    }
  });
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  populateSelects();
  document.getElementById('calc-btn').addEventListener('click', calculate);
});
