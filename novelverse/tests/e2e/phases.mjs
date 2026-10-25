// Browser checks for the content system, new engines, live sessions,
// immersion and accessibility. Called from run.mjs.

import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

async function axe(page, label, check) {
  await page.addScriptTag({ content: AXE });
  const res = await page.evaluate(async () => {
    const r = await axe.run(document, { resultTypes: ['violations'] });
    return r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map((v) => `${v.id} (${v.nodes.length}): ${v.nodes[0]?.target.join(' ')}`);
  });
  check(res.length === 0, `axe: no serious/critical issues on ${label}${res.length ? ` → ${res.slice(0, 4).join(' | ')}` : ''}`);
}

export async function phases({ browser, BASE, check, OUT, root }) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  const shot = (n, p = page) => p.screenshot({ path: `${OUT}${n}.png`, fullPage: true });
  await page.goto(BASE);
  await page.evaluate(() => localStorage.clear());

  // ------------------------------------------------------------ keyboard + axe
  console.log('Keyboard and accessibility');
  await page.goto(BASE);
  await page.locator('.portal').first().waitFor();
  await page.keyboard.press('Tab');
  check(await page.evaluate(() => document.activeElement?.textContent?.includes('Skip to main content')), 'first Tab reaches the skip link');
  let reached = false;
  for (let i = 0; i < 6 && !reached; i++) {
    await page.keyboard.press('Tab');
    reached = await page.evaluate(() => document.activeElement?.textContent?.includes('Enter the Story') ?? false);
  }
  check(reached, 'student portal reachable by keyboard');
  await page.keyboard.press('Enter');
  await page.waitForURL(/#\/student/);
  check(true, 'Enter activates the portal');
  await page.waitForTimeout(700);
  for (const [label, route] of [['landing', '/'], ['story map', '/student'], ['mission path', '/student/mission/m-tribunal'],
    ['dilemma', '/student/mission/m-pressure-point/s-dilemma'], ['evidence board', '/student/mission/m-pressure-point/s-board'],
    ['vault', '/student/mission/m-pressure-point/s-vault'], ['connections', '/student/mission/m-pressure-point/s-connections'],
    ['courtroom', '/student/mission/m-tribunal/t-court'], ['studio', '/student/mission/m-tribunal/t-studio'],
    ['teacher dashboard', '/teacher'], ['novel editor', '/teacher/novel/enders-game/evidence'], ['mission editor', '/teacher/mission/m-tribunal'],
    ['review', '/teacher/review'], ['curriculum', '/teacher/curriculum'], ['live setup', '/teacher/live'], ['join', '/join']]) {
    await page.goto(`${BASE}#${route}`);
    await page.waitForTimeout(900);
    await axe(page, label, check);
  }
  // Supports drawer: Escape closes and returns focus.
  await page.goto(`${BASE}#/student`);
  await page.getByRole('button', { name: 'Supports', exact: true }).click();
  await page.getByRole('switch', { name: /High contrast/ }).check();
  check(await page.locator('.app[data-contrast="high"]').count() === 1, 'high contrast applies');
  await page.keyboard.press('Escape');
  check(await page.getByRole('dialog').waitFor({ state: 'detached', timeout: 3000 }).then(() => true, () => false), 'Escape closes the supports drawer');
  check(await page.evaluate(() => document.activeElement?.getAttribute('aria-label') === 'Supports'), 'focus returns to the Supports button');
  await page.getByRole('button', { name: 'Supports', exact: true }).click();
  await page.getByRole('switch', { name: /High contrast/ }).uncheck();
  await page.keyboard.press('Escape');

  // ------------------------------------------------------------ courtroom
  console.log('Tribunal: courtroom');
  await page.goto(`${BASE}#/student/mission/m-tribunal/t-court`);
  await page.getByRole('radio', { name: /Defence/ }).click();
  await page.getByRole('button', { name: /Enter the courtroom/ }).click();
  const exhibits = page.locator('.exhibit');
  for (const [i, kind, point] of [[6, 'Fact', 'Graff was honest with Ender from the very beginning about the cost.'], [5, 'Fact', 'Graff explains to Ender why he is needed, which shows he respects him.']]) {
    await exhibits.nth(i).locator('.locker-toggle').click();
    await exhibits.nth(i).getByRole('button', { name: kind, exact: true }).click();
    await exhibits.nth(i).locator('textarea').fill(point);
  }
  await page.getByRole('button', { name: /Begin cross-examination/ }).click();
  const answers = { 'Graff wanted': 'Objection: speculation', 'The adults knew': 'No objection', 'Every adult': 'Objection: overgeneralization' };
  const items = page.locator('.cross');
  for (let i = 0; i < 3; i++) {
    const txt = await items.nth(i).locator('.cross-text').innerText();
    const key = Object.keys(answers).find((k) => txt.includes(k));
    await items.nth(i).getByRole('radio', { name: new RegExp(answers[key]) }).click();
    await items.nth(i).getByRole('textbox').fill('The chapters show something different here.');
    await items.nth(i).getByRole('button', { name: 'Put it to the judge' }).click();
  }
  check(await page.locator('.cross.sustained').count() === 3, 'three correct calls are sustained or agreed');
  await page.getByRole('button', { name: /Prepare closing/ }).click();
  await page.getByRole('radio', { name: /The adults knew/ }).check();
  await page.getByLabel(/Your closing/).fill('Members of the jury, Graff told Ender the truth from the start. Yes, the adults did not step in when Bonzo threatened him, but Graff believed Ender had to learn to rely on himself, and he explained at the lake why it mattered.');
  await page.getByRole('button', { name: /Rest your case/ }).click();
  await page.getByRole('radio', { name: 'Partly responsible' }).click();
  await page.getByLabel(/Weigh the strongest evidence/).fill('He was honest at the start, but he still let Ender face Bonzo alone, so he shares the blame even though his goal was protecting humanity.');
  await shot('12-courtroom-verdict');
  await page.getByRole('button', { name: /Deliver verdict/ }).click();
  check(await page.getByText('Sustained', { exact: true }).isVisible(), 'courtroom awards the objection insight');
  await page.getByRole('button', { name: /Next room/ }).click();

  console.log('Tribunal: creative studio');
  await page.locator('.format-card').first().waitFor();
  await page.getByRole('button', { name: /Digital newspaper/ }).click();
  await page.getByLabel('Headline', { exact: true }).fill('Dragon Army Wins Again, but Its Commander Stands Alone');
  await page.getByLabel('Article').fill('For the second time in two days Dragon Army was ordered into battle with no warning. Soldiers say their commander has stopped eating with them and barely speaks. Teachers refused to explain the schedule. Some wonder whether winning is worth what it is costing the boy who keeps delivering victories, and whether anyone is watching out for him at all.');
  await page.locator('.studio .locker-toggle').first().click();
  await page.getByLabel(/Explain your choices/).fill('I wrote as a reporter so readers can see Ender from outside, because in Chapter 11 the schedule isolates him and the article shows that cost.');
  check(await page.locator('.pv-headline').innerText().then((t) => t.includes('Stands Alone')), 'newspaper preview renders live');
  await shot('13-studio');
  await page.getByRole('button', { name: /Publish to the log/ }).click();
  check(await page.getByText('Maker’s Mark').isVisible(), 'craft note insight earned');

  // ------------------------------------------------------------ live (same browser)
  console.log('Live: same-browser Four Corners with opinion shift');
  await page.goto(`${BASE}#/teacher/live`);
  await page.getByRole('textbox', { name: /Statement/ }).fill('Graff is a good leader.');
  await page.getByRole('button', { name: /^Ch\.12/ }).click();
  await page.getByRole('button', { name: /Open session/ }).click();
  await page.locator('.join-code strong').waitFor();
  const code = (await page.locator('.join-code strong').innerText()).trim();
  check(/^[A-Z0-9]{5}$/.test(code), `session code ${code}`);
  const students = [];
  for (const [name, first, second] of [['Vega', 'Agree', 'Disagree'], ['Orion', 'Agree', 'Agree'], ['Lyra', 'Strongly agree', 'Disagree']]) {
    const sp = await ctx.newPage();
    await sp.goto(`${BASE}#/join/${code}`);
    await sp.getByPlaceholder('Or type your own').fill(name);
    await sp.getByRole('button', { name: 'Enter' }).click();
    students.push({ sp, first, second });
  }
  await page.waitForTimeout(1500);
  check(await page.locator('.roster li').count() === 3, 'three students joined');
  await page.getByRole('button', { name: 'Open round 1' }).click();
  for (const s of students) {
    await s.sp.getByRole('radio', { name: s.first, exact: true }).click();
    await s.sp.getByRole('textbox').fill('Because of what happens in Chapter 11.');
    await s.sp.getByRole('button', { name: 'Send' }).click();
  }
  await page.waitForTimeout(800);
  check((await page.locator('.lobby-count').innerText()).startsWith('3'), 'teacher sees 3 responses');
  await page.getByRole('button', { name: 'Lock responses' }).click();
  await page.getByRole('button', { name: 'Reveal results' }).click();
  await page.locator('#intro').selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Show to class' }).click();
  await page.getByRole('button', { name: /Open round 2/ }).click();
  await page.waitForTimeout(600);
  check(await students[0].sp.getByText(/New evidence/).isVisible(), 'students see the introduced evidence');
  for (const s of students) {
    await s.sp.getByRole('radio', { name: s.second, exact: true }).click();
    await s.sp.getByRole('button', { name: /Send|Update my answer/ }).click();
  }
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: 'Lock responses' }).click();
  await page.getByRole('button', { name: 'Reveal results' }).click();
  await page.waitForTimeout(600);
  const shiftText = await page.locator('.shift').innerText();
  check(/1\s*kept their position/.test(shiftText) && /2 changed their mind/.test(shiftText), `opinion shift reported (${shiftText.replace(/\s+/g, ' ').slice(0, 80)})`);
  await students[0].sp.waitForTimeout(500);
  check(await students[0].sp.locator('.shift').isVisible(), 'students see the anonymous shift');
  check(!(await page.locator('.live-stage').innerText()).includes('Vega'), 'projector area never shows call signs');
  await page.getByRole('button', { name: 'Present' }).click();
  await shot('14-live-present');
  await page.getByRole('button', { name: 'Exit present mode' }).first().click().catch(() => page.getByRole('button', { name: 'Controls' }).click());
  await page.getByRole('button', { name: 'End session' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'End session' }).click();
  await page.waitForTimeout(800);
  check(await students[1].sp.getByText('Session ended').isVisible(), 'ending the session reaches students');
  await students[1].sp.goto(`${BASE}#/join/ZZZZZ`);
  await students[1].sp.waitForTimeout(5600);
  check(await students[1].sp.getByText('No session found').isVisible(), 'unknown code shows a helpful error');
  for (const s of students) await s.sp.close();

  // ------------------------------------------------------------ new novel unit, no code
  console.log('Content system: a new novel unit built through the UI');
  await page.goto(`${BASE}#/teacher/novels`);
  await page.getByRole('button', { name: /Add a novel/ }).click();
  await page.getByLabel('Title').fill('The Lighthouse Keeper');
  await page.getByLabel('Author').fill('A. Teacher');
  await page.getByLabel(/Number of chapters/).fill('3');
  await page.getByLabel(/Themes to explore/).fill('courage');
  await page.getByRole('button', { name: /Mystery/ }).click();
  await page.getByLabel(/Paste chapter notes/).fill('1 | The Storm | Mara sees a ship in trouble.\n2 | The Choice | Mara must leave the light to help.\n3 | Morning | The village learns what she did.');
  await page.getByRole('button', { name: 'Create knowledge base' }).click();
  await page.waitForURL(/teacher\/novel\//);
  await page.getByRole('tab', { name: 'Chapters & spoilers' }).click();
  await page.getByLabel('Unlock up to chapter').selectOption('3');
  await page.getByRole('tab', { name: 'Events' }).click();
  for (const [ch, text] of [['1', 'Mara spots a ship drifting toward the rocks.'], ['2', 'Mara leaves the lighthouse in a small boat.'], ['3', 'The rescued sailors tell the village what Mara did.']]) {
    await page.getByRole('button', { name: 'Add' }).click();
    const item = page.locator('.le-item.open');
    await item.getByLabel('Chapter').fill(ch);
    await item.getByLabel('What happens').fill(text);
  }
  await page.getByRole('tab', { name: 'Themes' }).click();
  await page.locator('.le-toggle').first().click();
  await page.getByLabel('Big question').fill('What does courage cost?');
  for (const line of ['Courage matters.', 'Mara is brave.', 'Courage can mean acting for others while still afraid.']) {
    await page.getByRole('button', { name: 'Add line' }).click();
    await page.getByRole('textbox', { name: /^Item \d+$/ }).last().fill(line);
  }
  await page.goto(`${BASE}#/teacher/missions`);
  await page.getByRole('link', { name: 'Use' }).first().click();
  await page.locator('#mb-novel').selectOption({ label: 'The Lighthouse Keeper' });
  await page.getByRole('button', { name: /Quick Check/ }).click();
  for (const n of ['1', '2', '3']) await page.getByRole('button', { name: n, exact: true }).click();
  await page.getByRole('button', { name: 'courage' }).click();
  await page.getByRole('button', { name: /Generate draft/ }).click();
  await page.waitForURL(/teacher\/mission\//);
  const blocked = await page.locator('.publish-check').innerText();
  check(!/placeholder/.test(blocked), 'Quick Check draft for the new novel has no placeholders');
  await page.getByRole('button', { name: /Publish/ }).click();
  await page.goto(`${BASE}#/student`);
  check(await page.getByRole('heading', { name: 'The Lighthouse Keeper' }).isVisible(), 'students see the new novel world');
  await page.getByRole('link', { name: /Begin mission/ }).last().click();
  await page.locator('.path-room a').first().click();
  await page.locator('.seq-item').first().waitFor();
  check(await page.locator('[data-skin="noir"]').count() > 0, 'mission renders in the noir skin');
  await shot('15-new-novel-vault');

  // ------------------------------------------------------------ relay server: real multi-device
  console.log('Classroom relay: separate devices');
  const PORT = 8791;
  const srv = spawn(process.execPath, ['server/classroom.mjs'], { cwd: root, env: { ...process.env, PORT: String(PORT) }, stdio: 'pipe' });
  try {
    for (let i = 0; ; i++) {
      try { if ((await fetch(`http://localhost:${PORT}/api/classroom`)).ok) break; } catch { /* starting */ }
      if (i > 50) throw new Error('classroom server did not start');
      await new Promise((r) => setTimeout(r, 200));
    }
    const R = `http://localhost:${PORT}/`;
    const teacherCtx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
    const t = await teacherCtx.newPage();
    await t.goto(`${R}#/teacher/live`);
    await t.getByRole('radio', { name: /Response Wall/ }).click();
    check(await t.getByText('Classroom network mode').isVisible(), 'relay detected');
    await t.getByRole('textbox', { name: /Question/ }).fill('In one sentence: what is Graff most afraid of?');
    await t.getByRole('button', { name: /Open session/ }).click();
    const rcode = (await t.locator('.join-code strong').innerText()).trim();
    const devices = [];
    for (const [name, text] of [['Nova', 'Losing the war because Ender breaks.'], ['Rigel', 'Something unkind about a classmate.']]) {
      const dctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const d = await dctx.newPage();
      await d.goto(`${R}#/join`);
      await d.getByLabel(/Session code/).fill(rcode);
      await d.getByRole('button', { name: 'Join' }).click();
      await d.getByPlaceholder('Or type your own').fill(name);
      await d.getByRole('button', { name: 'Enter' }).click();
      devices.push({ d, dctx, text });
    }
    await t.waitForTimeout(1500);
    check(await t.locator('.roster li').count() === 2, 'two separate devices joined through the relay');
    await t.getByRole('button', { name: 'Open round 1' }).click();
    for (const x of devices) {
      await x.d.getByRole('textbox').fill(x.text);
      await x.d.getByRole('button', { name: 'Send' }).click();
    }
    await t.waitForTimeout(1000);
    await t.locator('.mod-list li', { hasText: 'unkind' }).getByRole('button', { name: 'Hide' }).click();
    await t.getByRole('button', { name: 'Lock responses' }).click();
    await t.getByRole('button', { name: 'Reveal results' }).click();
    await devices[0].d.waitForTimeout(1200);
    const wall = await devices[0].d.locator('.wall').innerText();
    check(wall.includes('Losing the war') && !wall.includes('unkind'), 'moderated wall reaches student devices without the hidden response');
    await shot('16-relay-student', devices[0].d);
    for (const x of devices) await x.dctx.close();
    await teacherCtx.close();
  } finally {
    srv.kill();
  }

  await ctx.close();
}
