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

    const pctColor = rawVal >= 60 ? '#10b981' : '#ef4444';

    const row = document.createElement('div');
    row.className = 'chakra-bar-row';
    row.innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom:5px; cursor:pointer; user-select:none;" class="metric-header">
        <div class="chakra-bar-label">${name} <span class="expand-icon" style="display:inline-block; transition:transform 0.3s; font-size:0.8rem; margin-left:6px; opacity:0.8;">▼</span></div>
        <div class="chakra-bar-pct" style="margin-top:0; color: ${pctColor};">${rawVal}%</div>
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
            💖 BONUS: Physical Chemistry (<span style="color:#10b981">${physVal}%</span>) <span class="expand-icon" style="display:inline-block; transition:transform 0.3s; font-size:0.8rem; margin-left:6px; opacity:0.8;">▼</span>
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
            Physical Chemistry (<span style="color:#ef4444">${physVal}%</span>) <span class="expand-icon" style="display:inline-block; transition:transform 0.3s; font-size:0.8rem; margin-left:6px; opacity:0.8;">▼</span>
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
  
  const customDesc = (typeof getZodiacPairDescription === 'function')
    ? getZodiacPairDescription(signs.zodiacSignMale, signs.zodiacSignFemale, yourName, partnerName)
    : roles.zodiacRoleDescription;

  document.getElementById('zodiac-role-title').textContent = `${signs.zodiacSignMale} & ${signs.zodiacSignFemale}`;
  
  const descEl = document.getElementById('zodiac-role-desc');
  if (typeof formatZodiacDescription === 'function') {
    descEl.innerHTML = formatZodiacDescription(customDesc || roles.zodiacRoleDescription);
  } else {
    descEl.textContent = customDesc || roles.zodiacRoleDescription;
  }
  
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
  const yourNameInput = document.getElementById('your-name');
  const partnerNameInput = document.getElementById('partner-name');
  const yourName = yourNameInput ? yourNameInput.value.trim() : '';
  const partnerName = partnerNameInput ? partnerNameInput.value.trim() : '';
  
  const mDay   = document.getElementById('m-day').value;
  const mMonth = document.getElementById('m-month').value;
  const mYear  = document.getElementById('m-year').value;
  const fDay   = document.getElementById('f-day').value;
  const fMonth = document.getElementById('f-month').value;
  const fYear  = document.getElementById('f-year').value;

  const errEl = document.getElementById('calc-error');
  
  if (yourNameInput) yourNameInput.style.borderColor = '';
  if (partnerNameInput) partnerNameInput.style.borderColor = '';

  if (!yourName || !partnerName) {
    if (!yourName && yourNameInput) yourNameInput.style.borderColor = '#ef4444';
    if (!partnerName && partnerNameInput) partnerNameInput.style.borderColor = '#ef4444';

    if (!yourName && yourNameInput) {
      yourNameInput.focus();
    } else if (!partnerName && partnerNameInput) {
      partnerNameInput.focus();
    }

    errEl.textContent = "Please enter both your name and your partner's name.";
    errEl.classList.remove('hidden');
    return;
  }

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
  
  // Reset gauge
  const circleEl = document.getElementById('radial-gauge-circle');
  if (circleEl) {
    // temporarily disable transition to reset instantly
    circleEl.style.transition = 'none';
    circleEl.setAttribute('stroke-dasharray', '0, 100');
    // flush layout and restore transition
    circleEl.getBoundingClientRect();
    circleEl.style.transition = '';
  }
  const textEl = document.getElementById('radial-gauge-text');
  if (textEl) textEl.textContent = '0%';

  try {
    const data = calculateCompatibility(
      mDayNum, mMonthNum, mYearNum,
      fDayNum, fMonthNum, fYearNum,
      yourName, partnerName
    );

    // Render components
    renderChakras(data);
    renderZodiac(data, yourName, partnerName);
    
    // Modify verdict to unconditionally remove the physical chemistry string from the main banner
    let verdict = data.final_verdict.replace(' (Great Physical Chemistry!)', '');
    const includeSexCompat = document.getElementById('sex-compat-toggle').checked;

    const finalVerdictEl = document.getElementById('final-verdict');
    const teaserLayer = document.getElementById('results-teaser-layer');
    const teaserNames = document.getElementById('teaser-names');
    const teaserVerdict = document.getElementById('teaser-verdict');
    
    // Reset classes
    teaserLayer.className = 'teaser-layer';
    
    // Check if fireworks exist, if not create
    let fireworksBg = document.getElementById('teaser-fireworks');
    if (!fireworksBg) {
      fireworksBg = document.createElement('div');
      fireworksBg.id = 'teaser-fireworks';
      fireworksBg.className = 'fireworks-bg';
      fireworksBg.style.display = 'none';
      teaserLayer.insertBefore(fireworksBg, teaserLayer.firstChild);
    } else {
      fireworksBg.style.display = 'none';
    }

    let nameDisplay = "";
    if (yourName && partnerName) {
      nameDisplay = `${yourName} & ${partnerName}`;
    } else if (yourName) {
      nameDisplay = yourName;
    } else if (partnerName) {
      nameDisplay = partnerName;
    }
    teaserNames.textContent = nameDisplay;

    if (verdict.includes('Perfect Match')) {
      finalVerdictEl.className = 'verdict-text verdict-good';
      finalVerdictEl.innerHTML = `
        <div style="display:flex; justify-content:center; align-items:center; gap: 10px; font-weight: bold; font-size: 1.5rem; letter-spacing: 1px;">
          <span class="fireworks-anim" style="display:inline-block; animation: pop 1.5s infinite alternate;">🎆</span> 
          PERFECT MATCH! 
          <span class="fireworks-anim" style="display:inline-block; animation: pop 1.5s infinite alternate-reverse;">🎆</span>
        </div>
        <div style="font-size: 1.2rem; margin-top:8px;">You found your TRUE LOVE!</div>
      `;

      // Setup teaser
      teaserLayer.classList.add('perfect-match');
      fireworksBg.style.display = 'block';
      teaserVerdict.innerHTML = `
        <span class="rings-icon">💍</span> 
        <span style="font-weight: bold; color: #fca5a5;">Congratulations! You have a PERFECT MATCH!</span>
        <span class="rings-icon">💍</span>
      `;
    } else if (verdict.includes('Not compatible')) {
      const heartMatch = (data.bio_result_chart.heart >= 60);
      const emotionalMatch = (data.bio_result_chart.emotional >= 60);
      const zodiacCompatible = (data.zodiac_result_signs.zodiacElementHarmony !== 'Elements clash');
      
      if (zodiacCompatible && (heartMatch || emotionalMatch)) {
        verdict = "HIGHER THAN AVERAGE COMPATIBILITY";
        finalVerdictEl.className = 'verdict-text verdict-good';
        finalVerdictEl.textContent = verdict;
        teaserVerdict.innerHTML = `
          <span style="font-weight: bold; color: #a5c9f5;">Congratulations! You have higher than average compatibility</span>
        `;
      } else {
        verdict = "NOT COMPATIBLE";
        finalVerdictEl.className = 'verdict-text';
        finalVerdictEl.innerHTML = `
          <div style="color: #F87171; font-weight: 800; font-size: 1.5rem; letter-spacing: 1px; display: flex; justify-content: center; align-items: center; gap: 8px;">
            <span>💔</span> <span>NOT COMPATIBLE</span>
          </div>
        `;

        // Setup teaser
        teaserVerdict.innerHTML = `
          <div style="display: flex; justify-content: center; align-items: center; gap: 8px; font-weight: bold; color: #F87171; font-size: 1.25rem; letter-spacing: 0.5px;">
            <span>💔</span> <span>NOT COMPATIBLE</span>
          </div>
        `;
      }
    } else {
      // Good compatibility (but not perfect)
      finalVerdictEl.className = 'verdict-text verdict-good';
      finalVerdictEl.textContent = verdict;

      // Setup teaser
      teaserVerdict.innerHTML = `
        <span style="font-weight: bold; color: #a5c9f5;">${verdict}</span>
      `;
    }

    // Hook up read more button
    document.getElementById('read-more-btn').onclick = () => {
      teaserLayer.classList.add('hidden');
      document.getElementById('results-blur-container').classList.add('revealed');
    };

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

    let hasElementClashTemplate = false;
    let clashT = null;
    
    if (data.zodiac_result_signs.zodiacElementHarmony === 'Elements clash') {
      const sign1 = data.zodiac_result_signs.zodiacElementMale;
      const sign2 = data.zodiac_result_signs.zodiacElementFemale;
      
      clashT = getClashTemplate(sign1, sign2, yourName, partnerName);
      if (clashT) {
        hasElementClashTemplate = true;
      }
    }

    const isNotCompatible = verdict === 'NOT COMPATIBLE' || verdict.toUpperCase().includes('NOT COMPATIBLE') || verdict.includes('Not compatible');

    if (isNotCompatible || hasElementClashTemplate) {
      summaryBlock.classList.remove('hidden');
      
      let clashCount = 0;
      
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
    } else if (verdict.includes('HIGHER THAN AVERAGE COMPATIBILITY') && (!(data.bio_result_chart.heart >= 60) || !(data.bio_result_chart.emotional >= 60))) {
      summaryBlock.classList.remove('hidden');
      summaryBlock.style.borderLeft = "4px solid #f59e0b";
      summaryBlock.style.background = "rgba(245, 158, 11, 0.05)";
      
      const heartMatch = (data.bio_result_chart.heart >= 60);
      
      if (!heartMatch) {
          summaryBlock.innerHTML = `
            <h3 style="color: #f59e0b; font-size: 1.4rem;">Overall compatibility: Higher than Average compatibility</h3>
            <p style="font-weight: bold; color: #fbbf24; font-size: 1.1rem; margin-bottom: 15px;">Problem found: Harmony waves mismatch</p>
            
            <h4 style="color: #fcd34d; font-size: 1.1rem; margin-bottom: 8px;">What a Harmony Waves Mismatch Looks Like</h4>
            <p>In everyday life, a Harmony waves mismatch usually manifests in how two people handle emotional intimacy. Here is how it typically shows up:</p>
            <ul style="padding-left: 20px; margin-bottom: 15px;">
              <li style="margin-bottom: 5px;"><strong>The Empathy Gap:</strong> One partner may be highly sensitive, deeply affectionate, and emotionally open, while the other might have "blocked" or underactive Harmony waves, appearing guarded, distant, or overly analytical.</li>
              <li style="margin-bottom: 5px;"><strong>Differing Core Values:</strong> You might hold opposing beliefs about what a relationship should look like, or have drastically different moral compasses and deeply held spiritual values.</li>
              <li style="margin-bottom: 5px;"><strong>Unequal Emotional Labor:</strong> One person may naturally act as the constant giver or "healer," while the other primarily receives. This dynamic can lead to emotional exhaustion and resentment for the giver.</li>
              <li style="margin-bottom: 5px;"><strong>Trust and Forgiveness Issues:</strong> Blocked Harmony waves struggle with letting go. If one partner easily forgives and moves forward, but the other holds onto past resentments, fears, or jealousy, your emotional energies will constantly clash.</li>
            </ul>
            
            <h4 style="color: #fcd34d; font-size: 1.1rem; margin-bottom: 8px;">Is the Relationship Doomed?</h4>
            <p><strong>Key insight:</strong> Harmony waves are not static—they are fluid energy centers that change based on your emotional state, life experiences, and personal growth. A mismatch is not a relationship death sentence; it is simply a diagnostic tool pointing out where your dynamic needs conscious work.</p>
            <p>A mismatch just means that deep, effortless emotional resonance isn't happening automatically right now.</p>
            
            <h4 style="color: #fcd34d; font-size: 1.1rem; margin-top: 15px; margin-bottom: 8px;">How to Bridge the Gap</h4>
            <p>If you want to harmonize your emotional energies and open the Harmony waves space, both partners need to cultivate a feeling of mutual emotional safety:</p>
            <ul style="padding-left: 20px; margin-bottom: 15px;">
              <li style="margin-bottom: 5px;"><strong>Stop Forcing It:</strong> A guarded partner cannot be forced to open their heart. Pressuring someone to be more emotionally vulnerable often causes them to retreat further behind their walls.</li>
              <li style="margin-bottom: 5px;"><strong>Lean on Aligned Connections:</strong> As you have a strong Emotional resonance connection— you share a natural flow of intimacy, a deep understanding of each other's feelings, and a sense of shared joy and adaptability—use those strong foundations to build emotional trust over time.</li>
              <li style="margin-bottom: 5px;"><strong>Practice Active Forgiveness:</strong> The biggest block to Harmony waves energy is stored resentment. Both partners must consciously work on letting go of past arguments and avoiding the habit of keeping "score."</li>
              <li style="margin-bottom: 5px;"><strong>Communicate First:</strong> Often, the heart cannot open until the throat has spoken. Honest, gentle, and non-judgmental communication helps release defensive barriers, allowing love and empathy to eventually flow more naturally.</li>
            </ul>
            <p style="margin-top: 15px;"><strong>A mismatch here is ultimately an invitation to understand how differently you both experience love—and to learn how to patiently meet each other halfway.</strong></p>
          `;
      } else {
          summaryBlock.innerHTML = `
            <h3 style="color: #f59e0b; font-size: 1.4rem;">Overall compatibility: Higher than Average compatibility</h3>
            <p style="font-weight: bold; color: #fbbf24; font-size: 1.1rem; margin-bottom: 15px;">Problem found: Emotional resonance Misalignment</p>
            <p>Emotional resonance governs our emotions, intimacy, pleasure, creativity, and sense of "flow."<br>When this emotional resonance is out of alignment between partners, it usually means the emotional and physical rhythm of the relationship has hit a block.</p>
            
            <h4 style="color: #fcd34d; font-size: 1.1rem; margin-bottom: 8px;">What Misalignment Looks Like</h4>
            <p>When your emotional waves aren't syncing up with your partner's, you might notice a few specific patterns:</p>
            <ul style="padding-left: 20px; margin-bottom: 15px;">
              <li style="margin-bottom: 5px;"><strong>Emotional rigidity:</strong> Instead of easily letting things go, small disagreements turn into stubborn standoffs. The natural "give and take" feels forced.</li>
              <li style="margin-bottom: 5px;"><strong>Intimacy disconnect:</strong> This can manifest as mismatched physical desires, a lack of affection, or feeling romantically uninspired.</li>
              <li style="margin-bottom: 5px;"><strong>Loss of playfulness:</strong> The relationship might feel purely transactional or overly serious. You're managing life together, but you aren't playing or creating joy together.</li>
              <li style="margin-bottom: 5px;"><strong>Feeling stuck:</strong> Because emotional resonance is tied to adaptability, an emotional waves Misalignment here makes it hard to adjust to changes or flow with new routines.</li>
            </ul>
            
            <h4 style="color: #fcd34d; font-size: 1.1rem; margin-top: 15px; margin-bottom: 8px;">How to Realign</h4>
            <p>To bring these emotional waves back into harmony, you both need to foster a sense of pleasure, movement, and emotional openness.</p>
            <ul style="padding-left: 20px; margin-bottom: 15px;">
              <li style="margin-bottom: 5px;"><strong>Prioritize Low-Stress Physical Flow:</strong> Since emotional resonance is deeply connected to movement and joy, focus on shared activities rather than overthinking. Taking dedicated evening bicycle rides together is an excellent way to do this. The rhythmic movement, fresh air, and lack of pressure help relieve tension and allow you to reconnect naturally in a relaxed state.</li>
              <li style="margin-bottom: 5px;"><strong>Seek Calming Environments:</strong> Spending time in relaxing environments, such as taking a shower together, swimming, or simply relaxing near a lake or the ocean, can help mentally and emotionally reset your shared dynamic.</li>
              <li style="margin-bottom: 5px;"><strong>Collaborative Creation:</strong> Emotional resonance thrives on creativity. Cook a brand-new meal together without a strict recipe, build something together, or take a pottery class. The goal isn't to make something perfect, but to share the messy, fun process of creating.</li>
              <li style="margin-bottom: 5px;"><strong>Practice "Sensory" Grounding:</strong> Bring pleasure back into your shared space. Light calming candles, play music that makes you both want to move, and focus on closeness that isn't purely sexual—like a long massage or spending quiet time together.</li>
              <li style="margin-bottom: 5px;"><strong>Open the Emotional Valve:</strong> Set aside 10 minutes where one partner speaks about how they are feeling without the other offering solutions or trying to "fix" it. Just listen and validate.</li>
            </ul>
            <p style="margin-top: 15px;"><strong>Realigning your emotional waves isn't about forcing an immediate deep connection; it's about intentionally removing the pressure so that your natural rhythm can return.</strong></p>
          `;
      }
    } else if (verdict.includes('Perfect Match') || verdict.includes('Good compatibility') || verdict.includes('TRUE LOVE') || verdict.includes('HIGHER THAN AVERAGE COMPATIBILITY')) {
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
    // Trigger wave animation
    const waveOverlay = document.getElementById('wave-transition');
    waveOverlay.classList.add('active');
    
    // Swap the cards halfway through the wave (when screen is covered)
    setTimeout(() => {
      document.getElementById('input-card').classList.add('hidden');
      document.getElementById('results-card').classList.remove('hidden');
      
      // Reset blur state for new calculation
      document.getElementById('results-teaser-layer').classList.remove('hidden');
      document.getElementById('results-blur-container').classList.remove('revealed');
      
      // Calculate and animate radial gauge
      let gaugeScore = 0;
      if (verdict === 'NOT COMPATIBLE' || verdict.includes('Not compatible')) {
        // For not compatible: average of the lowest compatibility score between harmony waves and emotional resonance and 0%
        const lowestScore = Math.min(data.bio_result_chart.heart, data.bio_result_chart.emotional);
        gaugeScore = Math.round((lowestScore + 0) / 2);
      } else {
        gaugeScore = Math.round((data.bio_result_chart.heart + data.bio_result_chart.emotional) / 2);
      }
      
      const circleEl = document.getElementById('radial-gauge-circle');
      const textEl = document.getElementById('radial-gauge-text');
      
      if (circleEl) {
        // Disable CSS transition to manually drive it via requestAnimationFrame
        circleEl.style.transition = 'none';
      }
      
      if (textEl && circleEl) {
        if (gaugeScore === 0) {
          textEl.textContent = '0%';
          circleEl.setAttribute('stroke-dasharray', '0, 100');
        } else {
          const duration = 1500;
          const startTime = performance.now();
          
          const easeOutQuad = t => t * (2 - t);
          
          const animateGauge = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Apply ease-out to BOTH number and SVG stroke
            const currentScore = easeOutQuad(progress) * gaugeScore;
            const currentNum = Math.floor(currentScore);
            
            textEl.textContent = `${currentNum}%`;
            circleEl.setAttribute('stroke-dasharray', `${currentScore}, 100`);
            
            if (progress < 1) {
              requestAnimationFrame(animateGauge);
            } else {
              textEl.textContent = `${gaugeScore}%`;
              circleEl.setAttribute('stroke-dasharray', `${gaugeScore}, 100`);
            }
          };
          
          requestAnimationFrame(animateGauge);
        }
      }

      window.scrollTo(0, 0); // Reset scroll position for new page
    }, 1500);

    // Hide wave overlay after animation finishes
    setTimeout(() => {
      waveOverlay.classList.remove('active');
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

  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      calculate();
    });
  }

  ['your-name', 'partner-name'].forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', () => {
        input.style.borderColor = '';
        const errEl = document.getElementById('calc-error');
        if (errEl && errEl.textContent.includes('name')) {
          errEl.classList.add('hidden');
        }
      });
    }
  });
  
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
