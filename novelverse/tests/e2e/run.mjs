// End-to-end playthrough of the demonstration mission in a real browser.
// Builds nothing: run `npm run build` first. Starts `vite preview`, plays
// every room as a student, checks the teacher sees the work, and fails on
// any console error. Screenshots go to test-results/.
//
//   npm run build && npm run e2e

import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('@playwright/test')); }

const PORT = 4179;
const BASE = `http://localhost:${PORT}/`;
const OUT = new URL('../../test-results/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort'], { cwd: new URL('../..', import.meta.url).pathname, stdio: 'pipe' });
for (let i = 0; ; i++) {
  try { if ((await fetch(BASE)).ok) break; } catch { /* not up yet */ }
  if (i > 100) throw new Error('preview server did not start');
  await new Promise((r) => setTimeout(r, 200));
}

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const errors = [];
let failed = false;
const check = (cond, msg) => { if (!cond) { failed = true; console.error('  ✗', msg); } else console.log('  ✓', msg); };

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  const shot = (n) => page.screenshot({ path: `${OUT}${n}.png`, fullPage: true });

  console.log('Landing');
  await page.goto(BASE);
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE);
  await page.getByRole('button', { name: /Enter the Story/ }).click();
  await page.waitForURL(/#\/student/);
  check(await page.getByRole('heading', { name: "Ender's Game" }).isVisible(), 'student story map shows the novel');
  check(await page.getByRole('button', { name: /Chapter 14: classified/ }).isVisible(), 'locked chapter is classified');

  console.log('Briefing');
  await page.getByRole('link', { name: /Begin mission/ }).click();
  await page.getByRole('link', { name: /Enter room 1/ }).click();
  await page.getByRole('button', { name: /Next transmission/ }).click();
  await page.getByRole('button', { name: /Next transmission/ }).click();
  await page.getByRole('button', { name: 'I’ve read the chapters' }).click();
  await page.getByLabel(/First thought/).fill('The adults keep changing the rules so Ender can never rest.');
  await page.getByRole('button', { name: /Begin the mission/ }).click();
  await page.getByRole('button', { name: /Next room/ }).click();

  console.log('Dawn Battle');
  await page.waitForTimeout(2500);
  await shot('02-dilemma-deck');
  check(await page.locator('canvas').count() > 0 || await page.getByRole('group', { name: /2D map/ }).isVisible(), 'command deck renders (3D or 2D)');
  await page.getByRole('button', { name: '2D map' }).click().catch(() => {});
  for (const label of ['Battle order', 'Squad status', 'Bean’s proposal']) {
    await page.locator('.hotspot-btn', { hasText: label }).click();
  }
  await page.getByRole('button', { name: /ready to decide/ }).click();
  await page.getByRole('radio', { name: /Trust Bean/ }).click();
  check(await page.getByRole('button', { name: /Commit decision/ }).isDisabled(), 'cannot commit before justifying');
  await page.getByRole('button', { name: 'trust', exact: true }).click();
  await page.locator('.locker-toggle').first().click();
  await page.getByLabel(/3\. Why/).fill('I trust Bean because in Chapter 11 Ender gives him a squad to invent tactics, which shows a good commander uses the talent around him.');
  await page.getByRole('button', { name: /Ask the Literary Mentor/ }).click();
  check(await page.locator('.mentor-panel').isVisible(), 'mentor responds with coaching');
  await page.getByRole('button', { name: /Commit decision/ }).click();
  check(await page.getByText('Simulated outcome').isVisible(), 'consequence labelled as simulation');
  await page.getByRole('radio', { name: /Give every toon/ }).click();
  await page.getByRole('button', { name: /Compare with the novel/ }).click();
  await page.getByLabel(/How does your choice compare/).fill('Like Ender I trusted Bean, but Ender had no chance to question the unfair schedule at all.');
  await shot('03-dilemma-compare');
  await page.getByRole('button', { name: /Log decision/ }).click();
  check(await page.getByText(/Anchored in the Text/).isVisible(), 'insight earned for evidence-based reasoning');
  await page.getByRole('button', { name: /Next room/ }).click();

  console.log('Graff File');
  await page.locator('.ev-card').first().waitFor();
  const cards = page.locator('.ev-card');
  const n = await cards.count();
  check(n >= 6, `evidence board shows ${n} cards`);
  for (let i = 0; i < n; i++) {
    const text = await cards.nth(i).locator('.ev-text').innerText();
    const isInterp = /seems|may be|suggests/.test(text);
    await cards.nth(i).getByRole('button', { name: isInterp ? 'Interpretation' : 'Fact', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Check my sorting' }).click();
  await page.locator('.theory').nth(1).getByRole('button', { name: 'Argue this' }).click();
  for (const i of [0, 1, 3]) {
    await cards.nth(i).getByRole('button', { name: /Pin/ }).click();
    await page.locator('.modal .pin-row').nth(1).getByRole('button', { name: 'Supports' }).click();
  }
  await page.locator('.theory').nth(2).getByRole('button', { name: 'Rule out' }).click();
  await page.locator('.theory').nth(2).locator('textarea').fill('Graff designs the plans himself, like bringing Valentine.');
  await page.getByLabel('Your claim').click();
  await cards.nth(0).getByRole('button', { name: /Connect/ }).click();
  await cards.nth(2).getByRole('button', { name: /Link here/ }).click();
  await page.getByLabel('Your claim').fill('Graff cares about Ender but believes saving humanity justifies hurting him.');
  await page.getByLabel('Evidence and reasoning').fill('When the teachers keep changing the rules in Chapter 11, it shows Graff is willing to push Ender to the edge, because he believes the war depends on it.');
  await page.getByLabel(/The other side/).fill('Some readers might argue Graff only sees a weapon, but he is honest with Ender from the start.');
  await shot('04-evidence-board');
  const band = await page.locator('.strength-band').innerText();
  check(/case/i.test(band), `case strength shown (${band})`);
  await page.getByRole('button', { name: /File case report/ }).click();
  await page.getByRole('button', { name: /Next room/ }).click();

  console.log('Signal Vault');
  await page.locator('.seq-item').first().waitFor();
  const order = ['ev-schedule', 'ev-two-armies', 'ev-cornered', 'ev-sent-away', 'ev-lake', 'ev-valentine', 'ev-returns'];
  const texts = await page.evaluate((ids) => {
    const s = JSON.parse(localStorage.getItem('novelverse:v1')).state;
    return ids.map((id) => s.novels['enders-game'].events.find((e) => e.id === id).text);
  }, order);
  for (let target = 0; target < texts.length; target++) {
    let items = await page.locator('.seq-item .grow').allInnerTexts();
    let at = items.indexOf(texts[target]);
    while (at > target) {
      await page.getByRole('button', { name: `Move up: ${texts[target]}` }).click();
      at -= 1;
    }
  }
  await page.getByRole('button', { name: 'Transmit sequence' }).click();
  check(await page.getByText(/Signal restored/).isVisible(), 'timeline lock opens with the correct order');
  await page.waitForTimeout(1100);
  await page.getByRole('checkbox', { name: /readers see the adults planning/ }).click();
  await page.getByRole('checkbox', { name: /justify their choices/ }).click();
  await page.getByRole('button', { name: 'Test the lock' }).click();
  await page.locator('textarea').first().fill('Because we know the adults are planning to make things harder, every battle feels like a trap.');
  await page.getByRole('button', { name: /Open the lock/ }).click();
  await page.waitForTimeout(1100);
  await page.getByRole('button', { name: 'Hint (2 left). Hints never count against you.' }).click();
  await page.getByRole('radio', { name: /Leadership is important/ }).click();
  await page.getByRole('button', { name: 'Test the lock' }).click();
  check(await page.getByText(/Too general/).isVisible(), 'weak theme statement explains why it is weak');
  await page.getByRole('radio', { name: /Effective leaders adapt/ }).click();
  await page.getByRole('button', { name: 'Test the lock' }).click();
  await page.locator('textarea').first().fill('Ender keeps winning by adapting, but he pulls away from his own soldiers.');
  await page.getByRole('button', { name: /Open the lock/ }).click();
  await shot('05-vault');
  await page.getByRole('button', { name: /Log the decoded signal/ }).click();
  await page.getByRole('button', { name: /Next room/ }).click();

  console.log('Shifting Alliances');
  await page.locator('.net-node').first().waitFor();
  const link = async (a, b, why) => {
    await page.locator('.net-node', { hasText: a }).click();
    await page.locator('.net-node', { hasText: b }).click();
    await page.getByLabel(/Evidence: what happens/).fill(why);
    await page.getByRole('button', { name: 'Save connection' }).click();
  };
  await link('Graff', 'Valentine', 'Graff brings Valentine to the lake so Ender will listen and keep going.');
  await page.locator('.net-node', { hasText: 'Ender' }).click();
  await page.locator('.net-node', { hasText: 'Bean' }).click();
  await page.getByRole('button', { name: 'Mentor', exact: true }).click();
  await page.getByLabel(/Evidence: what happens/).fill('Ender gives Bean a special squad in Chapter 11 and pushes him to invent tactics.');
  await page.getByRole('button', { name: 'Save connection' }).click();
  await link('Ender', 'Bonzo', 'Bonzo corners Ender in Chapter 12 and the fight ends their rivalry for good.');
  await page.getByLabel(/Show the network as of/).fill('8');
  await page.getByRole('button', { name: /reference map/ }).click();
  await shot('06-connections');
  await page.getByRole('button', { name: /Log the network/ }).click();
  await page.getByRole('button', { name: /Next room/ }).click();

  console.log('Commander’s Log');
  await page.locator('.ladder').waitFor();
  await page.getByRole('textbox', { name: 'Observation' }).fill('Ender wins every battle but becomes more isolated each time.');
  await page.getByRole('textbox', { name: 'Theme statement' }).fill('Leaders who adapt under pressure can succeed while losing connection with the people they lead.');
  await page.getByRole('textbox', { name: 'Complication' }).fill('The novel suggests leaders must adapt, but carrying every decision alone isolates them.');
  const prompts = page.locator('.reflection textarea[id^="prompt-"]');
  await prompts.nth(0).fill('The card about the adults not stepping in made me see how alone Ender is.');
  await prompts.nth(1).fill('I trusted Bean like Ender did, but I wanted to question the schedule and he never can.');
  await shot('07-reflection');
  await page.getByRole('button', { name: /Close the log/ }).click();
  await page.getByRole('button', { name: /Mission complete/ }).click();
  await page.goto(`${BASE}#/student/log`);
  check(await page.getByRole('heading', { name: 'Your thinking, on record' }).isVisible(), 'Commander’s Log loads');
  check((await page.locator('.insight-tile.earned').count()) >= 4, 'multiple insights earned across the mission');
  await shot('08-log');

  console.log('Teacher');
  await page.goto(`${BASE}#/teacher/review/m-pressure-point/s-dilemma`);
  await page.getByRole('button', { name: /Demo Cadet/ }).click();
  check(await page.getByText(/I trust Bean because in Chapter 11/).isVisible(), 'teacher sees the student’s reasoning');
  await page.locator('.rubric-cell').nth(2).click();
  await page.getByRole('button', { name: 'Use this draft' }).click();
  await page.getByRole('button', { name: /Return to student/ }).click();
  await shot('09-review');

  await page.goto(`${BASE}#/teacher/build/enders-game`);
  await page.getByRole('button', { name: /Generate draft/ }).click();
  await page.waitForURL(/#\/teacher\/mission\//);
  check(await page.getByRole('heading', { name: 'Publish check' }).isVisible(), 'generated draft opens in the editor with a publish check');
  await shot('10-generated');

  await page.goto(`${BASE}#/teacher/novel/enders-game/chapters`);
  await page.getByLabel('Unlock chapter 13').uncheck();
  await page.goto(`${BASE}#/student`);
  check(await page.getByRole('button', { name: /Chapter 13: classified/ }).isVisible(), 'locking a chapter hides it from students');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}#/student/mission/m-pressure-point/s-board`);
  await page.waitForTimeout(600);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  check(!overflow, 'no horizontal page scroll on a phone-width screen');
  await shot('11-mobile-board');
} catch (e) {
  failed = true;
  console.error(e);
  await browser.contexts()[0]?.pages()[0]?.screenshot({ path: `${OUT}failure.png`, fullPage: true }).catch(() => {});
} finally {
  const real = errors.filter((e) => !/WebGL|GPU|swiftshader|THREE\.WebGLRenderer/i.test(e));
  check(real.length === 0, `no console errors${real.length ? `: ${real.slice(0, 3).join(' | ')}` : ''}`);
  await browser.close();
  server.kill();
  process.exit(failed ? 1 : 0);
}
