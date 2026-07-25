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
    if (val >= 60) return 'Built on active listening, compatible lifestyles, and deep mutual trust, this connection is ideal for both strong friendships and long-term relationships';
    return 'While there is a baseline of mutual respect, your partner may occasionally lack understanding and care. Reaching deeper levels of communication will demand intentional effort, and building lasting trust may present a real challenge over time';
  }
  if (key === 'emotional') {
    if (val >= 60) return 'Bonded by a shared sense of humor and empathetic conflict resolution, you genuinely enjoy each other\'s company and share similar interests';
    return 'While you may connect on a surface level, a deep emotional incompatibility makes forming a strong long-term bond difficult. With a noticeable lack of emotional intimacy, shared interests, and aligned life goals, the relationship faces significant long-term strain, raising the risk that one partner may seek fulfillment elsewhere';
  }
  if (key === 'physical') {
    if (val >= 60) return 'You share a strong physical chemistry, attachment styles that naturally balance each other out, and matching expectations when it comes to intimacy';
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

  const harmonyEl = document.getElementById('zodiac-harmony');
  const harmony = signs.zodiacElementHarmony;
  harmonyEl.textContent = harmony;
  if (harmony === 'Elements clash') {
    harmonyEl.style.color = '#f87171'; // Red for clash
  } else {
    harmonyEl.style.color = '';
  }
  
  document.getElementById('zodiac-role-title').textContent = roles.zodiacRoleTitle;
  document.getElementById('zodiac-role-desc').textContent  = roles.zodiacRoleDescription;
  
  const pairTextEl = document.getElementById('zodiac-pair-text');
  if (pairTextEl) pairTextEl.style.display = 'none'; // hide the duplicate text
}

/* ============================================================
   RENDER: FULL REPORT
   ============================================================ */
function renderFullReport(report, yourName, partnerName) {
  // Extra report details (Numerology, Tarot, Scenarios) have been removed
  // We leave this function empty so it doesn't crash, but it can be expanded later if needed.
}

/* ============================================================
   MAIN CALCULATE HANDLER
   ============================================================ */
let chartInstance = null;
let originalSummaryHTML = null;

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
    
    // Modify verdict to unconditionally remove the physical chemistry string from the main banner
    let verdict = data.final_verdict.replace(' (Great Physical Chemistry!)', '');
    const includeSexCompat = document.getElementById('sex-compat-toggle').checked;

    const finalVerdictEl = document.getElementById('final-verdict');
    if (verdict.includes('Perfect Match')) {
      verdict = verdict.replace('Perfect Match', "It's a perfect match. You found TRUE LOVE");
      finalVerdictEl.className = 'verdict-text verdict-good';
      finalVerdictEl.textContent = verdict;
    } else if (verdict.includes('Not compatible')) {
      finalVerdictEl.className = 'verdict-text verdict-bad';
      finalVerdictEl.innerHTML = `
        <div style="color: #ef4444; font-weight: bold; font-size: 1.5rem; letter-spacing: 1px;">NOT COMPATIBLE</div>
        <div style="color: #60a5fa; font-size: 1.1rem; margin-top: 5px;">(Can be friends)</div>
      `;
    } else {
      // Good compatibility (but not perfect)
      finalVerdictEl.className = 'verdict-text verdict-good';
      finalVerdictEl.textContent = verdict;
    }

    // Render Full Report
    renderFullReport(data.full_report, yourName, partnerName);

    // Handle Low Compatibility Summary in Modal
    const summaryBlock = document.getElementById('low-compat-summary');
    if (originalSummaryHTML === null) {
      originalSummaryHTML = summaryBlock.innerHTML;
    }
    // Restore pristine HTML in case it was overwritten in a previous calculation
    summaryBlock.innerHTML = originalSummaryHTML;
    
    // Reset classes
    summaryBlock.className = 'report-section hidden';
    summaryBlock.style.borderLeft = "4px solid #ef4444";
    summaryBlock.style.background = "rgba(239, 68, 68, 0.05)";

    const pHarmony = document.getElementById('low-compat-harmony');
    const pEmotion = document.getElementById('low-compat-emotion');
    const pBoth = document.getElementById('low-compat-both');
    
    pHarmony.classList.add('hidden');
    pEmotion.classList.add('hidden');
    pBoth.classList.add('hidden');

    if (verdict.includes('Not compatible')) {
      summaryBlock.classList.remove('hidden');
      
      let clashCount = 0;
      let hasElementClashTemplate = false;
      let clashT = null;
      
      if (data.zodiac_result_signs.zodiacElementHarmony === 'Elements clash') {
        const sign1 = data.zodiac_result_signs.zodiacElementMale;
        const sign2 = data.zodiac_result_signs.zodiacElementFemale;
        let clashKey = `${sign1}-${sign2}`;
        if (!CLASH_TEXTS[clashKey]) {
            clashKey = `${sign2}-${sign1}`;
        }
        
        if (CLASH_TEXTS[clashKey]) {
            hasElementClashTemplate = true;
            clashT = CLASH_TEXTS[clashKey];
        }
      }
      
      if (hasElementClashTemplate) {
          let insightsHtml = clashT.insights.map(i => `<li style="margin-bottom: 8px;">${i}</li>`).join('');
          
          if (data.bio_result_chart.heart <= 60) {
              insightsHtml += `<li style="margin-bottom: 8px;"><strong>Natural Misalignment:</strong> Your core personalities and default conflict-resolution styles require very different environments to feel completely understood and supported.</li>`;
              clashCount++;
          }
          if (data.bio_result_chart.emotional <= 60) {
              insightsHtml += `<li style="margin-bottom: 8px;"><strong>Emotional Misalignment:</strong> The areas where you differ are fundamental—such as emotional needs, future goals, or communication preferences—rather than minor preferences.</li>`;
              clashCount++;
          }
          if (clashCount > 0 || hasElementClashTemplate) {
              insightsHtml += `<li style="margin-bottom: 8px;"><strong>Energy Investment:</strong> Sustaining harmony in this partnership will likely require continuous, heavy compromise and emotional heavy-lifting from both sides.</li>`;
          }

          summaryBlock.innerHTML = `
            <h3 style="color: #ef4444; font-size: 1.4rem;">Relationship Compatibility Summary</h3>
            <p style="font-weight: bold; margin-bottom: 15px; font-size: 1.1rem; color: #fca5a5;">${clashT.title}</p>
            
            <p><strong>A Quick Note from Us:</strong><br>${clashT.note}</p>
            
            <h4 style="color: #f87171; margin-top: 15px; font-size: 1.1rem; margin-bottom: 8px;">Key Findings & Insights</h4>
            <ul style="padding-left: 20px; margin-bottom: 15px;">
              ${insightsHtml}
            </ul>
            
            <h4 style="color: #f87171; margin-top: 15px; font-size: 1.1rem; margin-bottom: 8px;">What Does This Mean for You?</h4>
            <p>${clashT.meaningIntro}</p>
            
            <p style="margin-top: 10px;"><strong>${clashT.path1Title}</strong><br>
            ${clashT.path1Intro}<br>
            <ul style="padding-left: 20px; margin-top: 5px; margin-bottom: 5px;">
              ${clashT.path1Points.map(p => `<li style="margin-bottom: 5px;">${p}</li>`).join('')}
            </ul>
            </p>
            
            <p style="margin-top: 10px;"><strong>${clashT.path2Title}</strong><br>
            ${clashT.path2Intro}<br>
            <ul style="padding-left: 20px; margin-top: 5px; margin-bottom: 5px;">
              ${clashT.path2Points.map(p => `<li style="margin-bottom: 5px;">${p}</li>`).join('')}
            </ul>
            </p>
            
            <p style="margin-top: 15px;"><strong>Next Steps</strong><br>${clashT.nextSteps}</p>
          `;
      } else {
          // Normal HTML path without Element Clash text overwrite
          if (data.bio_result_chart.heart <= 60) {
            if (pHarmony) pHarmony.classList.remove('hidden');
            clashCount++;
          }
          if (data.bio_result_chart.emotional <= 60) {
            if (pEmotion) pEmotion.classList.remove('hidden');
            clashCount++;
          }
          if (clashCount > 0) {
            if (pBoth) pBoth.classList.remove('hidden');
          }
      }
    } else if (verdict.includes('Perfect Match') || verdict.includes('Good compatibility') || verdict.includes('TRUE LOVE')) {
      summaryBlock.classList.remove('hidden');
      summaryBlock.style.borderLeft = "4px solid #10b981";
      summaryBlock.style.background = "rgba(16, 185, 129, 0.05)";
      
      const t = {
        title: "Overall Result: Exceptional Compatibility",
        note: "A high compatibility score is one of the rarest and most exciting findings. It means your core values, communication styles, and natural worldviews align smoothly, giving you a remarkably strong foundation to build upon.",
        insights: [
          "<strong>Effortless Flow:</strong> Your communication and emotional processing styles complement each other naturally, making it easier to understand each other without constant translation.",
          "<strong>Shared Direction:</strong> Your underlying goals, personal values, and lifestyle preferences move in the same direction, reducing major friction around long-term choices.",
          "<strong>Built-in Support:</strong> You naturally provide the type of care, validation, and motivation that the other person needs to thrive."
        ],
        meaningIntro: "Finding a partner with whom everything \"just clicks\" is rare. Natural compatibility gives your relationship a massive head start, making love feel less like a heavy project and more like a safe harbor.",
        path1Title: "1. Why This Dynamic Works",
        path1Intro: "",
        path1Points: [
          "<strong>Ease & Comfort:</strong> You can truly be yourselves without feeling the need to perform, overly compensate, or walking on eggshells.",
          "<strong>Constructive Growth:</strong> When disagreements inevitably happen, your shared framework makes it much easier to listen, resolve conflict quickly, and grow closer rather than drifting apart."
        ],
        path2Title: "2. Nurturing Your Connection",
        path2Intro: "While natural synergy makes things feel easy, even the best connections flourish with intentional care:",
        path2Points: [
          "<strong>Keep Exploring:</strong> Use your strong dynamic as a springboard to try new things, pursue shared goals, and build lasting memories together.",
          "<strong>Don't Take It for Granted:</strong> High compatibility is a rare gift—continue to appreciate, celebrate, and invest in the unique bond you've found."
        ],
        nextSteps: "Celebrate this connection! Use this score as reassurance that you’ve found something truly special—a partnership built on mutual understanding, genuine care, and exceptional potential."
      };
      
      summaryBlock.innerHTML = `
        <h3 style="color: #10b981; font-size: 1.4rem;">Relationship Compatibility Summary</h3>
        <p style="font-weight: bold; margin-bottom: 15px; font-size: 1.1rem; color: #6ee7b7;">${t.title}</p>
        
        <p><strong>A Quick Note from Us:</strong><br>${t.note}</p>
        
        <h4 style="color: #34d399; margin-top: 15px; font-size: 1.1rem; margin-bottom: 8px;">Key Findings & Insights</h4>
        <ul style="padding-left: 20px; margin-bottom: 15px;">
          ${t.insights.map(i => `<li style="margin-bottom: 8px;">${i}</li>`).join('')}
        </ul>
        
        <h4 style="color: #34d399; margin-top: 15px; font-size: 1.1rem; margin-bottom: 8px;">What Does This Mean for You?</h4>
        <p>${t.meaningIntro}</p>
        
        <p style="margin-top: 10px;"><strong>${t.path1Title}</strong><br>
        ${t.path1Intro}
        <ul style="padding-left: 20px; margin-top: 5px; margin-bottom: 5px;">
          ${t.path1Points.map(p => `<li style="margin-bottom: 5px;">${p}</li>`).join('')}
        </ul>
        </p>
        
        <p style="margin-top: 10px;"><strong>${t.path2Title}</strong><br>
        ${t.path2Intro}
        <ul style="padding-left: 20px; margin-top: 5px; margin-bottom: 5px;">
          ${t.path2Points.map(p => `<li style="margin-bottom: 5px;">${p}</li>`).join('')}
        </ul>
        </p>
        
        <p style="margin-top: 15px;"><strong>Next Steps</strong><br>${t.nextSteps}</p>
      `;
    } else {
      summaryBlock.classList.add('hidden');
    }

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
  
  const backBtn = document.getElementById('back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      document.getElementById('results-card').classList.add('hidden');
      document.getElementById('input-card').classList.remove('hidden');
      window.scrollTo(0, 0);
    });
  }

  const modal = document.getElementById('full-report-modal');
  const fullReportBtn = document.getElementById('full-report-btn');
  if (fullReportBtn) {
    fullReportBtn.addEventListener('click', () => {
      modal.classList.remove('hidden');
    });
  }
  const closeModalBtn = document.getElementById('close-modal-btn');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });
});
