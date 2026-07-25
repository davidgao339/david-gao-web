
const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('public/astro/index.html', 'utf-8');
const calcJs = fs.readFileSync('public/astro/calc.js', 'utf-8');
const scriptJs = fs.readFileSync('public/astro/script.js', 'utf-8');

const dom = new JSDOM(html, { runScripts: 'dangerously' });
const window = dom.window;
const document = window.document;

// Mock window.scrollTo since JSDOM doesn't implement it well
window.scrollTo = () => {}; window.populateSelects();

// Inject our scripts
const calcScript = document.createElement('script');
calcScript.textContent = calcJs;
document.body.appendChild(calcScript);

const mainScript = document.createElement('script');
mainScript.textContent = scriptJs;
document.body.appendChild(mainScript);

// Run a bunch of dates to test calculate()
let errors = [];

function runTest(mD, mM, mY, fD, fM, fY) {
  document.getElementById('m-day').value = mD;
  document.getElementById('m-month').value = mM;
  document.getElementById('m-year').value = mY;
  document.getElementById('f-day').value = fD;
  document.getElementById('f-month').value = fM;
  document.getElementById('f-year').value = fY;
  
  // manually trigger calculate
  window.calculate();
  
  const errEl = document.getElementById('calc-error');
  if (!errEl.classList.contains('hidden')) {
     errors.push({dates: [mD, mM, mY, fD, fM, fY], error: errEl.textContent});
  }
}

// Fuzz
let months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
let days = [1, 10, 15, 20, 28, 29, 30, 31]; // including edge cases

for (let mMonth of months) {
  for (let mDay of days) {
     for (let fMonth of months) {
        for (let fDay of days) {
           // Basic validation to avoid simple invalid dates like Feb 30
           if (mMonth === 2 && mDay > 29) continue;
           if (fMonth === 2 && fDay > 29) continue;
           if ([4,6,9,11].includes(mMonth) && mDay > 30) continue;
           if ([4,6,9,11].includes(fMonth) && fDay > 30) continue;
           
           try {
             runTest(mDay, mMonth, 1990, fDay, fMonth, 1992);
           } catch (e) {
             console.error('CRASH ON:', mDay, mMonth, fDay, fMonth, e.message);
             process.exit(1);
           }
        }
     }
  }
}

if (errors.length > 0) {
  let uniqueErrors = [...new Set(errors.map(e => e.error))];
  console.log('UI ERROR MESSAGES FOUND:', uniqueErrors);
  console.log('Sample failure:', errors[0]);
} else {
  console.log('NO BUGS FOUND in calculate() loop.');
}
