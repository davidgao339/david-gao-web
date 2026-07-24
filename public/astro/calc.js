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
const ROLE_INFO = [
  {
    title: '"Me and my mirror"', symmetric: true, name: 'Reflection',
    roleDifference: 'Same signs',
    description: 'Frequent encounter of identical signs happens in youth. They easily read their partner as "their own person". It seems to them that no one understands them like they do. But the downside is that they also easily notice all their negative traits in each other. For mature partners, these relationships look more promising. Although with age, the probability of identical signs meeting becomes lower.',
  },
  {
    title: '"Best friend and worst enemy"', names: ['Best friend', 'Worst enemy'],
    roleDifference: 'Neighboring signs',
    description: 'Neighboring signs usually get along well. But their interaction in relationships is often unequal and self-serving. The exploited side is the "Best friend". Whereas the "Worst enemy" benefits from the relationship and in extreme stages uses the "Best friend" when they want, not the partner. As a result, the "Worst enemy" stops valuing the partner, and the "Best friend" discovers the lack of reciprocity.',
  },
  {
    title: '"Older sibling and younger sibling"', names: ['Younger sibling', 'Older sibling'],
    roleDifference: '+2 and -2 positions',
    description: 'A favorable combination of compatible element signs. It does not matter who plays which role - man or woman. The "Older sibling" is always ready to support, lend a shoulder and help the younger one out. The "Younger" is grateful for this and appreciates the wisdom in the older one, especially when they later see that the "Older" was right in past situations. Usually the "Younger" is more active, but can be capricious and show disobedience. The "Older" should show leniency in such cases.',
  },
  {
    title: '"Patron and advisor"', names: ['Patron', 'Advisor'],
    roleDifference: '+3 and -3 positions',
    description: 'These signs of elements so far apart find good business compatibility. Usually everything starts with this. And then it seems to them that the relationship can be developed deeper. The "Patron", as a rule, is more active and takes the initiative. They provide patronage to the advisor, sponsorship, give instructions, outline the big picture. The "Advisor" is good at analysis, assessment and plan implementation. But deep down, the "Advisor" feels their secondary role, as if they are backed into a corner and cannot find their own expression.',
  },
  {
    title: '"Child and parent / Student and teacher"', names: ['Child', 'Parent'],
    roleDifference: '+4 and -4 positions',
    description: 'An exemplary friendship and family pair of signs of the same element. Communication in the same language, foundation on the same values, goals and tools for achieving them are similar. Very strong unions provided they accept and fulfill their roles. The ideal option is when the man is in the role of "Parent / Teacher". If the woman turns out to be the "Parent", then she should realize and accept her partner in his role. Then she can be the "neck" for the head from the proverb. And the man will become a locomotive rushing at full speed.',
  },
  {
    title: '"Boa and rabbit"', names: ['Rabbit', 'Boa'],
    roleDifference: '+5 and -5 positions',
    description: 'A dangerous pair for the "Rabbit" if they fail to immediately read their "Boa" and avoid interaction. Many experienced "Rabbits" have exactly this happen. But a young "Rabbit" risks giving in to the almost hypnotic attraction of the "Boa" and falling into its trap. Let us admit that the "Boa" is not necessarily a hunter by nature - the peculiarity of this pair makes them so. For them, it might just be another amusement. And for the "Rabbit", given the depth of feelings that arise, it will turn into crushed hopes. Manipulation, illusions, suppression, domination - typical features of the final stretch of these relationships.',
  },
  {
    title: '"Opposites attract"', symmetric: true, malName: '"Yang"', femaleName: '"Yin"',
    roleDifference: 'diametrically opposed on the wheel',
    description: 'This bright and bubbling energy compatibility is not for young, fragile partners. Although it is in youth that they are so irresistibly drawn to each other. And they do not understand why: after all, they are so different, just like their compatible elements. In youth there is a risk of breaking hearts and leaving a mark for life. But how many prospects this pair has for mature, conscious partners. Complementing each other, supporting and enriching, deep dialogue. The brightest union in case of favorable unfolding.',
  },
];

function calcZodiacRoles(mDay, mMonth, fDay, fMonth) {
  const mIdx = zodiacIndex(mDay, mMonth);
  const fIdx = zodiacIndex(fDay, fMonth);
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

  return {
    zodiacRoleTitle: info.title,
    zodiacRoleDifference: info.roleDifference,
    zodiacRoleMale,
    zodiacRoleFemale,
    zodiacRoleDescription: info.description,
    zodiacPairText: `The union of ${ZODIAC_SIGNS[mIdx].name} and ${ZODIAC_SIGNS[fIdx].name} is a combination of ${info.title}. ${info.description}`,
    positions: [mPos, fPos, rawDiff],
  };
}

function calcZodiac(mDay, mMonth, fDay, fMonth) {
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
    zodiac_result_roles: calcZodiacRoles(mDay, mMonth, fDay, fMonth),
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

function calculateCompatibility(mDay, mMonth, mYear, fDay, fMonth, fYear) {
  mDay = +mDay; mMonth = +mMonth; mYear = +mYear;
  fDay = +fDay; fMonth = +fMonth; fYear = +fYear;

  const mDateMs = Date.UTC(mYear, mMonth - 1, mDay);
  const fDateMs = Date.UTC(fYear, fMonth - 1, fDay);

  const chakra = calcChakra(mDateMs, fDateMs);
  const zodiac = calcZodiac(mDay, mMonth, fDay, fMonth);

  const zDist = Math.min(zodiac.zodiac_result_roles.positions[2], 12 - zodiac.zodiac_result_roles.positions[2]);
  const isZodiacCompatible = (zDist === 0 || zDist === 2 || zDist === 4 || zDist === 6);
  const isSvadhistanaPass = chakra.bio_result_chart.emotional > 60;
  const isAnahataPass = chakra.bio_result_chart.heart > 60;
  const isGoodSex = chakra.bio_result_chart.physical > 60;

  let finalVerdict = 'Not compatible as partners (Can be friends)';
  if (isZodiacCompatible && isSvadhistanaPass && isAnahataPass) {
    finalVerdict = 'Perfect Match';
    if (isGoodSex) finalVerdict += ' (Great Physical Chemistry!)';
  } else if (isZodiacCompatible || isSvadhistanaPass || isAnahataPass) {
    finalVerdict = 'Not compatible as partners (Can be friends)';
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

const CLASH_TEXTS = {
  'Air-Water': {
    title: 'Elemental Alignment: Air & Water Mismatch',
    note: "In astrology, when elements like Air and Water come together, it creates a fascinating contrast. Air operates in the realm of thoughts, logic, and perspective, while Water flows through emotions, intuition, and deep feeling. A low elemental match doesn't mean affection is missing—it just means you naturally process the world in very different languages.",
    insights: [
      "<strong>Logic vs. Emotion:</strong> Air tends to analyze feelings to understand them, whereas Water needs to sit with and feel them deeply. This can lead to moments where one partner feels unheard and the other feels overwhelmed.",
      "<strong>Need for Freedom vs. Need for Depth:</strong> Air thrives on movement, variety, and mental space, while Water seeks closeness, emotional security, and deep bonding.",
      "<strong>The Atmospheric Effect:</strong> Just like in nature, Air over Water can create unpredictable weather—ranging from light breezes of inspiration to turbulent emotional storms if expectations aren't managed carefully."
    ],
    meaningIntro: "An elemental clash means your relationship operates on a dynamic where balance requires constant, deliberate calibration.",
    path1Title: "1. Navigating the Challenging Currents",
    path1Intro: "If you choose to build on this connection, be prepared for specific recurring dynamics:",
    path1Points: [
      "<strong>High Emotional Heavy-Lifting:</strong> Bridging the gap between intellectual detachment (Air) and emotional depth (Water) takes immense patience, frequent translation, and deep compromise.",
      "<strong>Risk of Exhaustion:</strong> Water may sometimes feel Air is too distant or rational, while Air may feel Water is too intense or changeable. Without high emotional maturity, this constant adjustment can feel draining over time."
    ],
    path2Title: "2. Looking at the Bigger Picture",
    path2Intro: "While opposites can occasionally challenge each other to grow, true astrological harmony shouldn't feel like a constant struggle:",
    path2Points: [
      "<strong>You Deserve Natural Resonant Energy:</strong> Relationships feel most nourishing when your primary element finds its natural home.",
      "<strong>A Vast Cosmos Out There:</strong> In the wider world of connections, there are partners whose elemental nature naturally nurtures yours—where Water finds grounding Earth or deep Water, and Air finds inspiring Fire or clear Air. You deserve a connection where your authentic nature is naturally understood without needing to constantly adapt who you are."
    ],
    nextSteps: "Take this insight as an opportunity for honest reflection. Ask yourselves if this partnership offers the natural ease and alignment you desire, or if the energy required to bridge your elemental differences is taking away from your personal peace."
  },
  'Air-Earth': {
    title: 'Elemental Alignment: Air & Earth Mismatch',
    note: "In astrology, combining Air and Earth brings together two completely different approaches to life. Air thrives on concepts, ideas, spontaneous communication, and change, while Earth is rooted in stability, practical results, routine, and tangible security. A low elemental score simply means your core motivations and paces naturally diverge.",
    insights: [
      "<strong>Mind vs. Matter:</strong> Air lives in the realm of 'what could be,' constantly seeking new perspectives and mental stimulation. Earth lives in the realm of 'what is,' focusing on tangible reality, structure, and physical outcomes.",
      "<strong>Speed & Rhythm:</strong> Air moves fast, adapts quickly, and can change direction on a whim. Earth moves deliberately, values consistency, and needs time to process and build before committing to a change.",
      "<strong>The Atmospheric Effect:</strong> In nature, too much Air can stir up dust storms, while solid Earth can feel immobile to the wind. In a relationship, Air may view Earth as overly rigid or stubborn, while Earth may see Air as unpredictable, flighty, or impractical."
    ],
    meaningIntro: "When Air and Earth join forces, the dynamic often feels like trying to anchor a breeze or fly a heavy kite—it requires deliberate effort to keep from pulling in opposite directions.",
    path1Title: "1. Navigating the Challenging Landscape",
    path1Intro: "Building a lasting bond here means navigating specific foundational differences:",
    path1Points: [
      "<strong>Heavy Compromise on Pace:</strong> Air will need to slow down and offer concrete reassurance, while Earth will need to step out of its comfort zone to embrace flexibility and spontaneous ideas.",
      "<strong>Communication Friction:</strong> Discussions can easily stall when Air wants to talk through abstract possibilities and Earth just wants to know the practical bottom line. Bridging this gap requires continuous patience and translation."
    ],
    path2Title: "2. Looking at the Bigger Picture",
    path2Intro: "While Earth can offer Air a soft place to land and Air can bring fresh energy to Earth, maintaining this balance can take a lot of heavy lifting:",
    path2Points: [
      "<strong>You Deserve Natural Flow:</strong> Love is meant to support you, not feel like an ongoing project where you constantly have to adjust your natural pace and priorities.",
      "<strong>A Vast Cosmos Out There:</strong> There are countless people in the world whose elemental nature naturally matches yours. Air thrives effortlessly alongside Fire's passion or another Air's intellect; Earth finds deep, natural comfort with Water's emotional depth or another Earth's grounded stability. You both deserve a partnership that feels like home without requiring you to sacrifice your fundamental nature."
    ],
    nextSteps: "Reflect on what you need most in a relationship right now. Use this report to consider whether adjusting to these elemental differences feels inspiring, or if it is taking too much effort to keep your worlds aligned."
  },
  'Fire-Water': {
    title: 'Elemental Alignment: Water & Fire Mismatch',
    note: "In astrology, Water and Fire form one of the most intense and volatile combinations. Fire is driven by passion, direct action, enthusiasm, and impulse, while Water navigates the world through deep emotions, intuition, sensitivity, and quiet connection. A low elemental score means your natural energies can easily overwhelm or extinguish one another.",
    insights: [
      "<strong>Emotion vs. Impulse:</strong> Fire acts quickly on gut instincts and desires immediate momentum, whereas Water needs time to process feelings, feel emotionally safe, and move at a gentler pace.",
      "<strong>Sensitivity & Directness:</strong> Fire’s bold, straightforward nature can inadvertently sting or overwhelm Water's deeply sensitive radar. Conversely, Water’s emotional mood shifts or need for reassurance can feel restrictive or confusing to Fire’s independent spirit.",
      "<strong>The Atmospheric Effect:</strong> In nature, Water can extinguish Fire's natural spark, while Fire can bring Water to a scalding boil. In a relationship, this often translates to a cycle of intense passion followed by emotional burnout or frustration."
    ],
    meaningIntro: "When Water and Fire try to blend, the relationship dynamic often feels like managing steam—it generates high heat and drama, but keeping that energy constructive requires constant management.",
    path1Title: "1. Navigating the Turbulent Waters",
    path1Intro: "Sustaining this connection long-term requires awareness of these recurring challenges:",
    path1Points: [
      "<strong>Continuous Emotional Balancing:</strong> Fire must practice extreme patience and softness to avoid hurting Water, while Water must learn not to take Fire’s intense, blunt energy personally.",
      "<strong>High Energy Consumption:</strong> Balancing these opposing forces takes tremendous emotional heavy-lifting. Without active, conscious compromise, the relationship can easily drift between emotional distance and heated misunderstandings."
    ],
    path2Title: "2. Looking at the Bigger Picture",
    path2Intro: "While the spark between Water and Fire can feel hypnotic at first, true emotional alignment shouldn't demand that you constantly sacrifice your inner peace:",
    path2Points: [
      "<strong>You Deserve Natural Harmony:</strong> A great connection should feel like a safe harbor, not an unpredictable storm where you are constantly adjusting your temperature to keep the peace.",
      "<strong>A Vast Cosmos Out There:</strong> The world is full of people whose elemental nature naturally complements yours. Water finds deep, effortless understanding with Earth's grounding stability or another Water sign's empathy; Fire thrives wildly with Air's inspiring intellect or another Fire sign's shared passion. You both deserve a relationship where your core identity is naturally celebrated, not constantly suppressed."
    ],
    nextSteps: "Take a moment to check in with yourself. Use this report to evaluate whether navigating this high-intensity dynamic brings genuine fulfillment, or if it is draining the energy you need to thrive."
  },
  'Earth-Fire': {
    title: 'Elemental Alignment: Fire & Earth Mismatch',
    note: "In astrology, Fire and Earth bring together two very different foundational energies. Fire is propelled by inspiration, bold risks, immediate action, and passion, while Earth relies on careful planning, stability, practical results, and routine. A low elemental score highlights a fundamental difference in how you approach life's pace, goals, and daily momentum.",
    insights: [
      "<strong>Impulse vs. Caution:</strong> Fire wants to leap first and figure out the details later, thriving on excitement and change. Earth prefers to measure twice, build step-by-step, and minimize risk before taking action.",
      "<strong>Passion vs. Practicality:</strong> Fire expresses affection and drive through grand gestures, high energy, and enthusiasm. Earth shows love and security through tangible reliability, consistency, and practical support.",
      "<strong>The Atmospheric Effect:</strong> In nature, Fire can scorch Earth if it burns too fast, while heavy Earth can smother Fire’s flame. In a relationship, Fire may begin to feel constrained or bored by Earth's routine, while Earth may feel stressed or destabilized by Fire's unpredictability."
    ],
    meaningIntro: "Blending Fire and Earth often feels like trying to build a bonfire on moving terrain—it takes constant, deliberate structure to keep the flame burning without consuming the foundation.",
    path1Title: "1. Navigating the Challenging Terrain",
    path1Intro: "Sustaining harmony between these elements requires working through specific foundational differences:",
    path1Points: [
      "<strong>Pacing & Priority Compromises:</strong> Fire will need to practice patience and respect Earth's need for time and safety, while Earth will need to step out of its comfort zone to allow room for Fire's spontaneous sparks.",
      "<strong>Friction Around Friction Points:</strong> Long-term decisions—like finances, lifestyle changes, or daily routines—can easily become battlegrounds between Fire’s desire for immediate freedom and Earth’s need for careful security."
    ],
    path2Title: "2. Looking at the Bigger Picture",
    path2Intro: "While Earth can offer Fire a solid foundation to build upon and Fire can inspire Earth to aim higher, keeping this dynamic balanced requires ongoing, heavy emotional lifting:",
    path2Points: [
      "<strong>You Deserve Natural Resonant Energy:</strong> Love should feel like a supportive wind at your back, not a constant tug-of-war between moving forward and standing still.",
      "<strong>A Vast Cosmos Out There:</strong> There are countless people in the world whose elemental nature naturally moves at your speed. Fire ignites effortlessly alongside Air's quick intellect or another Fire sign's shared passion; Earth finds deep, peaceful harmony with Water's emotional depth or another Earth sign's grounded stability. You both deserve a connection where your natural tempo is embraced, not held back or rushed."
    ],
    nextSteps: "Reflect on what you need most to feel secure and fulfilled. Use this report to consider whether adjusting to these elemental differences inspires genuine growth, or if it demands more compromise than feels healthy for your long-term peace."
  }
};
