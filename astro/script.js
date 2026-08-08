/* ============================================================
   WAVES — SCRIPT.JS (Bilingual Localization & App Logic)
   ============================================================ */

let lastCalcData = null;
let lastYourName = '';
let lastPartnerName = '';

const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getLang() {
  return (typeof window !== 'undefined' && window.I18N && typeof window.I18N.getLang === 'function')
    ? window.I18N.getLang()
    : 'en';
}

function t(key) {
  return (typeof window !== 'undefined' && window.I18N && typeof window.I18N.t === 'function')
    ? window.I18N.t(key)
    : key;
}

/* ============================================================
   RENDER: METRICS (CHAKRAS)
   ============================================================ */
function renderChakras(data, lang) {
  lang = lang || getLang();
  const chart = data.bio_result_chart;
  const barsEl = document.getElementById('chakra-bars');
  if (!barsEl) return;
  barsEl.innerHTML = '';

  const metricKeys = ['heart', 'emotional'];

  metricKeys.forEach(key => {
    const rawVal = chart[key] ?? 0;
    const pct = Math.abs(rawVal);
    const isNeg = rawVal < 0;
    
    const name = window.I18N ? window.I18N.getMetricName(key, lang) : key.toUpperCase();
    const desc = window.I18N ? window.I18N.getMetricDescription(key, rawVal, lang) : '';
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

    const header = row.querySelector('.metric-header');
    const details = row.querySelector('.metric-details');
    const icon = row.querySelector('.expand-icon');
    
    header.addEventListener('click', () => {
      const isHidden = details.style.display === 'none';
      details.style.display = isHidden ? 'block' : 'none';
      icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
    });

    setTimeout(() => {
      const fillEl = row.querySelector('.chakra-bar-fill');
      if (fillEl) fillEl.style.width = Math.min(pct, 100) + '%';
    }, 100);
  });

  // Render Physical as a Bonus Section if toggled on
  const sexToggle = document.getElementById('sex-compat-toggle');
  const includeSexCompat = sexToggle ? sexToggle.checked : true;
  if (includeSexCompat) {
    const physVal = chart['physical'] ?? 0;
    const desc = window.I18N ? window.I18N.getMetricDescription('physical', physVal, lang) : '';
    const bonusDiv = document.createElement('div');
    
    const metText = t('bonusPhysMet');
    const notMetText = t('bonusPhysNotMet');

    if (physVal >= 60) {
      bonusDiv.style.cssText = "margin-top:25px; padding:15px; background:rgba(255,105,180,0.15); border:1px solid rgba(255,105,180,0.4); border-radius:12px; text-align:center; box-shadow: inset 0 0 15px rgba(255,105,180,0.1); cursor:pointer; user-select:none;";
      bonusDiv.innerHTML = `
        <div class="bonus-header">
          <div style="font-size:1.1rem; font-weight:bold; color:#ffb6c1; margin-bottom:0; letter-spacing:0.5px;">
            ${metText} (<span style="color:#10b981">${physVal}%</span>) <span class="expand-icon" style="display:inline-block; transition:transform 0.3s; font-size:0.8rem; margin-left:6px; opacity:0.8;">▼</span>
          </div>
        </div>
        <div class="metric-details" style="display:none; font-size:0.9rem; color:#fde4ec; line-height:1.5; margin-top:12px;">${desc}</div>
      `;
    } else {
      bonusDiv.style.cssText = "margin-top:25px; padding:15px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; text-align:center; cursor:pointer; user-select:none;";
      bonusDiv.innerHTML = `
        <div class="bonus-header">
          <div style="font-size:1rem; font-weight:bold; color:#a5c9f5; margin-bottom:0;">
            ${notMetText} (<span style="color:#ef4444">${physVal}%</span>) <span class="expand-icon" style="display:inline-block; transition:transform 0.3s; font-size:0.8rem; margin-left:6px; opacity:0.8;">▼</span>
          </div>
        </div>
        <div class="metric-details" style="display:none; font-size:0.9rem; color:#cbd5e1; line-height:1.5; margin-top:12px;">${desc}</div>
      `;
    }
    barsEl.appendChild(bonusDiv);

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
function renderZodiac(data, yourName, partnerName, lang) {
  lang = lang || getLang();
  const signs = data.zodiac_result_signs;
  const roles = data.zodiac_result_roles;

  const defaultYou = t('defaultYou');
  const defaultPartner = t('defaultPartner');

  const maleNameEl = document.getElementById('zodiac-name-male');
  const maleSignEl = document.getElementById('zodiac-sign-male');
  const maleElemEl = document.getElementById('zodiac-element-male');

  const femaleNameEl = document.getElementById('zodiac-name-female');
  const femaleSignEl = document.getElementById('zodiac-sign-female');
  const femaleElemEl = document.getElementById('zodiac-element-female');

  if (maleNameEl) maleNameEl.textContent = yourName || defaultYou;
  if (maleSignEl) maleSignEl.textContent = window.I18N ? window.I18N.getZodiacSignName(signs.zodiacSignMale, lang) : signs.zodiacSignMale;
  if (maleElemEl) maleElemEl.textContent = window.I18N ? window.I18N.getZodiacElementName(signs.zodiacElementMale, lang) : signs.zodiacElementMale;

  if (femaleNameEl) femaleNameEl.textContent = partnerName || defaultPartner;
  if (femaleSignEl) femaleSignEl.textContent = window.I18N ? window.I18N.getZodiacSignName(signs.zodiacSignFemale, lang) : signs.zodiacSignFemale;
  if (femaleElemEl) femaleElemEl.textContent = window.I18N ? window.I18N.getZodiacElementName(signs.zodiacElementFemale, lang) : signs.zodiacElementFemale;

  const harmonyEl = document.getElementById('zodiac-harmony');
  if (harmonyEl) {
    const harmonyText = window.I18N ? window.I18N.getZodiacHarmonyText(signs.zodiacElementHarmony, lang) : signs.zodiacElementHarmony;
    harmonyEl.textContent = harmonyText;
    if (signs.zodiacElementHarmony === 'Elements clash') {
      harmonyEl.style.color = '#f87171';
    } else {
      harmonyEl.style.color = '';
    }
  }
  
  const customDesc = (typeof getZodiacPairDescription === 'function')
    ? getZodiacPairDescription(signs.zodiacSignMale, signs.zodiacSignFemale, yourName, partnerName)
    : roles.zodiacRoleDescription;

  const sign1Localized = window.I18N ? window.I18N.getZodiacSignName(signs.zodiacSignMale, lang) : signs.zodiacSignMale;
  const sign2Localized = window.I18N ? window.I18N.getZodiacSignName(signs.zodiacSignFemale, lang) : signs.zodiacSignFemale;

  const titleEl = document.getElementById('zodiac-role-title');
  if (titleEl) titleEl.textContent = `${sign1Localized} & ${sign2Localized}`;
  
  const descEl = document.getElementById('zodiac-role-desc');
  if (descEl) {
    if (typeof formatZodiacDescription === 'function') {
      descEl.innerHTML = formatZodiacDescription(customDesc || roles.zodiacRoleDescription);
    } else {
      descEl.textContent = customDesc || roles.zodiacRoleDescription;
    }
  }
  
  const pairTextEl = document.getElementById('zodiac-pair-text');
  if (pairTextEl) pairTextEl.style.display = 'none';
}

/* ============================================================
   RENDER: VERDICT AND TEASER
   ============================================================ */
function renderVerdictAndTeaser(data, yourName, partnerName, lang) {
  lang = lang || getLang();
  let verdict = data.final_verdict.replace(' (Great Physical Chemistry!)', '');

  const finalVerdictEl = document.getElementById('final-verdict');
  const teaserLayer = document.getElementById('results-teaser-layer');
  const teaserNames = document.getElementById('teaser-names');
  const teaserVerdict = document.getElementById('teaser-verdict');
  if (!finalVerdictEl || !teaserLayer || !teaserNames || !teaserVerdict) return;
  
  teaserLayer.className = 'teaser-layer';
  
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
        ${t('perfectMatchTitle')} 
        <span class="fireworks-anim" style="display:inline-block; animation: pop 1.5s infinite alternate-reverse;">🎆</span>
      </div>
      <div style="font-size: 1.2rem; margin-top:8px;">${t('perfectMatchSubtitle')}</div>
    `;

    teaserLayer.classList.add('perfect-match');
    fireworksBg.style.display = 'block';
    teaserVerdict.innerHTML = `
      <span class="rings-icon">💍</span> 
      <span style="font-weight: bold; color: #fca5a5;">${t('perfectMatchTeaser')}</span>
      <span class="rings-icon">💍</span>
    `;
  } else if (verdict.includes('Not compatible')) {
    const heartMatch = (data.bio_result_chart.heart >= 60);
    const emotionalMatch = (data.bio_result_chart.emotional >= 60);
    const zodiacCompatible = (data.zodiac_result_signs.zodiacElementHarmony !== 'Elements clash');
    
    if (zodiacCompatible && (heartMatch || emotionalMatch)) {
      finalVerdictEl.className = 'verdict-text verdict-good';
      finalVerdictEl.textContent = t('higherAvgVerdict');
      teaserVerdict.innerHTML = `
        <span style="font-weight: bold; color: #a5c9f5;">${t('higherAvgTeaser')}</span>
      `;
    } else {
      finalVerdictEl.className = 'verdict-text';
      finalVerdictEl.innerHTML = `
        <div style="color: #F87171; font-weight: 800; font-size: 1.5rem; letter-spacing: 1px; display: flex; justify-content: center; align-items: center; gap: 8px;">
          <span>💔</span> <span>${t('notCompatVerdict')}</span>
        </div>
      `;

      teaserVerdict.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; gap: 8px; font-weight: bold; color: #F87171; font-size: 1.25rem; letter-spacing: 0.5px;">
          <span>💔</span> <span>${t('notCompatVerdict')}</span>
        </div>
      `;
    }
  } else {
    // Good compatibility
    finalVerdictEl.className = 'verdict-text verdict-good';
    finalVerdictEl.textContent = t('goodCompatVerdict');
    teaserVerdict.innerHTML = `
      <span style="font-weight: bold; color: #a5c9f5;">${t('goodCompatVerdict')}</span>
    `;
  }
}

/* ============================================================
   RENDER: DEEP ANALYSIS REPORT IN MODAL
   ============================================================ */
function renderDeepAnalysisReport(data, yourName, partnerName, lang) {
  lang = lang || getLang();
  const summaryBlock = document.getElementById('low-compat-summary');
  if (!summaryBlock) return;

  const verdict = data.final_verdict.replace(' (Great Physical Chemistry!)', '');
  const signs = data.zodiac_result_signs;
  const isClash = signs.zodiacElementHarmony === 'Elements clash';
  const heartMatch = (data.bio_result_chart.heart >= 60);
  const emotionalMatch = (data.bio_result_chart.emotional >= 60);
  const zodiacCompatible = !isClash;
  const isHigherAvg = zodiacCompatible && ((!heartMatch && emotionalMatch) || (heartMatch && !emotionalMatch));
  const isNotCompatible = isClash || (!heartMatch && !emotionalMatch);

  let clashT = null;
  if (isClash) {
    if (lang === 'ru' && window.I18N && typeof window.I18N.getClashTemplateRu === 'function') {
      clashT = window.I18N.getClashTemplateRu(signs.zodiacElementMale, signs.zodiacElementFemale, yourName, partnerName);
    } else if (typeof getClashTemplate === 'function') {
      clashT = getClashTemplate(signs.zodiacElementMale, signs.zodiacElementFemale, yourName, partnerName);
    }
  }

  summaryBlock.classList.remove('hidden');

  if (isHigherAvg) {
    summaryBlock.style.borderLeft = "4px solid #f59e0b";
    summaryBlock.style.background = "rgba(245, 158, 11, 0.05)";
    
    if (!heartMatch) {
      if (lang === 'ru' && window.I18N && window.I18N.SUMMARY_REPORTS_RU) {
        const r = window.I18N.SUMMARY_REPORTS_RU.harmonyMismatch;
        summaryBlock.innerHTML = `
          <h3 style="color: #f59e0b; font-size: 1.4rem;">${r.verdictTitle}</h3>
          <p style="font-weight: bold; color: #fbbf24; font-size: 1.1rem; margin-bottom: 15px;">${r.problemTitle}</p>
          
          <h4 style="color: #fcd34d; font-size: 1.1rem; margin-bottom: 8px;">${r.whatTitle}</h4>
          <p>${r.whatIntro}</p>
          <ul style="padding-left: 20px; margin-bottom: 15px;">
            ${r.whatPoints.map(p => `<li style="margin-bottom: 5px;">${p}</li>`).join('')}
          </ul>
          
          <h4 style="color: #fcd34d; font-size: 1.1rem; margin-bottom: 8px;">${r.isDoomedTitle}</h4>
          <p>${r.isDoomedP1}</p>
          <p>${r.isDoomedP2}</p>
          
          <h4 style="color: #fcd34d; font-size: 1.1rem; margin-top: 15px; margin-bottom: 8px;">${r.howToBridgeTitle}</h4>
          <p>${r.howToBridgeIntro}</p>
          <ul style="padding-left: 20px; margin-bottom: 15px;">
            ${r.howToBridgePoints.map(p => `<li style="margin-bottom: 5px;">${p}</li>`).join('')}
          </ul>
          <p style="margin-top: 15px;">${r.conclusion}</p>
        `;
      } else {
        // English
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
            <li style="margin-bottom: 5px;"><strong>Lean on Aligned Connections:</strong> If your Harmony waves are currently misaligned, rely on the areas where you do match. If you have a strong Root Chakra connection (shared security, finances, and stability) or Throat Chakra connection (great communication), use those strong foundations to build emotional trust over time.</li>
            <li style="margin-bottom: 5px;"><strong>Practice Active Forgiveness:</strong> The biggest block to Harmony waves energy is stored resentment. Both partners must consciously work on letting go of past arguments and avoiding the habit of keeping "score."</li>
            <li style="margin-bottom: 5px;"><strong>Communicate First:</strong> Often, the heart cannot open until the throat has spoken. Honest, gentle, and non-judgmental communication helps release defensive barriers, allowing love and empathy to eventually flow more naturally.</li>
          </ul>
          <p style="margin-top: 15px;">A mismatch here is ultimately an invitation to understand how differently you both experience love—and to learn how to patiently meet each other halfway.</p>
        `;
      }
    } else {
      // Emotional resonance mismatch
      if (lang === 'ru' && window.I18N && window.I18N.SUMMARY_REPORTS_RU) {
        const r = window.I18N.SUMMARY_REPORTS_RU.emotionMismatch;
        summaryBlock.innerHTML = `
          <h3 style="color: #f59e0b; font-size: 1.4rem;">${r.verdictTitle}</h3>
          <p style="font-weight: bold; color: #fbbf24; font-size: 1.1rem; margin-bottom: 15px;">${r.problemTitle}</p>
          <p>${r.intro}</p>
          
          <h4 style="color: #fcd34d; font-size: 1.1rem; margin-bottom: 8px;">${r.whatTitle}</h4>
          <p>${r.whatIntro}</p>
          <ul style="padding-left: 20px; margin-bottom: 15px;">
            ${r.whatPoints.map(p => `<li style="margin-bottom: 5px;">${p}</li>`).join('')}
          </ul>
          
          <h4 style="color: #fcd34d; font-size: 1.1rem; margin-top: 15px; margin-bottom: 8px;">${r.howToRealignTitle}</h4>
          <p>${r.howToRealignIntro}</p>
          <ul style="padding-left: 20px; margin-bottom: 15px;">
            ${r.howToRealignPoints.map(p => `<li style="margin-bottom: 5px;">${p}</li>`).join('')}
          </ul>
          <p style="margin-top: 15px;">${r.conclusion}</p>
        `;
      } else {
        // English
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
    }
  } else if (isNotCompatible) {
    summaryBlock.style.borderLeft = "4px solid #ef4444";
    summaryBlock.style.background = "rgba(239, 68, 68, 0.05)";

    if (clashT) {
      let insightsHtml = clashT.insights.map(i => `<li style="margin-bottom: 8px;">${i}</li>`).join('');
      let clashCount = 0;
      
      if (lang === 'ru') {
        if (data.bio_result_chart.heart <= 60) {
          insightsHtml += `<li style="margin-bottom: 8px;"><strong>Природное несовпадение:</strong> Ваши характеры и привычные способы решения конфликтов требуют совершенно разной среды, чтобы чувствовать полную поддержку и понимание.</li>`;
          clashCount++;
        }
        if (data.bio_result_chart.emotional <= 60) {
          insightsHtml += `<li style="margin-bottom: 8px;"><strong>Эмоциональное несовпадение:</strong> Различия носят фундаментальный характер — это касается эмоциональных потребностей, жизненных целей и формата общения.</li>`;
          clashCount++;
        }
        if (clashCount > 0 || isClash) {
          insightsHtml += `<li style="margin-bottom: 8px;"><strong>Вложение сил:</strong> Сохранение гармонии в таком союзе потребует непрерывных компромиссов и глубокой душевной работы с обеих сторон.</li>`;
        }

        summaryBlock.innerHTML = `
          <h3 style="color: #ef4444; font-size: 1.4rem;">Краткий обзор совместимости отношений</h3>
          <p style="font-weight: bold; margin-bottom: 15px; font-size: 1.1rem; color: #fca5a5;">${clashT.title}</p>
          
          <p><strong>Важная заметка от нас:</strong><br>${clashT.note}</p>
          
          <h4 style="color: #f87171; margin-top: 15px; font-size: 1.1rem; margin-bottom: 8px;">Ключевые выводы и наблюдения</h4>
          <ul style="padding-left: 20px; margin-bottom: 15px;">
            ${insightsHtml}
          </ul>
          
          <h4 style="color: #f87171; margin-top: 15px; font-size: 1.1rem; margin-bottom: 8px;">Что это значит для вас?</h4>
          <p>${clashT.meaning || clashT.meaningIntro || ''}</p>
          
          <p style="margin-top: 10px;"><strong>1. Путь сохранения отношений</strong><br>
          ${clashT.path1Intro}
          <ul style="padding-left: 20px; margin-top: 5px; margin-bottom: 5px;">
            ${clashT.path1Points.map(p => `<li style="margin-bottom: 5px;">${p}</li>`).join('')}
          </ul>
          </p>
          
          <p style="margin-top: 10px;"><strong>2. Путь движения дальше</strong><br>
          ${clashT.path2Intro}
          <ul style="padding-left: 20px; margin-top: 5px; margin-bottom: 5px;">
            ${clashT.path2Points.map(p => `<li style="margin-bottom: 5px;">${p}</li>`).join('')}
          </ul>
          </p>
          
          <p style="margin-top: 15px;"><strong>Следующие шаги</strong><br>${clashT.nextSteps}</p>
        `;
      } else {
        // English Clash
        if (data.bio_result_chart.heart <= 60) {
          insightsHtml += `<li style="margin-bottom: 8px;"><strong>Natural Friction:</strong> Your default instincts and stress responses are wired differently, requiring continuous translation rather than mutual intuition.</li>`;
          clashCount++;
        }
        if (data.bio_result_chart.emotional <= 60) {
          insightsHtml += `<li style="margin-bottom: 8px;"><strong>Fundamental Misalignment:</strong> The core divide is emotional, not superficial—affecting basic expectations around communication and support.</li>`;
          clashCount++;
        }
        if (clashCount > 0 || isClash) {
          insightsHtml += `<li style="margin-bottom: 8px;"><strong>High Maintenance:</strong> Maintaining harmony will demand disproportionate conscious effort from both partners compared to naturally aligned pairs.</li>`;
        }

        summaryBlock.innerHTML = `
          <h3 style="color: #ef4444; font-size: 1.4rem;">Relationship Compatibility Summary</h3>
          <p style="font-weight: bold; margin-bottom: 15px; font-size: 1.1rem; color: #fca5a5;">${clashT.title}</p>
          
          <p><strong>A Thoughtful Note From Us:</strong><br>${clashT.note}</p>
          
          <h4 style="color: #f87171; margin-top: 15px; font-size: 1.1rem; margin-bottom: 8px;">Key Findings & Insights</h4>
          <ul style="padding-left: 20px; margin-bottom: 15px;">
            ${insightsHtml}
          </ul>
          
          <h4 style="color: #f87171; margin-top: 15px; font-size: 1.1rem; margin-bottom: 8px;">What Does This Mean for You?</h4>
          <p>${clashT.meaning || clashT.meaningIntro || ''}</p>
          
          <p style="margin-top: 10px;"><strong>1. The Path of Staying Together</strong><br>
          ${clashT.path1Intro}
          <ul style="padding-left: 20px; margin-top: 5px; margin-bottom: 5px;">
            ${clashT.path1Points.map(p => `<li style="margin-bottom: 5px;">${p}</li>`).join('')}
          </ul>
          </p>
          
          <p style="margin-top: 10px;"><strong>2. The Path of Moving On</strong><br>
          ${clashT.path2Intro}
          <ul style="padding-left: 20px; margin-top: 5px; margin-bottom: 5px;">
            ${clashT.path2Points.map(p => `<li style="margin-bottom: 5px;">${p}</li>`).join('')}
          </ul>
          </p>
          
          <p style="margin-top: 15px;"><strong>Next Steps</strong><br>${clashT.nextSteps}</p>
        `;
      }
    } else {
      // Default low compatibility summary
      if (lang === 'ru' && window.I18N && window.I18N.SUMMARY_REPORTS_RU) {
        const l = window.I18N.SUMMARY_REPORTS_RU.lowCompatDefault;
        summaryBlock.innerHTML = `
          <h3 style="color: #ef4444; font-size: 1.4rem;">${l.heading}</h3>
          <p style="font-weight: bold; margin-bottom: 15px; font-size: 1.1rem; color: #fca5a5;">${l.resultBadge}</p>
          
          <p><strong>${l.noteTitle}</strong><br>${l.noteText}</p>
          
          <h4 style="color: #f87171; margin-top: 15px; font-size: 1.1rem; margin-bottom: 8px;">${l.findingsTitle}</h4>
          <ul style="padding-left: 20px; margin-bottom: 15px;">
            <li style="margin-bottom: 8px;">${l.harmonyText}</li>
            <li style="margin-bottom: 8px;">${l.emotionText}</li>
            <li style="margin-bottom: 8px;">${l.bothText}</li>
          </ul>
          
          <h4 style="color: #f87171; margin-top: 15px; font-size: 1.1rem; margin-bottom: 8px;">${l.meaningTitle}</h4>
          <p>${l.meaningP}</p>
          
          <p style="margin-top: 10px;"><strong>${l.path1Title}</strong><br>
          ${l.path1Intro}</p>
          
          <p style="margin-top: 10px;"><strong>${l.path2Title}</strong><br>
          ${l.path2Intro}</p>
          
          <p style="margin-top: 15px;"><strong>${l.nextStepsTitle}</strong><br>${l.nextStepsText}</p>
        `;
      } else {
        // English Default Low
        summaryBlock.innerHTML = `
          <h3 style="color: #ef4444; font-size: 1.4rem;">Relationship Compatibility Summary</h3>
          <p style="font-weight: bold; margin-bottom: 15px; font-size: 1.1rem; color: #fca5a5;">Overall Result: Low Compatibility</p>
          
          <p><strong>A Thoughtful Note From Us:</strong><br>
          Compatibility is a helpful tool for understanding ease, communication flow, and natural long-term harmony. A lower score simply highlights that making this dynamic thrive may require significantly more conscious effort and adaptation from both people. The summary below outlines the core differences in your fundamental styles.</p>
          
          <h4 style="color: #f87171; margin-top: 15px; font-size: 1.1rem; margin-bottom: 8px;">Key Findings & Insights</h4>
          <ul style="padding-left: 20px; margin-bottom: 15px;">
            <li style="margin-bottom: 8px;"><strong>Natural Friction:</strong> Your instinctual responses and emotional coping mechanisms are fundamentally different, meaning misunderstandings may occur more easily.</li>
            <li style="margin-bottom: 8px;"><strong>Core Values & Alignment:</strong> Differences exist in how you navigate emotional needs, communication styles, or personal boundaries.</li>
            <li style="margin-bottom: 8px;"><strong>Relationship Energy:</strong> Staying harmonized may require frequent compromise and intentional effort compared to naturally aligned pairs.</li>
          </ul>
          
          <h4 style="color: #f87171; margin-top: 15px; font-size: 1.1rem; margin-bottom: 8px;">What Does This Mean for You?</h4>
          <p>Every relationship has unique challenges, but lower baseline compatibility means that everyday dynamics can sometimes feel like swimming upstream.</p>
          
          <p style="margin-top: 10px;"><strong>1. The Path of Staying Together</strong><br>
          If you choose to navigate this bond, going in with eyes open is key:<br>
          <em>Significant Adaptation:</em> Both partners will need to continuously adjust expectations and communication styles.<br>
          <em>Continuous Effort:</em> Love alone may not eliminate the recurring friction. Navigating these differences will require patience, professional guidance, or constant conscious effort to keep the relationship stable.</p>
          
          <p style="margin-top: 10px;"><strong>2. The Path of Moving On</strong><br>
          While it’s never easy to realize a partnership might not be the right fit, it’s also an opportunity:<br>
          <em>You Deserve Ease:</em> Relationships shouldn't feel like a constant struggle. You deserve a connection where being yourself feels natural and effortless.<br>
          <em>A World of Possibilities:</em> There are billions of people in the world. Out there is someone whose values, communication style, and long-term vision align effortlessly with yours—someone who will care for you exactly as you need to be cared for, without requiring either of you to change who you fundamentally are.</p>
          
          <p style="margin-top: 15px;"><strong>Next Steps</strong><br>
          Take a breath and reflect. Use this report not as a harsh verdict, but as an honest mirror to evaluate what you truly want out of love, peace, and your future.</p>
        `;
      }
    }
  } else if (verdict.includes('Perfect Match') || verdict.includes('Good compatibility') || verdict.includes('TRUE LOVE') || verdict.includes('HIGHER THAN AVERAGE COMPATIBILITY')) {
    summaryBlock.style.borderLeft = "4px solid #10b981";
    summaryBlock.style.background = "rgba(16, 185, 129, 0.05)";
    
    if (lang === 'ru' && window.I18N && window.I18N.SUMMARY_REPORTS_RU) {
      const e = window.I18N.SUMMARY_REPORTS_RU.exceptional;
      summaryBlock.innerHTML = `
        <h3 style="color: #10b981; font-size: 1.4rem;">${e.heading}</h3>
        <p style="font-weight: bold; margin-bottom: 15px; font-size: 1.1rem; color: #6ee7b7;">${e.title}</p>
        
        <p><strong>Важная заметка от нас:</strong><br>${e.note}</p>
        
        <h4 style="color: #34d399; margin-top: 15px; font-size: 1.1rem; margin-bottom: 8px;">Ключевые выводы и наблюдения</h4>
        <ul style="padding-left: 20px; margin-bottom: 15px;">
          ${e.insights.map(i => `<li style="margin-bottom: 8px;">${i}</li>`).join('')}
        </ul>
        
        <h4 style="color: #34d399; margin-top: 15px; font-size: 1.1rem; margin-bottom: 8px;">Что это значит для вас?</h4>
        <p>${e.meaningIntro}</p>
        
        <p style="margin-top: 10px;"><strong>${e.path1Title}</strong><br>
        ${e.path1Intro}
        <ul style="padding-left: 20px; margin-top: 5px; margin-bottom: 5px;">
          ${e.path1Points.map(p => `<li style="margin-bottom: 5px;">${p}</li>`).join('')}
        </ul>
        </p>
        
        <p style="margin-top: 10px;"><strong>${e.path2Title}</strong><br>
        ${e.path2Intro}
        <ul style="padding-left: 20px; margin-top: 5px; margin-bottom: 5px;">
          ${e.path2Points.map(p => `<li style="margin-bottom: 5px;">${p}</li>`).join('')}
        </ul>
        </p>
        
        <p style="margin-top: 15px;"><strong>Следующие шаги</strong><br>${e.nextSteps}</p>
      `;
    } else {
      // English
      const tData = {
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
        <p style="font-weight: bold; margin-bottom: 15px; font-size: 1.1rem; color: #6ee7b7;">${tData.title}</p>
        
        <p><strong>A Quick Note from Us:</strong><br>${tData.note}</p>
        
        <h4 style="color: #34d399; margin-top: 15px; font-size: 1.1rem; margin-bottom: 8px;">Key Findings & Insights</h4>
        <ul style="padding-left: 20px; margin-bottom: 15px;">
          ${tData.insights.map(i => `<li style="margin-bottom: 8px;">${i}</li>`).join('')}
        </ul>
        
        <h4 style="color: #34d399; margin-top: 15px; font-size: 1.1rem; margin-bottom: 8px;">What Does This Mean for You?</h4>
        <p>${tData.meaningIntro}</p>
        
        <p style="margin-top: 10px;"><strong>${tData.path1Title}</strong><br>
        ${tData.path1Intro}
        <ul style="padding-left: 20px; margin-top: 5px; margin-bottom: 5px;">
          ${tData.path1Points.map(p => `<li style="margin-bottom: 5px;">${p}</li>`).join('')}
        </ul>
        </p>
        
        <p style="margin-top: 10px;"><strong>${tData.path2Title}</strong><br>
        ${tData.path2Intro}
        <ul style="padding-left: 20px; margin-top: 5px; margin-bottom: 5px;">
          ${tData.path2Points.map(p => `<li style="margin-bottom: 5px;">${p}</li>`).join('')}
        </ul>
        </p>
        
        <p style="margin-top: 15px;"><strong>Next Steps</strong><br>${tData.nextSteps}</p>
      `;
    }
  } else {
    summaryBlock.classList.add('hidden');
  }
}

/* ============================================================
   MAIN CALCULATE HANDLER
   ============================================================ */
function calculate() {
  const lang = getLang();
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

    errEl.textContent = t('errName');
    errEl.classList.remove('hidden');
    return;
  }

  if (!mDay || !mMonth || !mYear || !fDay || !fMonth || !fYear) {
    errEl.textContent = t('errFields');
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
    errEl.textContent = t('errInvalidDate');
    errEl.classList.remove('hidden');
    return;
  }

  errEl.classList.add('hidden');

  const btn = document.getElementById('calc-btn');
  btn.disabled = true;
  btn.textContent = t('btnAnalyzing');
  
  // Reset gauge
  const circleEl = document.getElementById('radial-gauge-circle');
  if (circleEl) {
    circleEl.style.transition = 'none';
    circleEl.setAttribute('stroke-dasharray', '0, 100');
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

    lastCalcData = data;
    lastYourName = yourName;
    lastPartnerName = partnerName;

    // Render components
    renderChakras(data, lang);
    renderZodiac(data, yourName, partnerName, lang);
    renderVerdictAndTeaser(data, yourName, partnerName, lang);
    renderDeepAnalysisReport(data, yourName, partnerName, lang);

    const verdict = data.final_verdict.replace(' (Great Physical Chemistry!)', '');

    // Hook up read more button
    const readMoreBtn = document.getElementById('read-more-btn');
    if (readMoreBtn) {
      readMoreBtn.onclick = () => {
        document.getElementById('results-teaser-layer').classList.add('hidden');
        document.getElementById('results-blur-container').classList.add('revealed');
      };
    }

    // Wave transition
    const waveOverlay = document.getElementById('wave-transition');
    waveOverlay.classList.add('active');
    
    setTimeout(() => {
      document.getElementById('input-card').classList.add('hidden');
      document.getElementById('results-card').classList.remove('hidden');
      
      document.getElementById('results-teaser-layer').classList.remove('hidden');
      document.getElementById('results-blur-container').classList.remove('revealed');
      
      // Calculate gauge score
      let gaugeScore = 0;
      const heartMatch = (data.bio_result_chart.heart >= 60);
      const emotionalMatch = (data.bio_result_chart.emotional >= 60);
      const isClash = (data.zodiac_result_signs.zodiacElementHarmony === 'Elements clash');
      const isHigherAvg = !isClash && ((!heartMatch && emotionalMatch) || (heartMatch && !emotionalMatch));

      if (isHigherAvg) {
        gaugeScore = Math.round((data.bio_result_chart.heart + data.bio_result_chart.emotional) / 2);
      } else if (verdict === 'NOT COMPATIBLE' || verdict.includes('Not compatible')) {
        const lowestScore = Math.min(data.bio_result_chart.heart, data.bio_result_chart.emotional);
        gaugeScore = Math.round((lowestScore + 0) / 2);
      } else {
        gaugeScore = Math.round((data.bio_result_chart.heart + data.bio_result_chart.emotional) / 2);
      }
      
      const cEl = document.getElementById('radial-gauge-circle');
      const tEl = document.getElementById('radial-gauge-text');
      
      if (cEl) {
        cEl.style.transition = 'none';
      }
      
      if (tEl && cEl) {
        if (gaugeScore === 0) {
          tEl.textContent = '0%';
          cEl.setAttribute('stroke-dasharray', '0, 100');
        } else {
          const duration = 1500;
          const startTime = performance.now();
          const easeOutQuad = t => t * (2 - t);
          
          const animateGauge = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentScore = easeOutQuad(progress) * gaugeScore;
            const currentNum = Math.floor(currentScore);
            
            tEl.textContent = `${currentNum}%`;
            cEl.setAttribute('stroke-dasharray', `${currentScore}, 100`);
            
            if (progress < 1) {
              requestAnimationFrame(animateGauge);
            } else {
              tEl.textContent = `${gaugeScore}%`;
              cEl.setAttribute('stroke-dasharray', `${gaugeScore}, 100`);
            }
          };
          
          requestAnimationFrame(animateGauge);
        }
      }

      window.scrollTo(0, 0);
    }, 1500);

    setTimeout(() => {
      waveOverlay.classList.remove('active');
      btn.disabled = false;
      btn.textContent = t('btnAnalyze');
    }, 3000);

  } catch (err) {
    console.error(err);
    errEl.textContent = t('errGeneric');
    errEl.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = t('btnAnalyze');
  }
}

/* ============================================================
   UI HELPERS: SELECT DROPDOWNS & LOCALIZATION
   ============================================================ */
function populateSelects() {
  const lang = getLang();
  const months = (window.I18N && window.I18N.UI_TRANSLATIONS && window.I18N.UI_TRANSLATIONS[lang] && window.I18N.UI_TRANSLATIONS[lang].months)
    ? window.I18N.UI_TRANSLATIONS[lang].months
    : MONTHS_EN;

  const dayText = t('daySelect') || 'Day';
  const monthText = t('monthSelect') || 'Month';
  const yearText = t('yearSelect') || 'Year';

  ['m','f'].forEach(prefix => {
    const dayEl   = document.getElementById(`${prefix}-day`);
    const monthEl = document.getElementById(`${prefix}-month`);
    const yearEl  = document.getElementById(`${prefix}-year`);

    if (!dayEl || !monthEl || !yearEl) return;

    const curDay = dayEl.value;
    const curMonth = monthEl.value;
    const curYear = yearEl.value;

    dayEl.innerHTML = '';
    monthEl.innerHTML = '';
    yearEl.innerHTML = '';

    const do1 = document.createElement('option'); do1.value = ""; do1.textContent = dayText; dayEl.appendChild(do1);
    const mo1 = document.createElement('option'); mo1.value = ""; mo1.textContent = monthText; monthEl.appendChild(mo1);
    const yo1 = document.createElement('option'); yo1.value = ""; yo1.textContent = yearText; yearEl.appendChild(yo1);

    for (let d = 1; d <= 31; d++) {
      const o = document.createElement('option'); o.value = d; o.textContent = d; dayEl.appendChild(o);
    }
    months.forEach((m, i) => {
      const o = document.createElement('option'); o.value = i + 1; o.textContent = m; monthEl.appendChild(o);
    });
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1920; y--) {
      const o = document.createElement('option'); o.value = y; o.textContent = y; yearEl.appendChild(o);
    }

    if (curDay) dayEl.value = curDay;
    if (curMonth) monthEl.value = curMonth;
    if (curYear) yearEl.value = curYear;
  });
}

function applyLanguage(lang) {
  if (window.I18N && typeof window.I18N.setLang === 'function') {
    window.I18N.setLang(lang);
  }

  document.documentElement.lang = lang;

  // Update page title
  const pageTitle = t('pageTitle');
  if (pageTitle) document.title = pageTitle;

  // Update all elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translated = t(key);
    if (translated) {
      el.innerHTML = translated;
    }
  });

  // Update placeholders
  const yourNameInput = document.getElementById('your-name');
  if (yourNameInput) yourNameInput.placeholder = t('yourNamePlaceholder');
  const partnerNameInput = document.getElementById('partner-name');
  if (partnerNameInput) partnerNameInput.placeholder = t('partnerNamePlaceholder');

  // Update dropdown texts
  populateSelects();

  // Update active state on language switcher buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    const btnLang = btn.getAttribute('data-lang');
    btn.classList.toggle('active', btnLang === lang);
  });

  // If calculation data exists, update rendered results
  if (lastCalcData) {
    renderChakras(lastCalcData, lang);
    renderZodiac(lastCalcData, lastYourName, lastPartnerName, lang);
    renderVerdictAndTeaser(lastCalcData, lastYourName, lastPartnerName, lang);
    renderDeepAnalysisReport(lastCalcData, lastYourName, lastPartnerName, lang);
  }
}

/* ============================================================
   INIT & EVENT LISTENERS
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const initialLang = getLang();
  populateSelects();
  applyLanguage(initialLang);

  // Bind Language Switcher Buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const lang = btn.getAttribute('data-lang');
      applyLanguage(lang);
    });
  });

  const calcBtn = document.getElementById('calc-btn');
  if (calcBtn) calcBtn.addEventListener('click', calculate);

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
        if (errEl && !errEl.classList.contains('hidden')) {
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
  if (fullReportBtn && modal) {
    fullReportBtn.addEventListener('click', () => {
      modal.classList.remove('hidden');
    });
  }
  const closeModalBtn = document.getElementById('close-modal-btn');
  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  }
});
