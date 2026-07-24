/* ============================================================
   RENDER: CHAKRAS
   ============================================================ */
const CHAKRA_NAMES = {
  physical:  'Muladhara (Physical/Sex)',
  emotional: 'Svadhisthana (Emotional)',
  heart:     'Anahata (Heart)'
};

function renderChakras(data) {
  const chart   = data.bio_result_chart;
  const labels  = data.bio_result_chart_labels;

  const barsEl = document.getElementById('chakra-bars');
  barsEl.innerHTML = '';

  Object.entries(CHAKRA_NAMES).forEach(([key, name]) => {
    // If Sexual Compatibility toggle is off, don't show the Muladhara bar
    const includeSexCompat = document.getElementById('sex-compat-toggle').checked;
    if (key === 'physical' && !includeSexCompat) {
      return; 
    }

    const rawVal = chart[key] ?? 0;
    const pct    = Math.abs(rawVal);
    const label  = labels[`${key}-label`] || '';
    const isNeg  = rawVal < 0;

    const row = document.createElement('div');
    row.className = 'chakra-bar-row';
    row.innerHTML = `
      <div class="chakra-bar-label">${key === 'physical' ? 'Muladhara (Physical)' : name}</div>
      <div class="chakra-bar-track">
        <div class="chakra-bar-fill ${isNeg ? 'negative' : ''}" style="width: 0%"></div>
      </div>
      <div class="chakra-bar-pct">${rawVal}% <span style="color:#aaa;font-size:11px">${label}</span></div>
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
function parseDate(dateStr) {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [m, d, y] = parts.map(num => parseInt(num, 10));
  if (isNaN(m) || isNaN(d) || isNaN(y)) return null;
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) return null;
  return { mDay: d, mMonth: m, mYear: y };
}

function calculate() {
  const yourName = document.getElementById('your-name').value.trim();
  const partnerName = document.getElementById('partner-name').value.trim();
  
  const yourBdayStr = document.getElementById('your-birthday').value.trim();
  const partnerBdayStr = document.getElementById('partner-birthday').value.trim();

  const errEl = document.getElementById('calc-error');
  
  const yourDate = parseDate(yourBdayStr);
  const partnerDate = parseDate(partnerBdayStr);

  if (!yourDate || !partnerDate) {
    errEl.classList.remove('hidden');
    return;
  }
  errEl.classList.add('hidden');

  const btn = document.getElementById('calc-btn');
  btn.disabled = true;
  btn.textContent = 'ANALYZING...';

  try {
    const data = calculateCompatibility(
      yourDate.mDay, yourDate.mMonth, yourDate.mYear,
      partnerDate.mDay, partnerDate.mMonth, partnerDate.mYear
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
      verdict = "It's a Perfect Match! You Found Your Lover!";
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
function formatDateInput(e) {
  // Remove all non-digits
  let val = e.target.value.replace(/\D/g, '');
  if (val.length > 8) val = val.substring(0, 8);
  
  // Format as MM/DD/YYYY
  if (val.length > 4) {
    e.target.value = val.substring(0, 2) + '/' + val.substring(2, 4) + '/' + val.substring(4, 8);
  } else if (val.length > 2) {
    e.target.value = val.substring(0, 2) + '/' + val.substring(2, 4);
  } else {
    e.target.value = val;
  }
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('calc-btn').addEventListener('click', calculate);
  
  // Add auto-formatting to date inputs
  const yourBday = document.getElementById('your-birthday');
  const partnerBday = document.getElementById('partner-birthday');
  if (yourBday) yourBday.addEventListener('input', formatDateInput);
  if (partnerBday) partnerBday.addEventListener('input', formatDateInput);
});
