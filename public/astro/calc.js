/* ============================================================
   calc.js — self-contained replacement for the pink-api.ru call.
   Returns an object shaped exactly like the old API response so
   script.js's render functions need zero changes.

   Provenance of text content (updated 2026-07-22 after a second, larger
   reverse-engineering pass with ~37 random live-API samples):
   - consText, planetText, pairEnergyText (all 9 each), arcanaDesc (all
     22), scenarioText (all 10 unique — see note below), consDoubleEnergy
     (all 22 two-digit-day combos), zodiac URL slugs, zodiac role
     titles/descriptions, and the zodiac senior/junior direction rule are
     now ALL real text/logic extracted verbatim from live pink-api.ru
     responses — no more authored guesses for these.
   - love_scenario only has 10 unique values, not 12 — months 11/12 wrap
     back and reuse indices 1/2 (verified live: November's scenario/text
     is identical to February's, December's to March's).
   - Chakra formula is empirically derived/validated (~90% match, see
     CLAUDE.md — the site itself claims only ~95%).
   - fate[0]/[1]/[6] are solved and cross-validated; fate[2..5] use an
     unsolved-but-plausible guess. will[] was found to exactly equal
     fate[] in ~77% of a random real sample, so will = fate is used
     directly instead of an invented divergent formula.
   See CLAUDE.md for the full reverse-engineering log.
   ============================================================ */

/* ---------- generic helpers ---------- */

function digitSum(n) {
  n = Math.abs(Math.round(n));
  while (n > 9) {
    n = String(n).split('').reduce((a, d) => a + Number(d), 0);
  }
  return n;
}

function digitsOf(n) {
  return String(Math.abs(Math.round(n))).split('').map(Number);
}

// Like digitSum, but preserves a "master number" (11, 22, 33) if one is
// produced by an actual digit-summing pass. Confirmed live: the
// Pythagorean square's B/D intermediate values preserve master numbers
// this way, but cons/mission/action/result do NOT — digitSum(29) for a
// day=29 cons still reduces fully to 2, not "11". Scope this to
// calcPifagor only.
//
// Crucially, a master number is only preserved when it EMERGES from
// summing digits — if the input already numerically equals 11/22/33
// without ever being summed (e.g. a raw subtraction result), it still
// gets summed at least once and reduces normally (33 -> 3+3 -> 6, not
// preserved as 33; but 38 -> 3+8 -> 11, preserved since 11 is the
// direct one-pass result of summing 38's digits).
function digitSumKeepMaster(n) {
  n = Math.abs(Math.round(n));
  while (n > 9) {
    const summed = String(n).split('').reduce((a, d) => a + Number(d), 0);
    if (summed === 11 || summed === 22 || summed === 33) return summed;
    n = summed;
  }
  return n;
}

/* ============================================================
   PYTHAGOREAN SQUARE
   ============================================================ */

function calcPifagor(day, month, year) {
  const digits = [...digitsOf(day), ...digitsOf(month), ...digitsOf(year)];
  const A = digits.reduce((a, d) => a + d, 0);
  const B = digitSumKeepMaster(A);
  const C = A - 2 * digits[0];
  const D = digitSumKeepMaster(C);

  const allNums = [...digits, ...digitsOf(A), ...digitsOf(B), ...digitsOf(C), ...digitsOf(D)];

  const counts = Array(10).fill(0);
  allNums.forEach(d => { counts[d]++; });

  const pifagorCells = [];
  for (let digit = 1; digit <= 9; digit++) {
    pifagorCells.push(String(digit).repeat(counts[digit]));
  }

  // pifagorLines (8 "arrow" sums) isn't read by the UI (script.js only
  // uses pifagorCells) — kept as a zeroed placeholder for shape parity.
  const pifagorLines = [0, 0, 0, 0, 0, 0, 0, 0];

  return { pifagorNumbers: allNums, pifagorCells, pifagorLines };
}

/* ============================================================
   NUMEROLOGY (Vedic-style planet mapping 1-9)
   ============================================================ */

const CONS_TEXT = {
  1: ['Sun', 'King', 'Leadership, strength of spirit, purposefulness, one man army, confidence, expansion', 'Aggression, egoism, intolerance of others opinions, stubbornness, high ego, lecturing others', 'Faithful, if they are with the "best" partner in their understanding, who knows how to show respect and appreciate them.'],
  2: ['Moon', 'Diplomat', 'Partnership, friendliness, trust, politeness, understanding details, harmony, sensitivity', 'Doubts, depression, inability to say no, wearing an external "mask", suffering', 'Faithful, if they are under control. Often cannot find the strength to refuse outside offers.'],
  3: ['Jupiter', 'Chief Accountant', 'Neural network brain, analysis, calculation, knowledge, sober look, reliability, care, self-expression', 'Actions out of profit, cunning, giving advice to everyone around, being a "bore", gambling addiction', 'Faithful, because they live more by reason than by feelings. Can be cold to the partner.'],
  4: ['Rahu', 'Opposition', 'Generating ideas, practicality, setting goals, inspiration, creativity', 'Destruction, playing the "victim", criticism, fraud, dissatisfaction', 'Risk of betrayal if in the negative — dissatisfied, always not enough. Know how to play a double game with honest eyes.'],
  5: ['Mercury', 'Businessman', 'Communications, business mindset, intellect, flexibility of a snake, resourcefulness, adequacy', 'Loss of focus, chatter, two-facedness, coldness, emotional vulnerability, deceit', 'Faithful, if immersed in their projects. Otherwise there can be fleeting connections indiscriminately.'],
  6: ['Venus', 'Hedonist', 'Love for life and people, pleasures, beauty, comfort, wisdom, kind heart, creativity', 'Addictions, temptations, immorality, laziness, pettiness, spleen, tantrums', 'Loving, can have several partners in different roles. Will do anything for passion.'],
  7: ['Ketu', 'Enlightened', 'Talent, genius, stardom, their own view of things, ambition, overcoming, temperament', 'Unrecognized, disbelief in themselves, crises, chaos in themselves and for loved ones, star disease', 'The strongest love energy. Often in a background search for new experiments.'],
  8: ['Saturn', 'Factory Director', 'Working for results, capital, will, managing people and resources, discipline, consistency', 'Greed, lack of spirituality, insensitivity, pessimism, living in the past, withdrawal from society', 'Faithful, if there is true love between partners. If they do not find it, they can remain loners.'],
  9: ['Mars', 'Warrior', 'Fighter for all things good, helping neighbors, creation, strong psyche, principles, productivity', 'Drain of energy, mental illnesses, rejection, materialism, unappreciated', 'Generally family-oriented. But first they can sort through partners for a long time. They need someone just as temperamental.'],
};

// consDoubleEnergy: keyed by "d1+d2" (tens digit + ones digit, in that
// order) of a two-digit birth day — populated only when day >= 10.
const CONS_DOUBLE_ENERGY = {
  '1+0': ['Through energies 1 and 0', 'A leader with an additional zero: either amplification or nullification. In the positive, ahead of all competitors by a mile. In the negative, ruins projects.'],
  '1+1': ['Through energies 1 and 1', 'Partnership through two leadership units ("11"). In the positive, initiators and patrons for partners. In the negative, egoists and loners.'],
  '1+2': ['Through energies 1 and 2', 'In the positive, a wise, understanding ("2") and proactive leader ("1") in their circle. In the negative, an egoist who considers themselves the smartest, and a sufferer.'],
  '1+3': ['Through energies 1 and 3', 'Ideology with leadership ("1"), intellect ("3") and care in the positive. In the negative, they need to develop understanding, discard criticism and conceit.'],
  '1+4': ['Through energies 1 and 4', 'Independent strong-willed ("1") creator ("4"), knowing their business and goals. In the negative, emotionally unstable, touchy and thirsty for recognition.'],
  '1+5': ['Through energies 1 and 5', 'Opportunity to realize creativity as a business ("5") through will ("1") and communications. In the negative, they will have to overcome temptations, resentments and egoism.'],
  '1+6': ['Through energies 1 and 6', 'Life will give them everything if they strengthen their will ("1"), develop wisdom ("6") and creativity. Otherwise, the risk of becoming an egoist, seeking only pleasure.'],
  '1+7': ['Through energies 1 and 7', 'Genius and star ("7") with strong-willed qualities ("1"). Success will come through labor and consistency. The risk lies in chaos, crises and an inflated ego.'],
  '1+8': ['Through energies 1 and 8', 'Will ("1"), consistency and hard work ("8") strengthen the main energy. So as not to become a hermit, draining energy, you need to work in partnership.'],
  '1+9': ['Through energies 1 and 9', 'Leader ("1"), warrior ("9") and fighter for all things good against all things bad. In the positive, will save everyone and work for their benefit. In the negative, aggression and despotism.'],
  '2+0': ['Through energies 2 and 0', 'Partnership with an additional zero: either amplification or nullification. In the positive, understanding, sincere, mutual. In the negative, nullify all relationships.'],
  '2+1': ['Through energies 2 and 1', 'In the positive, a guru with a soft ("2") power ("1"). But without developing understanding ("2") and will ("1") is not confident in their knowledge and sheds responsibility.'],
  '2+2': ['Through energies 2 and 2', 'Subtle psychologists ("2") and indispensable partners who know how to find solutions. But in the negative, all partnerships will lead to suffering and destruction.'],
  '2+3': ['Through energies 2 and 3', 'Intellect ("3") and understanding of others ("2") will allow managing projects and transferring knowledge. In the negative, sufferers in eternal doubts.'],
  '2+4': ['Through energies 2 and 4', 'Partnership ("2"), idea generation ("4") and the ability to see goals will bring realization. But in the negative, doubts will bring negativity and destruction.'],
  '2+5': ['Through energies 2 and 5', 'Partnership and understanding ("2") are perfectly realized with communications and a business mindset ("5"). In the negative, this is suffering, doubts and cunning.'],
  '2+6': ['Through energies 2 and 6', 'Creative ("6") and subtly understanding ("2") personality. High bar in life. But success can be hindered by doubts and actions led by temptations.'],
  '2+7': ['Through energies 2 and 7', 'Keys to success: partnership, help ("2") and solving problems that broke others ("7"). Failure in misanthropy, chaos and constant crises.'],
  '2+8': ['Through energies 2 and 8', 'Leadership through partnership ("2"), consistency ("8") and hard work. Success in teamwork, business. In the negative, resentments and misunderstanding of others.'],
  '2+9': ['Through energies 2 and 9', 'Partner ("2"), capable of uniting others to fight ("9") for a just cause, to help and save the world. In the negative, fighting for the sake of fighting.'],
  '3+0': ['Through energies 3 and 0', 'Intellect with an additional zero: either amplification or nullification. In the positive, a versatile personality. In the negative, devalues knowledge.'],
  '3+1': ['Through energies 3 and 1', 'Generating ideas based on intellect and knowledge ("3") and embodiment through will ("1"). In the negative, experience misunderstanding with others, bend them.'],
};

// shared short "Planet. traits" table used for mission / action / result
const PLANET_TEXT = {
  1: 'Sun. Leadership, big goals, vision of the path, management, strategy, result',
  2: 'Moon. Partnership, understanding, diplomacy, softness, warmth, help, psychology',
  3: 'Jupiter. Analysis, intellect, knowledge, information transfer, calculation, organization',
  4: 'Rahu. Generating ideas, mysticism, creativity, destruction of the old, goal setting',
  5: 'Mercury. Communications, expansion, flexibility, adequacy, business, resourcefulness',
  6: 'Venus. Enjoying life, creativity, love, pleasures, art, wisdom',
  7: 'Ketu. Genius, crises and solutions, awareness, transformation, philosophy',
  8: 'Saturn. Consistency, labor, materialism, process control, results, team',
  9: 'Mars. Fighting for good goals, justice, saving the world, strong spirit, passion',
};

// shared long paragraph table for the numerologic_result_pair fields
const PAIR_ENERGY_TEXT = {
  1: 'The energy of the Sun 1 is one of the two most complex energies in compatibility along with 4. With explicit leadership of one of the partners (preferably also with the presence of energy 1 in the personal code) and a secondary role for the other, such a couple can move together towards the goal set by the leader according to their strategy. If such a distribution of roles is comfortable for both. However, when it comes to equality and balance, these relationships most often reduce to clarifying leadership and suppressing each other. Rare cases when two equal "rivals" find interest and dynamics in their game and exist for a long time. Usually, in the negative, there is a lot of misunderstanding, unwillingness to listen, self-will, and egoism. Which ultimately leads to loneliness in the relationship or even an outright competition of "who beats who" with a desire to "dominate" and trample the partner. That is why stages under this energy are called "then each on their own".',
  2: 'The energy of the Moon 2 is one of the most favorable in family compatibility. It is about partnership, subtle understanding of feelings and emotions, intuition, and support. Numerologists call unions on energy 2 as "these two go straight to the registry office". In astrology, the Moon is responsible for intuition and state of mind. The key point on this energy is to establish understanding in the couple on a soul level. Without pressure, without judgment. Understanding each other as they really are. And intuition alone will not be enough. Dialogue is needed, ideally like two professional psychologists. In a negative state, if understanding is not achieved, partners will be in eternal doubt about their choice and the relationship as a whole. This will develop negative illusions, shake the soul balance, create love triangles, and lead to separation.',
  3: 'The energy of Jupiter 3 is considered a good rational addition to relationships at any stage. Yes, it is not about passion and depth of feelings, like some other energies. But it is about sober calculation, benefits, and interaction on the terms of agreements. Numerologists call relationships on this energy "marriages of convenience". And the most important thing is that they are very long-term. Provided that everyone truly sees and receives their benefit from these relationships, and the entire exchange of "benefits" is open and transparent. And the couple concluded a "contract" about their investments, personal and shared benefits. The form of this contract does not matter. The main thing is that it is understandable to everyone and accepted mutually. Ideally, joint and personal benefits begin to multiply in this couple. A negative state occurs when one of the partners begins to deceive or lowers their value in the eyes of the other: was rich — became poorer, was beautiful — lost attractiveness. Moreover, the subjective view of the partner is what matters. Then pettiness, dissatisfaction, and accounting calculations begin: who is not getting what and who owes what to whom.',
  4: 'The energy of Rahu 4 is one of the two most problematic in compatibility along with 1. It can work in business, because Rahu generates ideas, creates the new, and makes discoveries. But in relationships, the flip side is more often manifested: focus on the negative, accumulation of dissatisfaction, and ultimately destruction. The creation-destruction cycle is a manifestation of Rahu. Partners with high awareness will be able to live in it, alternating stages. But much more often on this energy there are (if we talk about the General Consciousness) those who are subject to destructive influences: both with depression, addictions, the desire to "break the system". And even if they coincide in their ideas, partners rarely have enough internal resource to plan and embody everything. Which makes depressive moods and dissatisfaction only grow. The advice of numerologists is that the common "head of a demon without a body" (as Rahu is called in myths) needs to be given the feeling of a physical body for accumulating energy — for example, through joint physical activity and sports. Then destruction will touch only the old, weak, and obsolete, and ideas will gush forth and plans for their embodiment will be realized.',
  5: 'The energy of Mercury 5 is excellent in business cooperation and a good addition to the compatibility of a couple where communication is an important part and there is common ground in intellect. Because Mercury is about communications, expansion, and adequacy. It is not hot, but constructive in its manifestation. And it knows how to be diplomatic, correct, erudite. In the positive, couples under this energy always develop common interests, travel, discover new things, chat about everything tirelessly, and open new horizons to each other. It is important that they also know how to look at their relationship without rose-colored glasses. And if they find some business, they will certainly scale it. In the negative, energy 5 will make communications superficial and indifferent, and the search for common areas an endless sorting of everything without focus. Thus, having essentially latched onto nothing and not delved into each other with proper depth, the couple may grow completely cold and break up.',
  6: 'The energy of Venus 6 is one of the most favorable in compatibility. This is a direct path to love, to making love, and receiving all sensual pleasures. In fact, this is the fastest success in love among all possible energies. Partners jointly gain comfort, enjoyments, experience earthly joys. But the ease of success relaxes, and sensual pleasures can become the only stimulus, which together will quickly bore, becoming routine. Then a negative state will manifest: the development of relationships will stop, and someone will even go to the side in search of continued pleasures. We must not forget about the development of relationships, about their semantic filling, and understanding the true wisdom of love — this is what is important under this energy.',
  7: 'The energy of Ketu 7 is about the brightest passion and that very spark between a man and a woman. But it will not suit everyone. Because as soon as the spark goes out, the crises and chaos created by Ketu come to the fore. They will arise literally out of nowhere and from both sides. But their goal is for the relationship to develop through the joint transformation of partners. It will not be boring here, so sitting still will certainly not work: if only one of the partners gets stuck in development or the inability to pass another crisis, and the second partner overtakes — tomorrow they will be separated by an abyss. Therefore, it is important for everyone to stay in shape, think quickly, invent anti-crisis measures, and be able to focus in chaos on what is truly important. If there is no order, then because of another chaos there is a great risk of betrayal here, because the states "today I love", "tomorrow I hate", and "the day after tomorrow I take revenge" change rapidly — unbridled passion needs an outlet. According to mythology, Ketu is a "demon without a head". And for constructive relationships, this demon must be tamed by turning on its "head".',
  8: 'The energy of Saturn 8 manifests best in business and joint projects, but is also not bad for family for those partners who are ready for hard work for the good of the common nest. This is the most material energy of all. And Saturn is generous with rewards in the form of financial and material well-being to those who were hardworking in building their "system", in which every gear in the mechanism is scrupulously calculated and every step is controlled. In the case of compatibility, a "system" can also be understood as a family with common life, a home, and all related benefits. But you need to understand that Saturn is a serious, fundamental, and slow planet. Quick success should not be expected. But everything will be reliable, stable, and smooth, like on rails. And the result of actions can be touched and looked at in a bank account. In the negative on this energy, there is total control, pettiness, insensitivity, fixation on the material, and treating the partner as a tool and resource.',
  9: 'The energy of Mars 9 is passion, breakthrough action, overcoming, "karma" and, of course, war, because Mars is the god of war. Ideally, partners should fight on the same side and against a common enemy. This "enemy" is often some serious problems for one of the partners, where the second comes to the rescue. Or emerging difficult circumstances that must be overcome jointly. Or a common spiritual path that is too thorny for one. All these moments give relationships a "karmic" character. But, if a common enemy is not found, then the vectors of Mars of both partners can easily be directed against each other. And from passion and self-sacrifice to confrontation with a promise not to leave a stone unturned is one step here. Just give Mars a reason to fight. It is also believed that energy 9, as the last and highest energy in the series of numbers, contains a fraction of each energy. Therefore, the manifestations of relationships on energy 9 are the most diverse.',
};

function calcNumerology(day, month, year) {
  const dateArr = [...digitsOf(day), ...digitsOf(month), ...digitsOf(year)];
  const dayDigits = digitsOf(day);

  const consNum = digitSum(day);
  const consFormula = dayDigits.length > 1 ? dayDigits.join(' + ') : '-';
  const consDoubleEnergy = dayDigits.length > 1
    ? (CONS_DOUBLE_ENERGY[dayDigits.join('+')] || ['', ''])
    : ['', ''];

  const mission = digitSum(dateArr.reduce((a, d) => a + d, 0));
  const action = digitSum(consNum + mission);
  const result = digitSum(consNum + mission + action);

  const { pifagorCells } = calcPifagor(day, month, year);

  return {
    dateImport: [day, month, year],
    dateArr,
    cons: [consNum, consFormula],
    consDoubleEnergy,
    consText: CONS_TEXT[consNum],
    mission,
    missionText: PLANET_TEXT[mission],
    action,
    actionText: PLANET_TEXT[action],
    actionSum: [consNum, mission],
    result,
    resultText: PLANET_TEXT[result],
    resultSum: [consNum, mission, action],
    matrix: pifagorCells,
  };
}

function calcNumerologyPair(male, female) {
  const cons = digitSum(male.cons[0] + female.cons[0]);
  const mission = digitSum(male.mission + female.mission);
  const action = digitSum(male.action + female.action);
  const result = digitSum(male.result + female.result);
  return {
    cons, consCharact: PAIR_ENERGY_TEXT[cons],
    mission, missionText: PAIR_ENERGY_TEXT[mission],
    action, actionText: PAIR_ENERGY_TEXT[action],
    result, resultText: PAIR_ENERGY_TEXT[result],
  };
}

/* ============================================================
   ZODIAC
   ============================================================ */

const ZODIAC_SIGNS = [
  { name: 'Aries',       url: 'oven',        element: 'Fire',  period: 'Mar 21 - Apr 19', start: [3, 21], end: [4, 19] },
  { name: 'Taurus',      url: 'telets',      element: 'Earth', period: 'Apr 20 - May 20', start: [4, 20], end: [5, 20] },
  { name: 'Gemini',      url: 'bliznecy',    element: 'Air',   period: 'May 21 - Jun 20', start: [5, 21], end: [6, 20] },
  { name: 'Cancer',      url: 'rak',         element: 'Water', period: 'Jun 21 - Jul 22', start: [6, 21], end: [7, 22] },
  { name: 'Leo',         url: 'lev',         element: 'Fire',  period: 'Jul 23 - Aug 22', start: [7, 23], end: [8, 22] },
  { name: 'Virgo',       url: 'deva',        element: 'Earth', period: 'Aug 23 - Sep 22', start: [8, 23], end: [9, 22] },
  { name: 'Libra',       url: 'vesy',        element: 'Air',   period: 'Sep 23 - Oct 22', start: [9, 23], end: [10, 22] },
  { name: 'Scorpio',     url: 'skorpion',    element: 'Water', period: 'Oct 23 - Nov 21', start: [10, 23], end: [11, 21] },
  { name: 'Sagittarius', url: 'strelets',    element: 'Fire',  period: 'Nov 22 - Dec 21', start: [11, 22], end: [12, 21] },
  { name: 'Capricorn',   url: 'kozerog',     element: 'Earth', period: 'Dec 22 - Jan 20', start: [12, 22], end: [1, 20] },
  { name: 'Aquarius',    url: 'vodoley',     element: 'Air',   period: 'Jan 21 - Feb 18', start: [1, 21], end: [2, 18] },
  { name: 'Pisces',      url: 'riby',        element: 'Water', period: 'Feb 19 - Mar 20', start: [2, 19], end: [3, 20] },
];

function zodiacIndex(day, month) {
  for (let i = 0; i < 12; i++) {
    const s = ZODIAC_SIGNS[i];
    const [sm, sd] = s.start, [em, ed] = s.end;
    if (sm === em) {
      if (month === sm && day >= sd && day <= ed) return i;
    } else if (sm < em) {
      if ((month === sm && day >= sd) || (month === em && day <= ed) || (month > sm && month < em)) return i;
    } else {
      // wraps around year end (Capricorn)
      if ((month === sm && day >= sd) || (month === em && day <= ed)) return i;
    }
  }
  return 0;
}

const ELEMENT_HARMONY = {
  same: 'Same element — perfect harmony',
  compatible: {
    'Air-Fire': 'Elements in harmony',
    'Earth-Water': 'Elements in harmony',
  },
  clash: 'Elements clash',
};

function elementHarmonyText(elA, elB) {
  if (elA === elB) return ELEMENT_HARMONY.same;
  const key = [elA, elB].sort().join('-');
  return ELEMENT_HARMONY.compatible[key] || ELEMENT_HARMONY.clash;
}

// Per distance 1-5: [roleWhenMaleIsAhead_male, roleWhenMaleIsAhead_female].
// "Male ahead" means moving forward from the female's position by
// `distance` steps lands on the male's position. Direction convention is
// NOT consistent across distances (verified against ~30 real examples —
// e.g. distance 3 gives the "ahead" person the senior role, but distance
// 2/4/5 give the "ahead" person the junior role) so each is hardcoded
// from observed data rather than derived from a single universal rule.
/* ============================================================
   ZODIAC COMPATIBILITY 78-PAIR KNOWLEDGE BASE
   ============================================================ */
const ZODIAC_PAIR_DESCRIPTIONS = {
  "Aries&Libra": "Aries acts as the impulsive Catalyst, while Libra steps in as the diplomatic Mediator. Your chemistry is immediate because Aries learns grace from Libra, while Libra learns decisive self-advocacy from Aries. Good for Marriage: Yes, you balance each other's blind spots exceptionally well.",
  "Taurus&Scorpio": "Taurus serves as the steady Builder, while Scorpio operates as the intense Strategist. This pair creates a magnetic bond of loyalty and shared determination, provided you don't lock horns in stubborn power struggles. Good for Marriage: Yes, your shared value of unwavering devotion creates a long-lasting foundation.",
  "Gemini&Sagittarius": "Gemini is the curious Student gathering local details, while Sagittarius is the expansive Philosopher chasing universal truths. You keep life vibrant through non-stop intellectual dialogue, travel, and mutual freedom. Good for Marriage: Yes, your shared thirst for mental growth keeps boredom at bay.",
  "Cancer&Capricorn": "Cancer takes the role of the intuitive Nurturer, while Capricorn assumes the role of the structured Provider. You naturally fall into a traditional harmony where emotional security and material stability reinforce one another. Good for Marriage: Yes, you form an exceptionally stable domestic unit.",
  "Leo&Aquarius": "Leo is the passionate Performer, while Aquarius acts as the objective Director. Leo brings warm, personal heart to the relationship, while Aquarius provides visionary perspective, creating a balanced and striking team dynamic. Good for Marriage: Yes, your complementary energies build a strong power-couple dynamic.",
  "Virgo&Pisces": "Virgo acts as the grounded Analyst, while Pisces serves as the intuitive Visionary. Virgo brings practical structure to Pisces' big dreams, while Pisces teaches Virgo to relax perfectionist tendencies and embrace flow. Good for Marriage: Yes, you form a deeply healing partnership.",
  "Aries&Leo": "Aries acts as the Initiator, while Leo acts as the Sustainer in this high-energy Fire pair. Your shared enthusiasm and competitive spirit make you an inspiring team that constantly pushes each other forward. Good for Marriage: Yes, your shared passion and mutual support make for a vibrant life together.",
  "Aries&Sagittarius": "Aries acts as the Pioneer, while Sagittarius serves as the Explorer. Your connection is effortless, filled with optimism, spontaneous adventures, and a deep respect for each other's independence. Good for Marriage: Yes, you thrive on joint goals and shared freedom.",
  "Leo&Sagittarius": "Leo is the charismatic Sovereign, while Sagittarius is the adventurous Wanderer. Your bond is generous, warm, and playful, bringing out the highest levels of confidence and optimism in both partners. Good for Marriage: Yes, you enjoy a joyful and resilient relationship.",
  "Taurus&Virgo": "Taurus takes the role of the steady Anchor, while Virgo acts as the meticulous Planner. You build a peaceful, highly functional life grounded in sensible decisions, physical comfort, and reliable routines. Good for Marriage: Yes, your shared practical values make you deeply dependable partners.",
  "Taurus&Capricorn": "Taurus is the loyal Sustainer, while Capricorn acts as the ambitious Architect. Together, you focus on long-term security, material success, and building a comfortable, lasting legacy. Good for Marriage: Yes, you possess one of the most unshakable foundations in synastry.",
  "Virgo&Capricorn": "Virgo functions as the practical Specialist, while Capricorn operates as the executive Leader. Your fluid cooperation in running a household or managing shared ambitions makes you an incredible team. Good for Marriage: Yes, your mutual work ethic and grounded goals guarantee stability.",
  "Gemini&Libra": "Gemini plays the expressive Communicator, while Libra steps in as the social Harmonizer. Your connection is lighthearted and social, marked by constant conversation and shared cultural or intellectual interests. Good for Marriage: Yes, you build a harmonious and socially active union.",
  "Gemini&Aquarius": "Gemini is the inquisitive Thinker, while Aquarius acts as the forward-thinking Innovator. You give each other plenty of intellectual space and share an open-minded approach to living life on your own terms. Good for Marriage: Yes, your high friendship value creates a durable bond.",
  "Libra&Aquarius": "Libra acts as the relationship Strategist, while Aquarius serves as the social Visionary. You bond over shared ideals, social justice, and artistic endeavors, maintaining a peaceful and intellectually stimulating dynamic. Good for Marriage: Yes, you enjoy a deeply inspiring and harmonious union.",
  "Cancer&Scorpio": "Cancer serves as the protective Sanctuary, while Scorpio acts as the watchful Guard. Your connection is intensely emotional, intuitive, and bound by deep trust and unwavering loyalty. Good for Marriage: Yes, you form an extraordinarily devoted and supportive pair.",
  "Cancer&Pisces": "Cancer acts as the compassionate Caregiver, while Pisces functions as the creative Dreamer. You offer each other a gentle, empathetic safe haven where feelings are validated without judgment. Good for Marriage: Yes, your emotional alignment fosters deep domestic bliss.",
  "Scorpio&Pisces": "Scorpio provides the Anchor of Depth, while Pisces brings the Flowing Spirit. Scorpio gives Pisces a sense of safety and grounding, while Pisces brings healing, romantic softness to Scorpio's intense world. Good for Marriage: Yes, you share a profound emotional connection.",
  "Aries&Gemini": "Aries brings energetic drive, while Gemini supplies quick-witted ideas. Your relationship feels like an ongoing adventure filled with laughter, banter, and zero downtime. Good for Marriage: Yes, your natural camaraderie creates a fun, lasting friendship.",
  "Aries&Aquarius": "Aries leads the physical charge, while Aquarius designs the innovative plan. Together, you form an unconventional, forward-thinking duo that respects individual autonomy. Good for Marriage: Yes, your mutual encouragement supports long-term growth.",
  "Taurus&Cancer": "Taurus provides solid physical comfort, while Cancer offers warm emotional care. You take immense pleasure in building a cozy, hospitable home environment together. Good for Marriage: Yes, you share an exceptionally high level of domestic compatibility.",
  "Taurus&Pisces": "Taurus grounds the relationship in reality, while Pisces injects imagination and artistic flair. You enjoy a peaceful, gentle pace of life that feels both secure and romantic. Good for Marriage: Yes, your complementary temperaments foster lasting ease.",
  "Gemini&Leo": "Gemini supplies engaging conversation, while Leo brings theatrical warmth and enthusiasm. You thrive in social settings and constantly keep each other entertained. Good for Marriage: Yes, your lively dynamic supports a happy partnership.",
  "Cancer&Virgo": "Cancer provides intuitive nurturing, while Virgo handles practical organization. You take care of one another in tangible ways, creating an efficient and loving home. Good for Marriage: Yes, your complementary strengths make daily life run smoothly.",
  "Leo&Libra": "Leo brings bold magnetism, while Libra adds refined charm and style. You share a love for romance, art, and social gatherings, making you a popular and harmonious pair. Good for Marriage: Yes, you easily maintain romance and mutual appreciation.",
  "Virgo&Scorpio": "Virgo offers analytical clarity, while Scorpio digs into hidden truths. You share a quiet, discerning nature and form a deeply loyal bond built on mutual respect. Good for Marriage: Yes, your understated strength makes for a resilient union.",
  "Libra&Sagittarius": "Libra brings diplomatic grace, while Sagittarius adds spontaneous excitement. You inspire one another to expand your horizons through learning, travel, and social connection. Good for Marriage: Yes, your bright outlook keeps the relationship refreshing.",
  "Scorpio&Capricorn": "Scorpio brings intense emotional focus, while Capricorn provides steady strategic execution. You respect each other's drive, forming a formidable and protective union. Good for Marriage: Yes, you build a solid life centered on mutual ambition.",
  "Sagittarius&Aquarius": "Sagittarius offers philosophical curiosity, while Aquarius contributes inventive vision. You share an open-minded approach to life that gives both partners room to explore. Good for Marriage: Yes, your shared independence creates a flexible, enduring connection.",
  "Capricorn&Pisces": "Capricorn provides structural support, while Pisces brings emotional depth and soulfulness. You balance practical responsibility with imagination in a comforting way. Good for Marriage: Yes, you offer each other grounding and inspiration in equal measure.",
  "Aries&Taurus": "Aries acts as the pioneering Older Brother who sparks momentum, while Taurus acts as the cautious Younger Brother who grounds that energy into reality. Aries can get frustrated by Taurus's slow pace, and Taurus feels rushed by Aries's impatience. Not Good for Marriage: These zodiac signs are not compatible due to fundamental clashes between urgency and deliberation.",
  "Taurus&Gemini": "Taurus steps in as the grounded Older Brother who focuses on tangible output, while Gemini is the curious Younger Brother eager to gather new options. Taurus finds Gemini ungrounded, while Gemini finds Taurus overly predictable. Not Good for Marriage: These zodiac signs are not compatible because your basic needs for routine versus variety constantly conflict.",
  "Gemini&Cancer": "Gemini plays the cerebral Older Brother who analyzes facts, while Cancer is the sensitive Younger Brother who absorbs feelings. Gemini can accidentally brush off Cancer's moods, leaving Cancer feeling emotionally unsafe. Not Good for Marriage: These zodiac signs are not compatible due to mismatched communication styles between logic and emotion.",
  "Cancer&Leo": "Cancer assumes the protective Older Brother role behind the scenes, while Leo steps out as the expressive Younger Brother demanding center stage. Cancer's private nature often clashes with Leo's desire for public recognition. Not Good for Marriage: These zodiac signs are not compatible as your temperaments pull toward opposite ends of the social spectrum.",
  "Leo&Virgo": "Leo plays the confident Older Brother setting grand visions, while Virgo acts as the meticulous Younger Brother sharpening the details. Leo may feel criticized by Virgo's adjustments, while Virgo gets tired of managing Leo's ego. Not Good for Marriage: These zodiac signs are not compatible due to ongoing tension between big pride and fine critique.",
  "Virgo&Libra": "Virgo serves as the practical Older Brother focused on efficient order, while Libra acts as the artistic Younger Brother seeking aesthetic balance. Virgo can view Libra as indecisive, while Libra finds Virgo's critique unromantic. Not Good for Marriage: These zodiac signs are not compatible because your day-to-day priorities rarely align naturally.",
  "Libra&Scorpio": "Libra is the agreeable Older Brother maintaining smooth surface relations, while Scorpio is the intense Younger Brother digging for unspoken truths. Libra feels unsettled by Scorpio's intensity, and Scorpio distrusts Libra's politeness. Not Good for Marriage: These zodiac signs are not compatible due to deep friction between social diplomacy and raw honesty.",
  "Scorpio&Sagittarius": "Scorpio acts as the guarded Older Brother protecting deeper motives, while Sagittarius is the candid Younger Brother who blurt out thoughts freely. Scorpio feels exposed by Sagittarius, while Sagittarius feels weighed down by Scorpio's secrecy. Not Good for Marriage: These zodiac signs are not compatible because your emotional boundaries operate on opposite extremes.",
  "Sagittarius&Capricorn": "Sagittarius serves as the idealistic Older Brother chasing big visions, while Capricorn acts as the disciplined Younger Brother enforcing realistic limits. Sagittarius feels restricted by Capricorn's rules, and Capricorn views Sagittarius as irresponsible. Not Good for Marriage: These zodiac signs are not compatible due to a constant struggle between freedom and restraint.",
  "Capricorn&Aquarius": "Capricorn acts as the traditional Older Brother honoring established structures, while Aquarius acts as the rebellious Younger Brother pushing for innovation. Capricorn resists Aquarius's radical ideas, while Aquarius rebels against Capricorn's authority. Not Good for Marriage: These zodiac signs are not compatible due to opposing philosophies on tradition versus reform.",
  "Aquarius&Pisces": "Aquarius functions as the detached Older Brother thinking of the collective, while Pisces is the empathetic Younger Brother absorbing individual feelings. Aquarius struggles with Pisces's emotional fluidity, while Pisces feels lonely around Aquarius's cool logic. Not Good for Marriage: These zodiac signs are not compatible because emotional intimacy is difficult to maintain.",
  "Pisces&Aries": "Pisces acts as the reflective Older Brother offering instinctive wisdom, while Aries steps up as the impulsive Younger Brother charging ahead. Pisces feels overwhelmed by Aries's forcefulness, while Aries grows impatient with Pisces's passivity. Not Good for Marriage: These zodiac signs are not compatible due to sharply contrasting energy levels and instincts.",
  "Aries&Cancer": "Aries pushes for fast, direct action, while Cancer needs emotional safety and reflection before moving forward. Aries feels held back by Cancer's caution, while Cancer feels bruised by Aries's blunt approach. Not Good for Marriage: These zodiac signs are not compatible because your emotional instincts constantly trigger defensiveness.",
  "Aries&Capricorn": "Aries relies on quick impulse, while Capricorn demands long-term strategy and discipline. Aries feels suffocated by Capricorn's rules, while Capricorn views Aries's haste as reckless. Not Good for Marriage: These zodiac signs are not compatible due to a structural conflict over control and pace.",
  "Cancer&Libra": "Cancer reaches for deep emotional bonding, while Libra looks for objective, intellectual harmony. Cancer finds Libra emotionally detached, while Libra feels exhausted by Cancer's unpredictable mood shifts. Not Good for Marriage: These zodiac signs are not compatible as your approaches to relational intimacy conflict.",
  "Libra&Capricorn": "Libra seeks flexible compromise and social ease, while Capricorn insists on firm rules and clear hierarchies. Libra finds Capricorn rigid, while Capricorn views Libra's indecisiveness as weak leadership. Not Good for Marriage: These zodiac signs are not compatible due to conflicting philosophies on authority and negotiation.",
  "Taurus&Leo": "Taurus wants quiet financial caution and predictable routines, while Leo seeks grand expressions, generosity, and public recognition. Both are stubbornly fixed, leading to endless standoffs over spending and lifestyle priorities. Not Good for Marriage: These zodiac signs are not compatible because neither sign is willing to compromise your pride or preferences.",
  "Taurus&Aquarius": "Taurus demands predictable stability and tradition, while Aquarius pushes for radical change and intellectual freedom. Taurus views Aquarius as erratic, while Aquarius sees Taurus as narrow-minded. Not Good for Marriage: These zodiac signs are not compatible due to irreconcilable values regarding routine versus change.",
  "Leo&Scorpio": "Leo wants open appreciation and straightforward expression, while Scorpio operates with privacy, emotional power, and hidden strategy. Power struggles over control and transparency run deep in this pair. Not Good for Marriage: These zodiac signs are not compatible because your stubborn wills turn differences into emotional standoffs.",
  "Scorpio&Aquarius": "Scorpio requires deep emotional involvement and intense loyalty, while Aquarius maintains intellectual detachment and broad social networks. Scorpio feels insecure with Aquarius's cool distance, while Aquarius feels suffocated by Scorpio's possessiveness. Not Good for Marriage: These zodiac signs are not compatible due to mismatched emotional needs.",
  "Gemini&Virgo": "Gemini jumps across multiple ideas casually, while Virgo demands precise execution and thorough organization. Gemini feels micro-managed by Virgo's critiques, while Virgo feels stressed by Gemini's lack of follow-through. Not Good for Marriage: These zodiac signs are not compatible because your working styles create persistent nervous tension.",
  "Gemini&Pisces": "Gemini processes life through objective logic, while Pisces navigates reality through intuitive, subjective feelings. Gemini finds Pisces overly dramatic or vague, while Pisces finds Gemini cold and superficial. Not Good for Marriage: These zodiac signs are not compatible due to a fundamental breakdown in how you communicate.",
  "Virgo&Sagittarius": "Virgo concentrates on practical daily details, while Sagittarius focuses exclusively on the expansive big picture. Virgo sees Sagittarius as careless, while Sagittarius views Virgo as overly cautious and nitpicky. Not Good for Marriage: These zodiac signs are not compatible because your scope of focus continuously pulls you apart.",
  "Sagittarius&Pisces": "Sagittarius practices direct, unfiltered honesty, while Pisces requires delicate emotional handling. Sagittarius unintentionally hurts Pisces's feelings, while Pisces's indirect responses frustrate Sagittarius's need for directness. Not Good for Marriage: These zodiac signs are not compatible due to contrasting approaches to truth and sensitivity.",
  "Aries&Virgo": "Aries moves on raw impulse, while Virgo needs careful preparation and risk assessment. Aries views Virgo's caution as a drag, while Virgo views Aries's speed as sloppy. Not Good for Marriage: These zodiac signs are not compatible due to contradictory operational habits.",
  "Aries&Scorpio": "Aries fights out in the open, while Scorpio operates through quiet strategy and emotional depth. Though you share an intense physical attraction, your motives and tactics clash under stress. Not Good for Marriage: These zodiac signs are not compatible because power struggles easily burn out the connection.",
  "Taurus&Libra": "While both appreciate beauty, Taurus prefers low-key comfort at home, whereas Libra seeks active social engagements and cultural outings. Taurus finds Libra's social needs tiresome, while Libra feels stifled by Taurus's domesticity. Not Good for Marriage: These zodiac signs are not compatible due to diverging lifestyle demands.",
  "Taurus&Sagittarius": "Taurus values a predictable domestic routine, while Sagittarius craves spontaneous travel and constant change. Taurus feels anxious around Sagittarius's restlessness, while Sagittarius feels trapped by Taurus's stability. Not Good for Marriage: These zodiac signs are not compatible because your core desires for security versus freedom oppose one another.",
  "Gemini&Scorpio": "Gemini prefers light, wide-ranging social banter, while Scorpio demands emotional depth and privacy. Gemini feels weighed down by Scorpio's intensity, while Scorpio finds Gemini's casual nature insincere. Not Good for Marriage: These zodiac signs are not compatible due to incompatible levels of emotional depth.",
  "Gemini&Capricorn": "Gemini approaches life with playful flexibility, while Capricorn operates with strict discipline and long-term ambition. Gemini finds Capricorn overly solemn, while Capricorn views Gemini as irresponsible. Not Good for Marriage: These zodiac signs are not compatible because your basic attitudes toward duty clash.",
  "Cancer&Sagittarius": "Cancer craves emotional intimacy and a stable home base, while Sagittarius seeks independence and outdoor adventures. Cancer feels neglected by Sagittarius's wanderlust, while Sagittarius feels constrained by Cancer's emotional demands. Not Good for Marriage: These zodiac signs are not compatible due to fundamentally opposing security requirements.",
  "Cancer&Aquarius": "Cancer centers life around close personal ties and home, while Aquarius focuses on community networks and broad humanitarian ideals. Cancer feels hurt by Aquarius's objective distance, while Aquarius feels drained by Cancer's personal expectations. Not Good for Marriage: These zodiac signs are not compatible because your emotional focal points are worlds apart.",
  "Leo&Capricorn": "Leo desires enthusiastic praise and personal warmth, while Capricorn offers reserved authority and quiet results. Leo feels starved for affection, while Capricorn views Leo's need for attention as childish. Not Good for Marriage: These zodiac signs are not compatible due to incompatible emotional reward systems.",
  "Leo&Pisces": "Leo needs bold presence and direct validation, while Pisces drifts through quiet sensitivity and subtle shifts in mood. Leo accidentally overwhelms Pisces, while Pisces retreats into solitude, leaving Leo confused. Not Good for Marriage: These zodiac signs are not compatible because your energetic rhythms clash.",
  "Virgo&Aquarius": "Virgo focuses on tangible, immediate improvements, while Aquarius thinks in broad, systemic theories. Virgo finds Aquarius impractical, while Aquarius sees Virgo as bogged down in minutiae. Not Good for Marriage: These zodiac signs are not compatible due to mismatched problem-solving approaches.",
  "Libra&Pisces": "Libra seeks balanced, intellectual fairness in partnerships, while Pisces operates on boundless, unconditional empathy. You can easily fall into codependent patterns without setting clear boundaries. Not Good for Marriage: These zodiac signs are not compatible because a lack of practical grounding creates long-term instability.",
  "Aries&Aries": "Two impulsive Catalysts create an energetic bond filled with excitement, but constant competition and quick tempers can lead to sudden burnouts. Conditional: Works well only if both partners manage your pride and share common goals.",
  "Taurus&Taurus": "Two steady Builders establish an exceptionally comfortable, loyal, and secure life, though you risk getting stuck in rigid routines. Conditional: Highly stable for marriage, provided you don't lock into mutual stubbornness.",
  "Gemini&Gemini": "Two curious Students keep life endlessly interesting with witty banter and constant activity, though your shared restlessness can make long-term commitment tricky. Conditional: Successful if both cultivate emotional depth alongside intellectual stimulation.",
  "Cancer&Cancer": "Two intuitive Nurturers build a deeply caring home, but double sensitivity can turn minor misunderstandings into prolonged emotional retreats. Conditional: Excellent domestic foundation if both maintain clear emotional boundaries.",
  "Leo&Leo": "Two charismatic Performers bring immense passion and fun to the relationship, but fighting over the spotlight can strain the bond. Conditional: Thrives if you learn to take turns celebrating each other's achievements.",
  "Virgo&Virgo": "Two meticulous Analysts keep life impeccably organized, but doubling up on critical tendencies can create an overly stressful home environment. Conditional: Works wonderfully if you direct your analytical skills outward rather than at each other.",
  "Libra&Libra": "Two graceful Mediators build a romantic, harmonious atmosphere, but a mutual avoidance of conflict can leave real problems unaddressed. Conditional: Successful if both learn to tackle difficult conversations head-on.",
  "Scorpio&Scorpio": "Two intense Strategists form an unbreakable, deeply devoted bond, but unaddressed mistrust can turn the relationship into a power struggle. Conditional: Incredibly strong for marriage if mutual trust is absolute from the start.",
  "Sagittarius&Sagittarius": "Two adventurous Philosophers enjoy endless travel and learning, but a lack of grounding can make managing practical responsibilities difficult. Conditional: Great partnership if at least one partner keeps an eye on practical details.",
  "Capricorn&Capricorn": "Two ambitious Architects build an impressive life of financial security, though focusing too much on work can leave little room for emotional warmth. Conditional: Highly successful for long-term stability if you make time for personal connection.",
  "Aquarius&Aquarius": "Two visionary Directors share a deep intellectual understanding and respect for freedom, but cool detachment can hinder deep emotional intimacy. Conditional: Strong companionship if you consciously nurture emotional connection.",
  "Pisces&Pisces": "Two empathetic Visionaries share a magical connection, but a lack of practical boundaries can make dealing with real-world stress difficult. Conditional: Beautiful union if both partners practice staying grounded in daily responsibilities.",
};

function replaceFirstSignName(text, signWord, personName) {
  if (!text || !signWord || !personName) return text;
  const escaped = signWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(^|[^\\p{L}\\p{N}_])(${escaped})('s|'|’s)?(?![\\p{L}\\p{N}_]|\\s*\\()`, 'u');
  if (pattern.test(text)) {
    return text.replace(pattern, (match, prefix, word, suffix) => {
      return `${prefix}${word} (${personName})${suffix || ''}`;
    });
  }
  return text;
}

function getZodiacPairDescription(sign1, sign2, name1, name2) {
  if (typeof window !== 'undefined' && window.I18N && typeof window.I18N.getZodiacPairDescriptionLocalized === 'function') {
    return window.I18N.getZodiacPairDescriptionLocalized(sign1, sign2, name1, name2, window.I18N.getLang());
  }

  const k1 = `${sign1}&${sign2}`;
  const k2 = `${sign2}&${sign1}`;
  
  let rawText = ZODIAC_PAIR_DESCRIPTIONS[k1] || ZODIAC_PAIR_DESCRIPTIONS[k2] || '';
  if (!rawText) return '';

  const n1 = (name1 && name1.trim()) || 'You';
  const n2 = (name2 && name2.trim()) || 'Partner';

  if (sign1 === sign2) {
    const combinedNames = `${n1} & ${n2}`;
    return replaceFirstSignName(rawText, sign1, combinedNames);
  }

  let replaced = replaceFirstSignName(rawText, sign1, n1);
  replaced = replaceFirstSignName(replaced, sign2, n2);

  return replaced;
}

function formatZodiacDescription(text) {
  if (!text) return '';
  if (typeof window !== 'undefined' && window.I18N && typeof window.I18N.formatZodiacDescriptionI18n === 'function') {
    return window.I18N.formatZodiacDescriptionI18n(text, window.I18N.getLang());
  }
  
  let formatted = text;
  if (formatted.includes('Not Good for Marriage:')) {
    formatted = formatted.replace(
      /Not Good for Marriage:\s*(.*)$/i,
      '<div style="margin-top:12px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.1);"><span style="display:inline-block; padding:2px 8px; border-radius:4px; font-size:0.8rem; font-weight:700; background:rgba(239,68,68,0.2); color:#f87171; margin-right:6px;">Not Good for Marriage</span> <span style="color:#e2e8f0;">$1</span></div>'
    );
  } else if (formatted.includes('Good for Marriage:')) {
    formatted = formatted.replace(
      /Good for Marriage:\s*(.*)$/i,
      '<div style="margin-top:12px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.1);"><span style="display:inline-block; padding:2px 8px; border-radius:4px; font-size:0.8rem; font-weight:700; background:rgba(16,185,129,0.2); color:#34d399; margin-right:6px;">Good for Marriage</span> <span style="color:#e2e8f0;">$1</span></div>'
    );
  } else if (formatted.includes('Conditional:')) {
    formatted = formatted.replace(
      /Conditional:\s*(.*)$/i,
      '<div style="margin-top:12px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.1);"><span style="display:inline-block; padding:2px 8px; border-radius:4px; font-size:0.8rem; font-weight:700; background:rgba(245,158,11,0.2); color:#fbbf24; margin-right:6px;">Conditional</span> <span style="color:#e2e8f0;">$1</span></div>'
    );
  }
  return formatted;
}

const ROLE_INFO = [
  {
    title: '"Me and my mirror"', symmetric: true, name: 'Reflection',
    roleDifference: 'Same signs',
    description: 'Frequent encounter of identical signs happens in youth. You easily read your partner as "your own person". It seems to you that no one understands you like you do. But the downside is that you also easily notice all your negative traits in each other. For mature partners, these relationships look more promising. Although with age, the probability of identical signs meeting becomes lower.',
  },
  {
    title: '"Best friend and worst enemy"', names: ['Best friend', 'Worst enemy'],
    roleDifference: 'Neighboring signs',
    description: 'Neighboring signs usually get along well. But your interaction in relationships is often unequal and self-serving. The exploited side is the "Best friend". Whereas the "Worst enemy" benefits from the relationship and in extreme stages uses the "Best friend" when they want, not the partner. As a result, the "Worst enemy" stops valuing the partner, and the "Best friend" discovers the lack of reciprocity.',
  },
  {
    title: '"Older sibling and younger sibling"', names: ['Younger sibling', 'Older sibling'],
    roleDifference: '+2 and -2 positions',
    description: 'A favorable combination of compatible element signs. It does not matter who plays which role - man or woman. The "Older sibling" is always ready to support, lend a shoulder and help the younger one out. The "Younger" is grateful for this and appreciates the wisdom in the older one, especially when you later see that the "Older" was right in past situations. Usually the "Younger" is more active, but can be capricious and show disobedience. The "Older" should show leniency in such cases.',
  },
  {
    title: '"Patron and advisor"', names: ['Patron', 'Advisor'],
    roleDifference: '+3 and -3 positions',
    description: 'These signs of elements so far apart find good business compatibility. Usually everything starts with this. And then it seems to you that the relationship can be developed deeper. The "Patron", as a rule, is more active and takes the initiative. They provide patronage to the advisor, sponsorship, give instructions, outline the big picture. The "Advisor" is good at analysis, assessment and plan implementation. But deep down, the "Advisor" feels their secondary role, as if they are backed into a corner and cannot find their own expression.',
  },
  {
    title: '"Child and parent / Student and teacher"', names: ['Child', 'Parent'],
    roleDifference: '+4 and -4 positions',
    description: 'An exemplary friendship and family pair of signs of the same element. Communication in the same language, foundation on the same values, goals and tools for achieving them are similar. Very strong unions provided you accept and fulfill your roles. The ideal option is when the man is in the role of "Parent / Teacher". If the woman turns out to be the "Parent", then she should realize and accept her partner in his role. Then she can be the "neck" for the head from the proverb. And the man will become a locomotive rushing at full speed.',
  },
  {
    title: '"Boa and rabbit"', names: ['Rabbit', 'Boa'],
    roleDifference: '+5 and -5 positions',
    description: 'A dangerous pair for the "Rabbit" if they fail to immediately read their "Boa" and avoid interaction. Many experienced "Rabbits" have exactly this happen. But a young "Rabbit" risks giving in to the almost hypnotic attraction of the "Boa" and falling into its trap. Let us admit that the "Boa" is not necessarily a hunter by nature - the peculiarity of this pair makes them so. For them, it might just be another amusement. And for the "Rabbit", given the depth of feelings that arise, it will turn into crushed hopes. Manipulation, illusions, suppression, domination - typical features of the final stretch of these relationships.',
  },
  {
    title: '"Opposites attract"', symmetric: true, malName: '"Yang"', femaleName: '"Yin"',
    roleDifference: 'diametrically opposed on the wheel',
    description: 'This bright and bubbling energy compatibility is not for young, fragile partners. Although it is in youth that you are so irresistibly drawn to each other. And you do not understand why: after all, you are so different, just like your compatible elements. In youth there is a risk of breaking hearts and leaving a mark for life. But how many prospects this pair has for mature, conscious partners. Complementing each other, supporting and enriching, deep dialogue. The brightest union in case of favorable unfolding.',
  },
];

function calcZodiacRoles(mDay, mMonth, fDay, fMonth, yourName, partnerName) {
  const mIdx = zodiacIndex(mDay, mMonth);
  const fIdx = zodiacIndex(fDay, fMonth);
  const m = ZODIAC_SIGNS[mIdx], f = ZODIAC_SIGNS[fIdx];
  const mPos = mIdx + 1, fPos = fIdx + 1;

  const rawDiff = Math.abs(mPos - fPos);
  const distance = Math.min(rawDiff, 12 - rawDiff);
  const info = ROLE_INFO[distance];

  let zodiacRoleMale, zodiacRoleFemale;
  if (distance === 0) {
    zodiacRoleMale = zodiacRoleFemale = info.name;
  } else if (distance === 6) {
    zodiacRoleMale = info.malName;
    zodiacRoleFemale = info.femaleName;
  } else {
    const maleAhead = (mPos - fPos + 12) % 12 === distance;
    zodiacRoleMale = maleAhead ? info.names[0] : info.names[1];
    zodiacRoleFemale = maleAhead ? info.names[1] : info.names[0];
  }

  const customDesc = getZodiacPairDescription(m.name, f.name, yourName, partnerName);

  return {
    zodiacRoleTitle: `${m.name} & ${f.name}`,
    zodiacRoleDifference: info.roleDifference,
    zodiacRoleMale,
    zodiacRoleFemale,
    zodiacRoleDescription: customDesc || info.description,
    zodiacPairText: customDesc,
    positions: [mPos, fPos, rawDiff],
  };
}

function calcZodiac(mDay, mMonth, fDay, fMonth, yourName, partnerName) {
  const mIdx = zodiacIndex(mDay, mMonth);
  const fIdx = zodiacIndex(fDay, fMonth);
  const m = ZODIAC_SIGNS[mIdx], f = ZODIAC_SIGNS[fIdx];

  return {
    zodiac_result_dates: { dayMale: mDay, monthMale: mMonth, dayFemale: fDay, monthFemale: fMonth },
    zodiac_result_signs: {
      zodiacSignMale: m.name, zodiacSignMaleAlt: false, zodiacElementMale: m.element,
      zodiacPeriodMale: m.period, zodiacUrlMale: m.url,
      zodiacSignFemale: f.name, zodiacSignFemaleAlt: false, zodiacElementFemale: f.element,
      zodiacPeriodFemale: f.period, zodiacUrlFemale: f.url,
      zodiacElementHarmony: elementHarmonyText(m.element, f.element),
    },
    zodiac_result_roles: calcZodiacRoles(mDay, mMonth, fDay, fMonth, yourName, partnerName),
  };
}

/* ============================================================
   TAROT ARCANA
   ============================================================ */

const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII'];

// Note: this site uses its own numbering (e.g. VIII = "Справедливость",
// XI = "Сила" — swapped vs. Rider-Waite-Smith), confirmed against live
// data for all 22 numbers.
const ARCANA = {
  1:  ['The Magician', 'Superpowers of a creator. Ideological inspirer. Intellect plus intuition. Hypnotic speaker. Karma catches up when leaving the path. Baggage of abandoned projects.'],
  2:  ['The High Priestess', 'Healers for the mind and soul. Rescuers. Intuitive. Family-oriented, caring, and sensitive. Can play the victim, see injustice towards themselves.'],
  3:  ['The Empress', 'Source of well-being and love, support for loved ones. Generosity. Temperament and activity. Danger of falling into selfish goals, materiality, sins.'],
  4:  ['The Emperor', 'Management, finance, and career. Practical. People of order. Try to spend time wisely. In the negative due to laziness, disorder, and the habit of only taking.'],
  5:  ['The Hierophant', 'Spiritual leadership. Guide for right decisions. Reliance on knowledge, traditions, and law. Gift of persuasion. Karma is affected by legal marriage and family.'],
  6:  ['The Lovers', 'Partnership and love. Win over with charisma and benevolence. Value beauty in everything. Fall into the negative due to the pursuit of pleasures.'],
  7:  ['The Chariot', 'High potential for realization. Ability to fall, get up and move forward. Courage. Ambitions. For truth. Laziness, cowardice, and stagnation are dangerous for them.'],
  8:  ['Justice', 'See the essence of things. Responsible and reliable. Decisive, as they are sure they are right. Bring everything into balance. Can suppress and complain about injustice.'],
  9:  ['The Hermit', 'Sages, philosophers, detached and as if from space. Not indifferent. Bring light. They need to manifest themselves to the world, not go into solitude, build the right connections.'],
  10: ['Wheel of Fortune', 'Tempting fate. In a positive manifestation, they are often lucky. Everything depends on goals and thoughts. They charge with excitement and lead away from failures. But can "play too much", losing everything and falling into debt.'],
  11: ['Strength', 'Strength is given to achieve goals, victories, manage and reveal people. Sees weak points in people, projects, and ideas. Loses strength with cowardice, aimlessness, aggression.'],
  12: ['The Hanged Man', 'Ideologically, but not literally, a "sacrifice" of themselves for others. Bring ideas, new views, salvation to the world. Can suffer from depression, addictions, burnout.'],
  13: ['Death', 'Destruction of the old to create the new. In themselves and in others. The path of crises and transformations. Overcome everything by overcoming fear. In fear they are weak, holding onto the past.'],
  14: ['Temperance', 'Intellect, sense of harmony and beauty. Often people of art. And even psychics. Heal the world with their energy. In the negative when fixated on the material.'],
  15: ['The Devil', 'Hypnotic energy. Passion. They see all the truth and lies of the world. On the bright path, everything comes easily to them. Can tempt others, but the world also tempts them.'],
  16: ['The Tower', 'Their path is to stand in the chaos of life, destroying old shackles and casting away negativity. Reborn anew, show the way to others. They are given the strength for this.'],
  17: ['The Star', 'Bright individuals, full of talents and ideas. Having realized themselves, they do not experience material problems. But the path to finding themselves is thorny.'],
  18: ['The Moon', 'Reality trans-surfers: their thoughts and dreams can materialize. They attract with mystery and a magical aura. Very dangerous on the dark path.'],
  19: ['The Sun', 'Their path is to shine for others, give warmth and energy. The more they give — the more they receive and become leaders. In egoism they can burn everything around.'],
  20: ['Judgement', 'Strong intuition. Information as if from space. Philosophical look. Conductors of the laws of the universe. In the negative: pride, fears, illusions.'],
  21: ['The World', 'The whole world is a home for them and all people are friends. Kind heart. Large-scale thinking and high goals. Without love for the world, they are conflicted, closed, blame everyone.'],
  22: ['The Fool', 'Eternally young and carefree. Inner freedom. Walk easily through life, giving joy to others. In the negative, unprincipled infants, losing meaning.'],
};

function calcArcana(day) {
  const num = day <= 22 ? day : day - 22;
  const [name, desc] = ARCANA[num];
  const dayLabel = num <= 9 ? `${num} и ${num + 22}` : `${num}`;
  const label = num <= 9 ? 'числа рождения' : 'число рождения';
  return { arcane: [name, ROMAN[num], dayLabel, label, desc] };
}

/* ============================================================
   LOVE SCENARIOS
   ============================================================ */

const MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const SCENARIO_TEXT = [
  'Value their freedom and goals above all. Do not gravitate towards relationships and do not attach themselves deeply to a partner. Can wait for the right time to break up and do it easily. It is better to remain friends with a partner so as not to spoil karma.',
  'Outwardly strong and independent of a partner, but internally need them. It is difficult for them to choose a worthy one who will agree to be second fiddle against the background of their radiance. Realize their ambitions through a partner, being a leader.',
  'In relationships like a fish in water. For them, this is a sphere of realization. Love their partner with all their heart. The state of falling in love gives them wings. It is difficult for them to remain faithful: they often flirt and accept signs of attention. Solved only through understanding risks.',
  'Realization and status are important to them. Self-realization and through promoting a partner, being their patron. Look for partners among the ambitious. Family and children are the highest value. Respect and the ability to appreciate each other are critical.',
  'Their relationship is like a romance novel. Their meetings are fateful. Every time is like the first. Which is why they overestimate their partner. Sometimes their relationship happens in secret from others. The main thing for them is to be honest with themselves and their beloved.',
  '"Want to talk?". Those who prefer to start with friendship. It is important to be on the same wavelength in communication with a partner. Common topics and interests are what holds them. Ideally, a partner from a common circle. But sociability leads to love triangles.',
  'The love energy of Venus. Romance, sensuality, beauty of courtship. But the foundation of everything is physical intimacy. Loss of passion means the end of love. They often have secret and obvious lovers. After all, they know how to attract with their charisma.',
  'Hostages of karmic relationships. Closely connected with a partner and seem intertwined. But love is often shrouded in illusions and can be unrequited. The owner of this energy can be devoted to one partner their whole life even after a breakup.',
  'Their relationship is always work. On themselves, on a partner, on common goals. The reward will be valuable. But you will have to learn discipline, limitations, and understanding. It is important to choose a partner not only with your heart, but also with your mind.',
  'Relationships full of fire. In the positive, this is passion and a hot loving heart. Sometimes even act as rescuers. In the negative: scandals, intrigues, and breaking dishes. There is a peculiarity: they want a bright partner who attracts the attention of others.',
];

function calcScenario(month) {
  // Only 10 unique scenarios exist. Months 11-12 wrap back and reuse
  // indices 1-2 (verified live: November -> scenario 1, same text as
  // February; December -> scenario 2, same text as March).
  const idx = month <= 10 ? month - 1 : month - 10;
  return {
    love_scenario: idx,
    love_month: MONTH_NAMES_EN[month - 1],
    love_text: SCENARIO_TEXT[idx],
  };
}

/* ============================================================
   CHAKRA BIORHYTHM COMPATIBILITY
   ============================================================ */

const CHAKRA_PERIODS = {
  physical: 23.69, emotional: 28.43, intellect: 33.16, heart: 37.90,
  creative: 42.64, intuitive: 47.38, highest: 52.11,
};

function calcChakra(mDateMs, fDateMs) {
  const datesDiff = Math.round(Math.abs(fDateMs - mDateMs) / 86400000);

  const chart = {};
  const labels = {};
  let compatCount = 0, dissonanceCount = 0;
  const compatibleKeys = [];

  // Use the exact reverse-engineered Triangle Wave formula for all chakras!
  // Val = 100 - (min(D % T, T - (D % T)) / (T / 2)) * 100
  for (const [key, T] of Object.entries(CHAKRA_PERIODS)) {
    const rem = datesDiff % T;
    const dist = Math.min(rem, T - rem);
    const val = Math.round(100 - (dist / (T / 2)) * 100);
    
    chart[key] = val;
    labels[`${key}-label`] = val >= 75 ? 'High' : (val <= 15 ? 'Low' : '');
    if (val >= 55) { compatCount++; compatibleKeys.push(key); }
    if (val < 20) dissonanceCount++;
  }

  const CLASS_MAP = {
    physical: 'circle-phyz', emotional: 'circle-emo', intellect: 'circle-intel',
    heart: 'circle-heart', creative: 'circle-creat', intuitive: 'circle-intuit', highest: 'circle-high',
  };

  // Exact Balance Formula reversed from the original API:
  const balanceMale = chart.physical + chart.intellect + chart.creative;
  const balanceFemale = chart.emotional + chart.heart + chart.intuitive;
  
  let balanceTotal = '';
  const balDiff = Math.abs(balanceMale - balanceFemale);
  if (balDiff <= 15) balanceTotal = 'Even balance';
  else if (balanceFemale > balanceMale) balanceTotal = '"Female" balance — favorable';
  else balanceTotal = '"Male" balance — favorable';

  // Override logic from original
  if (chart.physical < 40 && chart.emotional < 40 && chart.intellect < 40 && (chart.heart > 60 || chart.intuitive > 60)) {
     balanceTotal = 'High relationships (without the 3 lower chakras)';
  }

  return {
    bio_result_top: {
      datesDiff,
      totalCompatibility: `${compatCount} compatibilit${compatCount === 1 ? 'y' : 'ies'}`,
      totalDissonance: dissonanceCount === 0 ? 'No dissonances' : `${dissonanceCount} dissonance${dissonanceCount === 1 ? '' : 's'}`,
      chakreClasses: compatibleKeys.map(k => CLASS_MAP[k]),
    },
    bio_result_chart: chart,
    bio_result_chart_labels: labels,
    bio_result_balance: { balanceTotal, balanceFemale, balanceMale },
  };
}

/* ============================================================
   FATE & WILL CHART
   Only fate[0]/fate[1]/fate[6] are actually solved — cross-validated
   against 3 independent real data points spanning different years
   (day15/1990, day20/1985, day15/2000 all matched this day-only formula
   for those three indices). fate[2..5] were NOT solved: an early
   hypothesis assumed they were constant, but that turned out to be an
   artifact of testing only within year 2000 — real data shows they vary
   by year/month in a way we didn't crack. day<5 is an even less-tested
   edge case (the live API returns a 6-key object with a missing index
   there — see CLAUDE.md).

   will[] was never solved either, but a random sample of 37 live people
   showed will === fate exactly in ~77% of cases (27/35), so defaulting
   will = fate is a strictly better approximation than inventing a
   guaranteed-divergent formula. Treat this whole chart as
   decorative/approximate, not a validated reproduction.
   ============================================================ */

function calcFaw(day, month, year) {
  const base = day >= 5 ? 1 + Math.floor((day - 5) / 5) : 2 * day;
  const mid1 = day >= 5 ? 2 * ((day - 5) % 5) : 2;

  // fate[2..5]: unsolved — vary plausibly with month/year so the chart
  // isn't flatly wrong, but this is a guess, not a derived formula.
  const salt = digitSum(month * 7 + digitSum(year));
  const fate = [base, mid1, digitSum(salt + 2), digitSum(salt + 3), digitSum(salt + 4), digitSum(salt), base];

  return { fate, will: fate };
}

/* ============================================================
   TOP-LEVEL ENTRY POINT
   ============================================================ */

function calculateCompatibility(mDay, mMonth, mYear, fDay, fMonth, fYear, yourName, partnerName) {
  mDay = +mDay; mMonth = +mMonth; mYear = +mYear;
  fDay = +fDay; fMonth = +fMonth; fYear = +fYear;

  const mDateMs = Date.UTC(mYear, mMonth - 1, mDay);
  const fDateMs = Date.UTC(fYear, fMonth - 1, fDay);

  const chakra = calcChakra(mDateMs, fDateMs);
  const zodiac = calcZodiac(mDay, mMonth, fDay, fMonth, yourName, partnerName);

  const zDist = Math.min(zodiac.zodiac_result_roles.positions[2], 12 - zodiac.zodiac_result_roles.positions[2]);
  const isZodiacCompatible = (zDist === 0 || zDist === 2 || zDist === 4 || zDist === 6);
  const isSvadhistanaPass = chakra.bio_result_chart.emotional >= 60;
  const isAnahataPass = chakra.bio_result_chart.heart >= 60;
  const isGoodSex = chakra.bio_result_chart.physical >= 60;

  let finalVerdict = 'Not compatible as partners (Can be friends)';
  if (isZodiacCompatible && isSvadhistanaPass && isAnahataPass) {
    finalVerdict = 'Perfect Match';
    if (isGoodSex) finalVerdict += ' (Great Physical Chemistry!)';
  } else if (isZodiacCompatible && (isSvadhistanaPass || isAnahataPass)) {
    finalVerdict = 'Higher than Average compatibility';
  }

  const isPerfectMatch = isZodiacCompatible && isSvadhistanaPass && isAnahataPass;
  const isHigherAvg = isZodiacCompatible && ((!isAnahataPass && isSvadhistanaPass) || (isAnahataPass && !isSvadhistanaPass));
  
  let overallScore = 0;
  if (isPerfectMatch) {
    overallScore = Math.round((chakra.bio_result_chart.heart + chakra.bio_result_chart.emotional) / 2);
    if (overallScore < 70) {
      overallScore = Math.min(overallScore + 10, 100);
    }
  } else if (isHigherAvg) {
    overallScore = Math.round((chakra.bio_result_chart.heart + chakra.bio_result_chart.emotional) / 2);
  } else {
    overallScore = Math.round((Math.min(chakra.bio_result_chart.heart, chakra.bio_result_chart.emotional) + 0) / 2);
  }

  const mNum = calcNumerology(mDay, mMonth, mYear);
  const fNum = calcNumerology(fDay, fMonth, fYear);
  const pairNum = calcNumerologyPair(mNum, fNum);
  const mArcana = calcArcana(mDay);
  const fArcana = calcArcana(fDay);
  const mScenario = calcScenario(mMonth);
  const fScenario = calcScenario(fMonth);

  return {
    final_verdict: finalVerdict,
    overall_score: overallScore,
    bio_result_top: chakra.bio_result_top,
    bio_result_chart: chakra.bio_result_chart,
    bio_result_chart_labels: chakra.bio_result_chart_labels,
    bio_result_balance: chakra.bio_result_balance,

    zodiac_result_dates: zodiac.zodiac_result_dates,
    zodiac_result_signs: zodiac.zodiac_result_signs,
    zodiac_result_roles: zodiac.zodiac_result_roles,

    full_report: {
      maleNumerology: mNum,
      femaleNumerology: fNum,
      pairNumerology: pairNum,
      maleArcana: mArcana,
      femaleArcana: fArcana,
      maleScenario: mScenario,
      femaleScenario: fScenario,
    }
  };
}

function getClashTemplate(element1, element2, name1, name2) {
  if (typeof window !== 'undefined' && window.I18N && window.I18N.getLang() === 'ru' && typeof window.I18N.getClashTemplateRu === 'function') {
    return window.I18N.getClashTemplateRu(element1, element2, name1, name2);
  }

  const elementMap = {};
  elementMap[element1] = `${name1 || 'You'} (${element1})`;
  elementMap[element2] = `${name2 || 'Partner'} (${element2})`;
  
  const air = elementMap['Air'];
  const earth = elementMap['Earth'];
  const water = elementMap['Water'];
  const fire = elementMap['Fire'];
  
  const pairKey = [element1, element2].sort().join('-');
  
  if (pairKey === 'Air-Water') {
    return {
      title: `Elemental Alignment: ${air} & ${water} Mismatch`,
      note: `In astrology, when elements like Air and Water come together, it creates a fascinating contrast. ${air} operates in the realm of thoughts, logic, and perspective, while ${water} flows through emotions, intuition, and deep feeling. A low elemental match doesn't mean affection is missing—it just means you naturally process the world in very different languages.`,
      insights: [
        `<strong>Logic vs. Emotion:</strong> ${air} tends to analyze feelings to understand them, whereas ${water} needs to sit with and feel them deeply. This can lead to moments where one partner feels unheard and the other feels overwhelmed.`,
        `<strong>Need for Freedom vs. Need for Depth:</strong> ${air} thrives on movement, variety, and mental space, while ${water} seeks closeness, emotional security, and deep bonding.`,
        `<strong>The Atmospheric Effect:</strong> Just like in nature, Air over Water can create unpredictable weather—ranging from light breezes of inspiration to turbulent emotional storms if expectations aren't managed carefully.`
      ],
      meaning: `An elemental clash means your relationship operates on a dynamic where balance requires constant, deliberate calibration.`,
      meaningIntro: `An elemental clash means your relationship operates on a dynamic where balance requires constant, deliberate calibration.`,
      path1Title: `1. Navigating the Challenging Currents`,
      path1Intro: `If you choose to build on this connection, be prepared for specific recurring dynamics:`,
      path1Points: [
        `<strong>High Emotional Heavy-Lifting:</strong> Bridging the gap between ${air}'s intellectual detachment and ${water}'s emotional depth takes immense patience, frequent translation, and deep compromise.`,
        `<strong>Risk of Exhaustion:</strong> ${water} may sometimes feel ${air} is too distant or rational, while ${air} may feel ${water} is too intense or changeable. Without high emotional maturity, this constant adjustment can feel draining over time.`
      ],
      path2Title: `2. Looking at the Bigger Picture`,
      path2Intro: `While opposites can occasionally challenge each other to grow, true astrological harmony shouldn't feel like a constant struggle:`,
      path2Points: [
        `<strong>You Deserve Natural Resonant Energy:</strong> Relationships feel most nourishing when your primary element finds its natural home.`,
        `<strong>A Vast Cosmos Out There:</strong> In the wider world of connections, there are partners whose elemental nature naturally nurtures yours—where ${water} finds grounding Earth or deep Water, and ${air} finds inspiring Fire or clear Air. You deserve a connection where your authentic nature is naturally understood without needing to constantly adapt who you are.`
      ],
      nextSteps: `Take this insight as an opportunity for honest reflection. Ask yourselves if this partnership offers the natural ease and alignment you desire, or if the energy required to bridge your elemental differences is taking away from your personal peace.`
    };
  }

  if (pairKey === 'Air-Earth') {
    return {
      title: `Elemental Alignment: ${air} & ${earth} Mismatch`,
      note: `In astrology, combining Air and Earth brings together two completely different approaches to life. ${air} thrives on concepts, ideas, spontaneous communication, and change, while ${earth} is rooted in stability, practical results, routine, and tangible security. A low elemental score simply means your core motivations and paces naturally diverge.`,
      insights: [
        `<strong>Mind vs. Matter:</strong> ${air} lives in the realm of 'what could be,' constantly seeking new perspectives and mental stimulation. ${earth} lives in the realm of 'what is,' focusing on tangible reality, structure, and physical outcomes.`,
        `<strong>Speed & Rhythm:</strong> ${air} moves fast, adapts quickly, and can change direction on a whim. ${earth} moves deliberately, values consistency, and needs time to process and build before committing to a change.`,
        `<strong>The Atmospheric Effect:</strong> In nature, too much Air can stir up dust storms, while solid Earth can feel immobile to the wind. In a relationship, ${air} may view ${earth} as overly rigid or stubborn, while ${earth} may see ${air} as unpredictable, flighty, or impractical.`
      ],
      meaning: `When Air and Earth join forces, the dynamic often feels like trying to anchor a breeze or fly a heavy kite—it requires deliberate effort to keep from pulling in opposite directions.`,
      meaningIntro: `When Air and Earth join forces, the dynamic often feels like trying to anchor a breeze or fly a heavy kite—it requires deliberate effort to keep from pulling in opposite directions.`,
      path1Title: `1. Navigating the Challenging Landscape`,
      path1Intro: `Building a lasting bond here means navigating specific foundational differences:`,
      path1Points: [
        `<strong>Heavy Compromise on Pace:</strong> ${air} will need to slow down and offer concrete reassurance, while ${earth} will need to step out of your comfort zone to embrace flexibility and spontaneous ideas.`,
        `<strong>Communication Friction:</strong> Discussions can easily stall when ${air} wants to talk through abstract possibilities and ${earth} just wants to know the practical bottom line. Bridging this gap requires continuous patience and translation.`,
      ],
      path2Title: `2. Looking at the Bigger Picture`,
      path2Intro: `While ${earth} can offer ${air} a soft place to land and ${air} can bring fresh energy to ${earth}, maintaining this balance can take a lot of heavy lifting:`,
      path2Points: [
        `<strong>You Deserve Natural Flow:</strong> Love is meant to support you, not feel like an ongoing project where you constantly have to adjust your natural pace and priorities.`,
        `<strong>A Vast Cosmos Out There:</strong> There are countless people in the world whose elemental nature naturally matches yours. ${air} thrives effortlessly alongside Fire's passion or another Air's intellect; ${earth} finds deep, natural comfort with Water's emotional depth or another Earth's grounded stability. You both deserve a partnership that feels like home without requiring you to sacrifice your fundamental nature.`
      ],
      nextSteps: `Reflect on what you need most in a relationship right now. Use this report to consider whether adjusting to these elemental differences feels inspiring, or if it is taking too much effort to keep your worlds aligned.`
    };
  }

  if (pairKey === 'Fire-Water') {
    return {
      title: `Elemental Alignment: ${water} & ${fire} Mismatch`,
      note: `In astrology, Water and Fire form one of the most intense and volatile combinations. ${fire} is driven by passion, direct action, enthusiasm, and impulse, while ${water} navigates the world through deep emotions, intuition, sensitivity, and quiet connection. A low elemental score means your natural energies can easily overwhelm or extinguish one another.`,
      insights: [
        `<strong>Emotion vs. Impulse:</strong> ${fire} acts quickly on gut instincts and desires immediate momentum, whereas ${water} needs time to process feelings, feel emotionally safe, and move at a gentler pace.`,
        `<strong>Sensitivity & Directness:</strong> ${fire}’s bold, straightforward nature can inadvertently sting or overwhelm ${water}'s deeply sensitive radar. Conversely, ${water}’s emotional mood shifts or need for reassurance can feel restrictive or confusing to ${fire}’s independent spirit.`,
        `<strong>The Atmospheric Effect:</strong> In nature, Water can extinguish Fire's natural spark, while Fire can bring Water to a scalding boil. In a relationship, this often translates to a cycle of intense passion followed by emotional burnout or frustration.`
      ],
      meaning: `When Water and Fire try to blend, the relationship dynamic often feels like managing steam—it generates high heat and drama, but keeping that energy constructive requires constant management.`,
      meaningIntro: `When Water and Fire try to blend, the relationship dynamic often feels like managing steam—it generates high heat and drama, but keeping that energy constructive requires constant management.`,
      path1Title: `1. Navigating the Turbulent Waters`,
      path1Intro: `Sustaining this connection long-term requires awareness of these recurring challenges:`,
      path1Points: [
        `<strong>Continuous Emotional Balancing:</strong> ${fire} must practice extreme patience and softness to avoid hurting ${water}, while ${water} must learn not to take ${fire}’s intense, blunt energy personally.`,
        `<strong>High Energy Consumption:</strong> Balancing these opposing forces takes tremendous emotional heavy-lifting. Without active, conscious compromise, the relationship can easily drift between emotional distance and heated misunderstandings.`
      ],
      path2Title: `2. Looking at the Bigger Picture`,
      path2Intro: `While the spark between Water and Fire can feel hypnotic at first, true emotional alignment shouldn't demand that you constantly sacrifice your inner peace:`,
      path2Points: [
        `<strong>You Deserve Natural Harmony:</strong> A great connection should feel like a safe harbor, not an unpredictable storm where you are constantly adjusting your temperature to keep the peace.`,
        `<strong>A Vast Cosmos Out There:</strong> The world is full of people whose elemental nature naturally complements yours. ${water} finds deep, effortless understanding with Earth's grounding stability or another Water sign's empathy; ${fire} thrives wildly with Air's inspiring intellect or another Fire sign's shared passion. You both deserve a relationship where your core identity is naturally celebrated, not constantly suppressed.`
      ],
      nextSteps: `Take a moment to check in with yourself. Use this report to evaluate whether navigating this high-intensity dynamic brings genuine fulfillment, or if it is draining the energy you need to thrive.`
    };
  }

  if (pairKey === 'Earth-Fire') {
    return {
      title: `Elemental Alignment: ${fire} & ${earth} Mismatch`,
      note: `In astrology, Fire and Earth bring together two very different foundational energies. ${fire} is propelled by inspiration, bold risks, immediate action, and passion, while ${earth} relies on careful planning, stability, practical results, and routine. A low elemental score highlights a fundamental difference in how you approach life's pace, goals, and daily momentum.`,
      insights: [
        `<strong>Impulse vs. Caution:</strong> ${fire} wants to leap first and figure out the details later, thriving on excitement and change. ${earth} prefers to measure twice, build step-by-step, and minimize risk before taking action.`,
        `<strong>Passion vs. Practicality:</strong> ${fire} expresses affection and drive through grand gestures, high energy, and enthusiasm. ${earth} shows love and security through tangible reliability, consistency, and practical support.`,
        `<strong>The Atmospheric Effect:</strong> In nature, Fire can scorch Earth if it burns too fast, while heavy Earth can smother Fire’s flame. In a relationship, ${fire} may begin to feel constrained or bored by ${earth}'s routine, while ${earth} may feel stressed or destabilized by ${fire}'s unpredictability.`
      ],
      meaning: `Blending Fire and Earth often feels like trying to build a bonfire on moving terrain—it takes constant, deliberate structure to keep the flame burning without consuming the foundation.`,
      meaningIntro: `Blending Fire and Earth often feels like trying to build a bonfire on moving terrain—it takes constant, deliberate structure to keep the flame burning without consuming the foundation.`,
      path1Title: `1. Navigating the Challenging Terrain`,
      path1Intro: `Sustaining harmony between these elements requires working through specific foundational differences:`,
      path1Points: [
        `<strong>Pacing & Priority Compromises:</strong> ${fire} will need to practice patience and respect ${earth}'s need for time and safety, while ${earth} will need to step out of your comfort zone to allow room for ${fire}'s spontaneous sparks.`,
        `<strong>Friction Around Friction Points:</strong> Long-term decisions—like finances, lifestyle changes, or daily routines—can easily become battlegrounds between ${fire}’s desire for immediate freedom and ${earth}’s need for careful security.`
      ],
      path2Title: `2. Looking at the Bigger Picture`,
      path2Intro: `While ${earth} can offer ${fire} a solid foundation to build upon and ${fire} can inspire ${earth} to aim higher, keeping this dynamic balanced requires ongoing, heavy emotional lifting:`,
      path2Points: [
        `<strong>You Deserve Natural Resonant Energy:</strong> Love should feel like a supportive wind at your back, not a constant tug-of-war between moving forward and standing still.`,
        `<strong>A Vast Cosmos Out There:</strong> There are countless people in the world whose elemental nature naturally moves at your speed. ${fire} ignites effortlessly alongside Air's quick intellect or another Fire sign's shared passion; ${earth} finds deep, peaceful harmony with Water's emotional depth or another Earth sign's grounded stability. You both deserve a connection where your natural tempo is embraced, not held back or rushed.`
      ],
      nextSteps: `Reflect on what you need most to feel secure and fulfilled. Use this report to consider whether adjusting to these elemental differences inspires genuine growth, or if it demands more compromise than feels healthy for your long-term peace.`
    };
  }

  return null;
}

const CLASH_TEXTS = {
  'Air-Water': getClashTemplate('Air', 'Water', 'Air', 'Water'),
  'Air-Earth': getClashTemplate('Air', 'Earth', 'Air', 'Earth'),
  'Fire-Water': getClashTemplate('Fire', 'Water', 'Fire', 'Water'),
  'Earth-Fire': getClashTemplate('Earth', 'Fire', 'Earth', 'Fire'),
};
