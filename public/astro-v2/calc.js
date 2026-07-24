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
  1: ['Солнце', 'Царь', 'Лидерство, сила духа, целеустремленность, один в поле воин, уверенность, экспансия', 'Агрессия, эгоизм, неприятие чужого мнения, твердолобость, ЧСВ, наставления другим', 'Верные, если рядом «лучший» партнер в их понимании, который умеет проявлять уважение и ценить их.'],
  2: ['Луна', 'Дипломат', 'Партнерство, дружелюбие, доверие, вежливость, понимание деталей, гармония, чуткость', 'Сомнения, депрессия, неумение отказать, ношение внешней «маски», страдания', 'Верные, если находятся под контролем. Часто не могут найти силы для отказа предложениям извне.'],
  3: ['Юпитер', 'Главбух', 'Мозг-нейросеть, анализ, расчет, знания, трезвый взгляд, надежность, забота, самовыражение', 'Поступки из выгоды, хитрость, советы всем вокруг, «душнила», лудомания', 'Верные, т.к. живут больше разумом, чем чувствами. Могут быть холодны и к партнеру.'],
  4: ['Раху', 'Оппозиция', 'Генерация идей, практичность, постановка целей, вдохновение, созидательность', 'Разрушение, роль «жертвы», критика, мошенничество, неудовлетворенность', 'Риск измен, если в минусе — неудовлетворены, всегда мало. Умеют вести двойную игру с честными глазами.'],
  5: ['Меркурий', 'Бизнесмен', 'Коммуникации, деловой склад, интеллект, гибкость змеи, изобретательность, адекватность', 'Потеря фокуса, болтовня, двуличность, холодность, эмоциональная уязвимость, обман', 'Верные, если погружены в свои проекты. Иначе бывают мимолетные связи без разбора.'],
  6: ['Венера', 'Гедонист', 'Любовь к жизни и людям, наслаждения, красота, комфорт, мудрость, доброе сердце, творчество', 'Зависимости, соблазны, аморальность, лень, мелочность, хандра, истерики', 'Любвеобильны, могут иметь несколько партнеров в разных ролях. Идут на все ради страсти.'],
  7: ['Кету', 'Просвещенный', 'Талант, гениальность, звездность, свой взгляд на вещи, амбиции, преодоление, темперамент', 'Непризнанность, неверие в себя, кризисы, хаос в себе и для ближних, звездная болезнь', 'Самая сильная любовная энергетика. Часто в фоновом поиске новых экспериментов.'],
  8: ['Сатурн', 'Директор завода', 'Работа на результат, капитал, воля, управление людьми и ресурсами, дисциплина, системность', 'Жадность, бездуховность, нечуткость, пессимизм, жизнь прошлым, уход из социума', 'Верные, если между партнерами настоящая любовь. Если не находят ее, то могут оставаться одиночками.'],
  9: ['Марс', 'Воин', 'Борец за все хорошее, помощь ближним, созидание, сильная психика, принципы, продуктивность', 'Слив энергии, болезни психики, отвержение, материализм, неоцененность', 'В целом семейные. Но прежде могут долго перебирать партнеров. Им нужен такой же темпераментный.'],
};

// consDoubleEnergy: keyed by "d1+d2" (tens digit + ones digit, in that
// order) of a two-digit birth day — populated only when day >= 10.
const CONS_DOUBLE_ENERGY = {
  '1+0': ['Через энергии 1 и 0', 'Лидер с дополнительным нулем: либо усиление, либо обнуление. В плюсе опережает всех конкурентов на милю. В минусе рушит проекты.'],
  '1+1': ['Через энергии 1 и 1', 'Партнерство через две лидерские единицы («11»). В плюсе инициаторы и покровители для партнеров. В минусе эгоисты и одиночки. '],
  '1+2': ['Через энергии 1 и 2', 'В плюсе мудрый, понимающий («2») и инициативный лидер («1») в своем кругу. В минусе считающий себя самым умным эгоист и страдалец.'],
  '1+3': ['Через энергии 1 и 3', 'Идейность с лидерством («1»), интеллектом («3») и заботой в плюсе. В минусе надо прокачать понимание, отбросить критику и самомнение.'],
  '1+4': ['Через энергии 1 и 4', 'Самостоятельный волевой («1») креатор («4»), знающий свое дело и цели. В минусе эмоционально нестабилен, обидчив и жаждет признания.'],
  '1+5': ['Через энергии 1 и 5', 'Возможность реализация творчества как бизнеса («5») через волю («1») и коммуникации. В минусе придется преодолеть соблазны, обиды и эгозим.'],
  '1+6': ['Через энергии 1 и 6', 'Жизнь даст им все, если они укрепят волю («1»), разовьют мудрость («6») и творчество. Иначе риск стать эгоистом, ищущим только наслаждения.'],
  '1+7': ['Через энергии 1 и 7', 'Гений и звезда («7») с волевыми качествами («1»). Успех придет за счет труда и системности. Риск лежит в хаосе, кризисах и раздутом эго.'],
  '1+8': ['Через энергии 1 и 8', 'Воля («1»), системность и трудолюбие («8») укрепляют основную энергию. Чтобы не стать отшельником, слив энергию, нужно работать в партнерстве.'],
  '1+9': ['Через энергии 1 и 9', 'Лидер («1»), воин («9») и борец за все хорошее против всего плохого. В плюсе спасет всех и работает на их благо. В минусе агрессия и деспотизм.'],
  '2+0': ['Через энергии 2 и 0', 'Партнерство с дополнительным нулем: либо усиление, либо обнуление. В плюсе понимающие, сердечные, взаимные. В минусе обнуляют все отношения.'],
  '2+1': ['Через энергии 2 и 1', 'В плюсе гуру с мягкой («2») силой («1»). Но без наработки понимания («2») и воли («1») не уверен в своих знаниях и сбрасывает ответственность.'],
  '2+2': ['Через энергии 2 и 2', 'Тонкие психологи («2») и незаменимые партнеры, умеющие искать решения. Но в минусе все партнерства придут к страданию и разрушению.  '],
  '2+3': ['Через энергии 2 и 3', 'Интеллект («3») и понимание других («2») позволят управлять проектами и передавать знания. В минусе страдальцы в вечных сомнениях.'],
  '2+4': ['Через энергии 2 и 4', 'Партнерство («2»), генераций идей («4») и умение видеть цели принесут реализацию. Но в минусе сомнения принесут негатив и разрушение.'],
  '2+5': ['Через энергии 2 и 5', 'Партнерство и понимание («2») отлично реализуются с коммуникациями и деловым складом («5»). В минусе это страдания, сомнения и хитрость.'],
  '2+6': ['Через энергии 2 и 6', 'Творческая («6») и тонко понимающая («2») других личность. Высокая планка в жизни. Но успеху могут помешать сомнения и действия на поводу соблазнов.'],
  '2+7': ['Через энергии 2 и 7', 'Ключи к успеху: партнерство, помощь («2») и решение задач, которые сломили других («7»). Неуспех в мизантропии, хаосе и постоянных кризисах.'],
  '2+8': ['Через энергии 2 и 8', 'Лидерство через партнерство («2»), системность («8») и трудолюбие. Успех в командной работе, бизнесе. В минусе обиды и непонимание других.'],
  '2+9': ['Через энергии 2 и 9', 'Партнер («2»), способный объединить других на борьбу («9») за правое дело, на помощь и спасение мира. В минусе борьба ради борьбы.'],
  '3+0': ['Через энергии 3 и 0', 'Интеллект с дополнительным нулем: либо усиление, либо обнуление. В плюсе разносторонняя личность. В минусе обесценивает знания.'],
  '3+1': ['Через энергии 3 и 1', 'Генерация идей на основе интеллекта и знаний («3») и воплощение за счет воли («1»). В минусе испытывают непонимание с другими, прогибают их.'],
};

// shared short "Planet. traits" table used for mission / action / result
const PLANET_TEXT = {
  1: 'Солнце. Лидерство, большие цели, видение пути, управление, стратегия, результат',
  2: 'Луна. Партнерство, понимание, дипломатия, мягкость, теплота, помощь, психология',
  3: 'Юпитер. Анализ, интеллект, знания, передача информации, расчет, организация',
  4: 'Раху. Генерация идей, мистика, творчество, разрушение старого, постановка целей',
  5: 'Меркурий. Коммуникации, расширение, гибкость, адекватность, бизнес, изобретательность',
  6: 'Венера. Наслаждение жизнью, творчество, любовь, удовольствия, искусство, мудрость',
  7: 'Кету. Гениальность, кризисы и решения, осознанность, трансформация, философия',
  8: 'Сатурн. Системность, труд, материализм, контроль процессов, результаты, команда',
  9: 'Марс. Борьба за благие цели, справедливость, спасение мира, сильный дух, страсть',
};

// shared long paragraph table for the numerologic_result_pair fields
const PAIR_ENERGY_TEXT = {
  1: 'Энергия Солнца 1 одна из двух самых сложных энергий в совместимости наряду с 4. При однозначном лидерстве одного из партнеров в паре (желательно тоже с присутствием энергии 1 в личном коде) и второстепенной роли второго, такая пара может двигаться вместе к цели, установленной лидером и согласно его стратегии. Если такой расклад ролей будет комфортен обоим. В случае же, когда речь идет о равноправии и балансе, чаще эти отношения сводятся к выяснению лидерства и подавлению друг друга. Редкие случаи, когда два равнозначных «соперника» находят интерес и динамику в своей игре и долго существуют. Обычно же в минусе в паре проявляется много непонимания, нежелания слышать, своеволия и эгоизма. Что в конечном счете ведет к одиночеству в отношениях или даже откровенному соревнованию «кто кого» с желанием «задоминировать» и растоптать партнера. Отчего этапы под этой энергией называют «дальше каждый по одному».',
  2: 'Энергия Луны 2 одна из самых благоприятных в семейной совместимости. Она про партнерство, тонкое понимание чувств и эмоций, интуицию, поддержку. Нумерологи называют союзы на энергии 2 как “этим двоим сразу в ЗАГС”. В астрологии Луна отвечает за интуицию и душевное состояние. Ключевой момент по этой энергии — наладить понимание в паре на душевном уровне. Без давления, без осуждения. Понимание друг друга такими, какие есть на самом деле. И одной интуиции будет недостаточно. Нужен диалог, в идеале как двух профессиональных психологов. В минусовом состоянии, если понимание не достигнуто, партнеры будут находиться в вечных сомнениях относительно своего выбора и отношений в целом. Это разовьет негативные иллюзии, расшатает душевный баланс, создаст любовные треугольники и приведет к расставанию.',
  3: 'Энергия Юпитера 3 считается неплохим рациональным дополнением отношений на любом этапе. Да, она не про страсть и глубину чувств, как некоторые другие энергии. Зато про трезвый расчет, выгоды и взаимодействие на условиях договоренностей. Нумерологи называют отношения на этой энергии «браками по расчету». И самое главное, что они весьма долгосрочны. При условии, что каждый действительно видит и получает свою выгоду от данных отношений, а весь обмен «выгодами» открыт и прозрачен. И пара заключила «договор» о своих вложениях, личных и общих выгодах. Неважно в какой форме этот договор. Главное, чтобы он был понятен каждому и принят обоюдно. В идеале совместные и личные выгоды начинают умножаться в этой паре. Негативное состояние происходит, когда один из партнеров начинает обманывать или снижает свою ценность в глазах другого: был богат — стал беднее, была красива — утратила привлекательность. Причем важен именно субъективный взгляд партнера. Тогда начинается мелочность, недовольства и подсчет бухгалтерии: кто что недополучает и кто кому остался должен.',
  4: 'Энергия Раху 4 одна из двух самых проблемных в совместимости наряду с 1. Она может сработать в бизнесе, потому что Раху генерирует идеи, создает новое и совершает открытия. Но в отношениях чаще проявляется обратная сторона: фокус на негативе, накоплении неудовлетворенности и в конечном итоге разрушении. Цикл созидание-разрушение есть проявление Раху. Партнеры с высокой осознанностью смогут жить в нем, чередуя этапы. Но гораздо чаще на этой энергии встречаются (если речь идет об Общем Сознании) те, кто подвержен деструктивным влияниям: оба с депрессией, зависимостями, желанием «ломать систему». И даже при совпадении в своих идеях у партнеров редко хватает внутреннего ресурса, чтобы все спланировать и воплотить. Отчего депрессивные настроения и неудовлетворенность только растут. Совет Нумерологов том, что общей «голове демона без тела» (так называют Раху по мифам) нужно дать ощущение физического тела для накопления энергии — например, через совместную физическую активность и спорт. Тогда разрушение будет касаться только старого, слабого и изжившего себя, а идеи забьют ключом и планы по их воплощению реализуются в жизнь.',
  5: 'Энергия Меркурия 5 отличная в деловом сотрудничества и неплохое дополнение для совместимости пары, где общение является важной частью и есть точки соприкосновения по интеллекту. Потому что Меркурий это про коммуникации, расширение и адекватность. Он не горяч, зато конструктивен в своем проявлении. И умеет быть дипломатичным, корректным, эрудированным. В позитиве пары под этой энергией всегда развивают общие интересы, путешествуют, открывают новое, болтают обо всем без устали и открывают друг другу новые горизонты. Важно, что умеют еще и смотреть на свои отношения без розовых очков. А если они нашли какое-то дело, то непременно будут его масштабировать. В минусе же энергия 5 сделает коммуникации поверхностными и безучастными, а поиск общих сфер бесконечным перебиранием всего подряд без фокуса. Так, ни за что толком не зацепившись и не вникнув друг в друга с должной глубиной, пара может совсем охладеть и расстаться.',
  6: 'Энергия Венеры 6 одна из самых благоприятных в совместимости. Это прямой путь к любви, к занятию ею и получение всех чувственных удовольствий. Фактически это самый быстрый успех в любви среди всех возможных энергий. Партнеры совместно обретают комфорт, наслаждения, испытывают земные радости. Но легкость успеха расслабляет, а чувственные удовольствия могут стать единственным стимулом, что в совокупности так же быстро наскучит, став обыденностью. Тогда проявится минусовое состояние: развитие отношений остановится, а кто-то даже пойдет на сторону в поиске продолжения удовольствий. Нельзя забывать о развитии отношений, о их смысловом наполнении и понимании истинной мудрости любви — вот что важно под этой энергией.',
  7: 'Энергия Кету 7 про самую яркую страсть и ту самую искру между мужчиной и женщиной. Но подойдет не всем. Ведь стоит искре погаснуть, как на первый план выходят кризисы и хаос, создаваемые Кету. Они будут возникать буквально на ровном месте и с обеих сторон. Но их цель в том, что отношения развивались через совместную трансформацию партнеров. Скучно здесь не будет, поэтому сидеть на ровном точно месте не получится: если только один из партнеров застрянет в развитии или невозможности пройти очередной кризис, а второй партнер обгонит — на завтра их будет разделять уже пропасть. Поэтому всем важно быть в тонусе, быстро соображать, изобретать анти-кризисные меры и уметь фокусироваться в хаосе на действительно важном. Если нет упорядоченности, то из-за очередного хаоса здесь велик риск измен, потому что состояния «сегодня люблю», «завтра ненавижу», а «послезавтра мщу» меняются стремительно — безудержной страсти нужен выход. По мифологии Кету это «демон без головы». И для конструктивных отношений нужно обуздать этого демона, включив ему «голову».',
  8: 'Энергия Сатурна 8 лучше всего проявляется в бизнесе и совместных проектах, но неплоха и для семьи тем партнерам, которые готовы к упорному труду на благо общего гнездышка. Это самая материальная энергия из всех. И Сатурн щедр на награду в виде финансового и материального благополучия тем, кто был трудолюбив в строительстве своей «системы», в которой скрупулезно просчитана каждая шестеренка в механизме и контролируется каждый шаг. Под «системой» можно понимать в случае совместимости и семью с общим бытом, домом и всеми сопутствующими благами. Но надо понимать, что Сатурн планета серьезная, фундаментальная и не быстрая. Скорого успеха ждать не стоит. Зато будет все надежно, стабильно и ровно, как по рельсам. А результат действий можно будет пощупать и посмотреть на банковском счете. В минусе по этой энергии присутствует тотальный контроль, мелочность, бесчувственность, зацикленность на материальном, а отношение к партнеру, как к инструменту и ресурсу.',
  9: 'Энергия Марса 9 это страсть, прорывное действие, преодоление, «карма» и, конечно, война, ведь Марс бог войны. В идеале партнерам надо воевать на одной стороне и против общего врага. Этим «врагом» часто бывают какие-то серьезные проблемы у одного из партнеров, где второй приходит на помощь. Или возникающие сложные обстоятельства, которые надо совместно преодолеть. Или общий духовный путь, который слишком тернист для одного. Все эти моменты придают отношениям характер «кармических». Но, если общий враг не найден, то векторы Марса обоих партнеров легко могут быть направлены друг против друга. И от страсти и самопожертвования до противостояния с обещанием не оставить камня на камне здесь один шаг. Марсу только дай повод повоевать. Еще считается, что энергия 9, как последняя и высшая энергия в ряду чисел, содержит в себе долю от каждой энергии. Поэтому проявления отношений на энергии 9 самые разнообразные.',
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
  1:  ['Маг', 'Сверхпособности творца. Идейный вдохновитель. Интеллект плюс интуиция. Гипнотический оратор. Настигает карма при уходе с пути. Багаж брошенных проектов.'],
  2:  ['Верховная жрица', 'Целители для ума и души. Спасатели. Интуиты. Семейные, заботливые и чувствительные. Могут быть в роли жертвы, видеть несправедливость к себе.'],
  3:  ['Императрица', 'Источник благополучия и любви, опора для ближних. Щедрость.Темперамент и активность. Опасность ухода в эгоистичные цели, материальность, грехи.'],
  4:  ['Император', 'Управление, финансы и карьера. Практичны. Люди порядка. Стараются тратить время с умом. В минусе из-за лени, беспорядка и привычки только брать.'],
  5:  ['Верховный жрец', 'Духовное лидерство. Проводник верных решений. Опора на знания, традиции и закон. Дар убеждения. На карму влияет законный брак и семья. '],
  6:  ['Влюбленные', 'Партнерство и любовь. Располагают к себе харизмой и доброжелательностью. Ценят красоту во всем. Уходят в минус из-за стремления к наслаждениям.'],
  7:  ['Воин (Колесница)', 'Высокий потенциал реализации. Умение падать, вставать и идти вперед. Смелость. Амбиции. За правду. Для них опасны лень, трусость, застой.'],
  8:  ['Справедливость (Правосудие)', 'Видят суть вещей. Ответственны и надежны. Решительны, т.к. уверены в правоте. Приводят все в баланс. Могут подавлять и жаловаться на несправедливость.'],
  9:  ['Отшельник', 'Мудрецы, философы, отрешенные и будто из космоса. Неравнодушны. Несут свет. Им нужно проявлять себя миру, не уходить в одиночество, строить правильные связи.'],
  10: ['Колесо Фортуны', 'Искусители судьбы. В позитивном проявлении часто везет. Все зависит от целей и мыслей. Заряжают азартом и уводят от провалов. Но могут «заиграться», потеряв все и попав в долги.'],
  11: ['Сила', 'Сила дана для достижения целей, побед, управления и раскрытия людей. Видит слабые места в людях, проектах и идеях. Утрачивает силу при трусости, бесцельности, агрессии.'],
  12: ['Повешенный', 'Идейно, но не буквально, «жертва» себя во имя других. Приносят миру идеи, новые взгляды, спасение. Могут страдать от депрессий, зависимостей, выгорания.'],
  13: ['Смерть', 'Разрушение старого, чтобы создать новое. В себе и в других. Путь кризисов и трансформаций. Преодолевают все, поборов страх. В страхе же слабы, держатся за прошлое.'],
  14: ['Умеренность', 'Интеллект, чувство гармонии и прекрасного. Часто люди искусства. И даже экстрасенсы. Лечат мир своей энергией. В минусе, когда зациклены на материальном.'],
  15: ['Дьявол', 'Гипнотическая энергетика. Страсть. Видят всю правду и ложь мира. На светлом пути им все дается легко. Могут искушать других, но и мир искушает их. '],
  16: ['Башня', 'Их путь в том, чобы выстоять в хаосе жизни, разрушив старые оковы и отбросив негатив. Возродившись заново, показать путь другим. Силы для этого им даны.'],
  17: ['Звезда', 'Яркие индивидуальности, полные талантов и идей. Реализовавшись, не испытывают материальных проблем. Но путь к поиску себя тернист.'],
  18: ['Луна', 'Транс-серферы реальности: их мысли и сны могут воплощаться. Они притягивают загадочностью и магической аурой. Очень опасны на темном пути.'],
  19: ['Солнце', 'Их путь светить другим, давать тепло и энергию. Больше дают — больше получают и становятся лидерами. В эгоизме могут сжечь все вокруг.'],
  20: ['Страшный суд', 'Сильная интуиция. Информация будто из космоса. Философский взгляд. Проводники законов мироздания. В минусе гордыня, страхи, иллюзии.'],
  21: ['Мир', 'Весь мир для них дом и все люди друзья. Доброе сердце. Масштабное мышление и высокие цели. При нелюбви к миру конфликтны, замкнуты, винят всех.'],
  22: ['Шут', 'Вечно молодой и беспечный. Внутренняя свобода. Идут легко по жизни, даря радость другим. В минусе беспринципные инфантилы, теряющие смыслы.'],
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

const MONTH_NAMES_RU = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];

const SCENARIO_TEXT = [
  'Ценят в первую очередь свою свободу и свои цели. Не тяготеют отношениями и не привязываются глубоко к партнеру. Могут выжидать время для расставания и делают это легко. Лучше остаться друзьями с партнером, чтобы не портить карму.',
  'Внешне сильные и независимые от партнера, но внутренне нуждаются в нем. Им сложно выбрать себе достойного, который будет согласен быть вторым номером на фоне их сияния. Реализуют свои амбиции через партнера, будучи лидером.',
  'В отношениях как рыба в воде. Для них это сфера реализации. Партнера любят всем сердцем. Состояние влюбленности окрыляет их. Им сложно сохранять верность: часто флиртуют и принимают знаки внимания. Решается только через понимание рисков.',
  'Им важны реализация и статусность. Собственная реализация и через продвижение партнера, будучи его покровителем. Ищут партнеров среди амбициозных. Семья и дети это высшая ценность. Критичны уважение и умение ценить друг друга.',
  'Их отношения как любовный роман. Их встречи судьбоносны. Каждый раз как в первый. Из-за чего переоценивают партнера. Иногда их отношения проходят в тайне от других. Главное для них быть честными с собой и перед любимым. ',
  '«А поговорить?». Те, кто предпочитает начинать с дружбы. Важно быть на одной волне в общении с партнером. Общие темы и интересы — то, что их удерживает. В идеале партнер из общего круга. Но общительность ведет к любовным треугольникам.',
  'Любовная энергия Венеры. Романтика, чувственность, красота ухаживаний. Но основа всему физическая близость. Потеря страсти означает конец любви. У них часто есть тайные и явные любовники. Ведь они умеют притягивать своей харизмой.',
  'Заложники кармических отношений. Тесно связаны с партнером и будто переплетены. Но любовь часто окутана иллюзиями и бывает неразделенной. Обладатель этой энергии может быть предан одному партнеру всю жизнь даже после разрыва.',
  'Их отношения это всегда работа. Над собой, над партнером, над общими целями. Вознаграждение будет ценным. Но придется научиться дисциплине, ограничениям и пониманию. Важно выбирать партнера не только сердцем, но и разумом.',
  'Отношения, полные огня. В плюсе это страсть и горячее любящее сердце. Иногда даже выступают как спасатели. В минусе скандалы, интриги и битье посуды. Есть особенность: хотят яркого партнера, на которого обращают внимание другие.',
];

function calcScenario(month) {
  // Only 10 unique scenarios exist. Months 11-12 wrap back and reuse
  // indices 1-2 (verified live: November -> scenario 1, same text as
  // February; December -> scenario 2, same text as March).
  const idx = month <= 10 ? month - 1 : month - 10;
  return {
    love_scenario: idx,
    love_month: MONTH_NAMES_RU[month - 1],
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

  let finalVerdict = 'Not a Match';
  if (isZodiacCompatible && isSvadhistanaPass && isAnahataPass) {
    finalVerdict = 'Perfect Match';
    if (isGoodSex) finalVerdict += ' (Great Physical Chemistry!)';
  } else if (isZodiacCompatible || isSvadhistanaPass || isAnahataPass) {
    finalVerdict = 'Friends';
  }

  return {
    final_verdict: finalVerdict,
    bio_result_top: chakra.bio_result_top,
    bio_result_chart: chakra.bio_result_chart,
    bio_result_chart_labels: chakra.bio_result_chart_labels,
    bio_result_balance: chakra.bio_result_balance,

    zodiac_result_dates: zodiac.zodiac_result_dates,
    zodiac_result_signs: zodiac.zodiac_result_signs,
    zodiac_result_roles: zodiac.zodiac_result_roles,
  };
}
