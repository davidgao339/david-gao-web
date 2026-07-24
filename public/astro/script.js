/* ============================================================
   RENDER: METRICS
   ============================================================ */
const METRIC_NAMES = {
  heart:     'HARMONY WAVES',
  emotional: 'EMOTIONAL RESONANCE',
  physical:  'PHYSICAL AND INTIMATE CHEMISTRY'
};

function getMetricBlurb(key, val) {
  if (key === 'heart') {
    if (val >= 60) return 'High capacity for active listening. You share compatible lifestyle habits. There is mutual trust between partners. Great for friendships and long-term relationships.';
    if (val > 0)  return 'There is a solid foundation of mutual respect, but deeper communication may sometimes require extra effort. Building trust will strengthen your bond over time.';
    return 'Frequent misunderstandings and clashing lifestyle habits. Patience and active listening are absolutely necessary to bridge the gap and build trust.';
  }
  if (key === 'emotional') {
    if (val >= 60) return 'Empathetic conflict resolution and shared humor. You love spending time with each other and love similar activities.';
    if (val > 0)  return 'You connect well on a basic level, but your emotional needs may differ at times. Finding common ground in shared activities helps align your feelings.';
    return 'There can be emotional disconnects and differing ways of processing feelings. It takes conscious effort to understand each other\'s emotional language.';
  }
  if (key === 'physical') {
    if (val >= 60) return 'Strong physical connection, complementary attachment styles, and alignment in intimacy preferences.';
    if (val > 0)  return 'A moderate physical connection. You may have different pacing or intimacy preferences that require open communication to fully align.';
    return 'Mismatched physical energy and attachment styles. You will need to openly discuss and respect each other\'s boundaries and needs to find common ground.';
  }
  return '';
}

function renderChakras(data) {
  const chart   = data.bio_result_chart;

  const barsEl = document.getElementById('chakra-bars');
  barsEl.innerHTML = '';

  Object.entries(METRIC_NAMES).forEach(([key, name]) => {
    // Skip physical here, we handle it below as a bonus
    if (key === 'physical') {
      return; 
    }

    const rawVal = chart[key] ?? 0;
    const pct    = Math.abs(rawVal);
    const isNeg  = rawVal < 0;
    const desc   = getMetricBlurb(key, rawVal);

    const row = document.createElement('div');
    row.className = 'chakra-bar-row';
    row.innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom:5px; cursor:pointer; user-select:none;" class="metric-header">
        <div class="chakra-bar-label">${name} <span class="expand-icon" style="display:inline-block; transition:transform 0.3s; font-size:0.8rem; margin-left:6px; opacity:0.8;">▼</span></div>
        <div class="chakra-bar-pct" style="margin-top:0;">${rawVal}%</div>
      </div>
      <div class="chakra-bar-track">
        <div class="chakra-bar-fill ${isNeg ? 'negative' : ''}" style="width: 0%"></div>
      </div>
      <div class="metric-details" style="display:none; font-size:0.9rem; color:#e2e8f0; margin-top:10px; line-height:1.5; padding:10px; background:rgba(255,255,255,0.05); border-radius:8px;">${desc}</div>
    `;
    barsEl.appendChild(row);

    // Toggle expansion logic
    const header = row.querySelector('.metric-header');
    const details = row.querySelector('.metric-details');
    const icon = row.querySelector('.expand-icon');
    
    header.addEventListener('click', () => {
      const isHidden = details.style.display === 'none';
      details.style.display = isHidden ? 'block' : 'none';
      icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
    });

    // Animate the bar width
    setTimeout(() => {
      row.querySelector('.chakra-bar-fill').style.width = Math.min(pct, 100) + '%';
    }, 100);
  });

  // Render Physical as a Bonus Section if toggled on
  const includeSexCompat = document.getElementById('sex-compat-toggle').checked;
  if (includeSexCompat) {
    const physVal = chart['physical'] ?? 0;
    const desc = getMetricBlurb('physical', physVal);
    const bonusDiv = document.createElement('div');
    
    if (physVal >= 60) {
      // Bonus met!
      bonusDiv.style.cssText = "margin-top:25px; padding:15px; background:rgba(255,105,180,0.15); border:1px solid rgba(255,105,180,0.4); border-radius:12px; text-align:center; box-shadow: inset 0 0 15px rgba(255,105,180,0.1); cursor:pointer; user-select:none;";
      bonusDiv.innerHTML = `
        <div class="bonus-header">
          <div style="font-size:1.1rem; font-weight:bold; color:#ffb6c1; margin-bottom:0; letter-spacing:0.5px;">
            💖 BONUS: Physical Chemistry (${physVal}%) <span class="expand-icon" style="display:inline-block; transition:transform 0.3s; font-size:0.8rem; margin-left:6px; opacity:0.8;">▼</span>
          </div>
        </div>
        <div class="metric-details" style="display:none; font-size:0.9rem; color:#fde4ec; line-height:1.5; margin-top:12px;">${desc}</div>
      `;
    } else {
      // Not met threshold
      bonusDiv.style.cssText = "margin-top:25px; padding:15px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; text-align:center; cursor:pointer; user-select:none;";
      bonusDiv.innerHTML = `
        <div class="bonus-header">
          <div style="font-size:1rem; font-weight:bold; color:#a5c9f5; margin-bottom:0;">
            Physical Chemistry (${physVal}%) <span class="expand-icon" style="display:inline-block; transition:transform 0.3s; font-size:0.8rem; margin-left:6px; opacity:0.8;">▼</span>
          </div>
        </div>
        <div class="metric-details" style="display:none; font-size:0.9rem; color:#cbd5e1; line-height:1.5; margin-top:12px;">${desc}</div>
      `;
    }
    barsEl.appendChild(bonusDiv);

    // Toggle expansion logic for bonus
    const details = bonusDiv.querySelector('.metric-details');
    const icon = bonusDiv.querySelector('.expand-icon');
    
    bonusDiv.addEventListener('click', () => {
      const isHidden = details.style.display === 'none';
      details.style.display = isHidden ? 'block' : 'none';
      icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
    });
  }
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
    errEl.textContent = 'Please fill out all birthday fields.';
    errEl.classList.remove('hidden');
    return;
  }

  const mDayNum = parseInt(mDay);
  const mMonthNum = parseInt(mMonth);
  const mYearNum = parseInt(mYear);
  const fDayNum = parseInt(fDay);
  const fMonthNum = parseInt(fMonth);
  const fYearNum = parseInt(fYear);

  const yourDateObj = new Date(mYearNum, mMonthNum - 1, mDayNum);
  const partnerDateObj = new Date(fYearNum, fMonthNum - 1, fDayNum);

  if (yourDateObj.getDate() !== mDayNum || partnerDateObj.getDate() !== fDayNum) {
    errEl.textContent = 'Please select valid calendar dates.';
    errEl.classList.remove('hidden');
    return;
  }

  errEl.classList.add('hidden');

  const btn = document.getElementById('calc-btn');
  btn.disabled = true;
  btn.textContent = 'ANALYZING...';

  try {
    const data = calculateCompatibility(
      mDayNum, mMonthNum, mYearNum,
      fDayNum, fMonthNum, fYearNum
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
      verdict = verdict.replace('Perfect Match', "It's a perfect match. You found TRUE LOVE");
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
  
  document.getElementById('back-btn').addEventListener('click', () => {
    document.getElementById('results-card').classList.add('hidden');
    document.getElementById('input-card').classList.remove('hidden');
    window.scrollTo(0, 0);
  });
});
