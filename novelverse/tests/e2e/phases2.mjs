// Browser checks for the finishing pass: live courtroom and showdown, the
// AI mentor (against a local mock of the Anthropic API), the lesson
// playbook, the second demo novel, and phone-width layouts.

import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

async function axe(page, label, check) {
  await page.addScriptTag({ content: AXE });
  const res = await page.evaluate(async () => {
    const r = await window.axe.run(document, { resultTypes: ['violations'] });
    return r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}: ${v.nodes[0]?.target.join(' ')}`);
  });
  check(res.length === 0, `axe: no serious/critical issues on ${label}${res.length ? ` → ${res.slice(0, 3).join(' | ')}` : ''}`);
}

async function joinAs(ctx, BASE, code, name) {
  const p = await ctx.newPage();
  await p.goto(`${BASE}#/join/${code}`);
  await p.getByPlaceholder('Or type your own').fill(name);
  await p.getByRole('button', { name: 'Enter' }).click();
  await p.locator('.live-client').waitFor();
  return p;
}

export async function phases2({ browser, BASE, check, OUT, root }) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE);
  await page.evaluate(() => localStorage.clear());

  // ------------------------------------------------------------ live courtroom
  console.log('Live courtroom (same browser)');
  await page.goto(`${BASE}#/teacher/live`);
  await page.getByRole('radio', { name: /Live Courtroom/ }).click();
  await page.locator('.row .chip', { hasText: 'Colonel Graff knowingly' }).click();
  for (const c of ['Ch.11 The teachers keep', 'Ch.3 Before Ender leaves']) await page.getByRole('button', { name: new RegExp(`^${c}`) }).click();
  await page.getByRole('button', { name: /Open session/ }).click();
  const code = (await page.locator('.join-code strong').innerText()).trim();
  const pros = await joinAs(ctx, BASE, code, 'Atlas');
  const def = await joinAs(ctx, BASE, code, 'Juno');
  await page.waitForTimeout(800);
  check(await pros.getByText('Prosecution', { exact: true }).isVisible() && await def.getByText('Defence', { exact: true }).isVisible(), 'students are split into two teams');
  await page.getByRole('button', { name: 'Open argument building' }).click();
  await pros.locator('select').selectOption({ index: 1 });
  await pros.getByRole('textbox').fill('He changes the rules on purpose to break Ender down, so he endangers him knowingly.');
  await pros.getByRole('button', { name: 'Add to our case' }).click();
  await def.locator('select').selectOption({ index: 2 });
  await def.getByRole('textbox').fill('He loves Ender like a son and would never really hurt him.');
  await def.getByRole('button', { name: 'Add to our case' }).click();
  await page.waitForTimeout(700);
  check(!(await def.locator('.live-client').innerText()).includes('changes the rules on purpose'), 'teams cannot see each other’s arguments while building');
  check((await pros.locator('.court-arg').count()) === 1, 'a team sees its own case');
  await page.getByRole('button', { name: 'Lock responses' }).click();
  await page.getByRole('button', { name: /open objections/ }).click();
  await pros.waitForTimeout(700);
  await pros.getByRole('radio', { name: /loves Ender like a son/ }).click();
  await pros.getByRole('button', { name: 'speculation' }).click();
  await pros.getByRole('textbox').fill('Nothing in the text says he loves him.');
  await pros.getByRole('button', { name: 'Object' }).click();
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: 'Lock responses' }).click();
  await page.locator('.mod-list li', { hasText: 'Nothing in the text' }).getByRole('button', { name: 'Sustain' }).click();
  await page.getByRole('button', { name: /Rulings done/ }).click();
  for (const p of [pros, def]) {
    await p.waitForTimeout(500);
    await p.getByRole('radio', { name: 'Partly responsible' }).click();
    await p.getByRole('textbox').fill('Both sides had a point.');
    await p.getByRole('button', { name: 'Deliver verdict' }).click();
  }
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: 'Lock responses' }).click();
  await page.getByRole('button', { name: 'Reveal verdict' }).click();
  await def.waitForTimeout(900);
  const defView = await def.locator('.live-client').innerText();
  check(/sustained/i.test(defView) && /Partly responsible\s*2/.test(defView), 'students see the sustained objection and the verdict tally');
  await page.screenshot({ path: `${OUT}17-live-courtroom.png`, fullPage: true });
  await axe(def, 'student live courtroom', check);
  await page.getByRole('button', { name: 'Present' }).click();
  await axe(page, 'live console in present mode', check);
  await page.getByRole('button', { name: 'Controls' }).click();
  await pros.close(); await def.close();

  // ------------------------------------------------------------ showdown
  console.log('Evidence showdown');
  await page.goto(`${BASE}#/teacher/live`);
  await page.getByRole('radio', { name: /Evidence Showdown/ }).click();
  await page.getByRole('textbox', { name: /Claim/ }).fill('Graff cares about Ender but believes saving humanity justifies hurting him.');
  for (const c of ['Ch.11 The teachers keep', 'Ch.3 Before Ender leaves', 'Ch.12 The adults know', 'Ch.13 Graff seems']) await page.getByRole('button', { name: new RegExp(`^${c}`) }).click();
  await page.getByRole('button', { name: /Open session/ }).click();
  const scode = (await page.locator('.join-code strong').innerText()).trim();
  const voters = [];
  for (const n of ['Comet', 'Ember', 'Kestrel', 'Quasar']) voters.push(await joinAs(ctx, BASE, scode, n));
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: 'Open round 1' }).click();
  const picks = ['The teachers keep', 'The teachers keep', 'Before Ender leaves', 'The adults know'];
  for (let i = 0; i < voters.length; i++) {
    await voters[i].getByRole('radio', { name: new RegExp(picks[i]) }).click();
    await voters[i].getByRole('button', { name: 'Send' }).click();
  }
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: 'Lock responses' }).click();
  await page.getByRole('button', { name: 'Reveal results' }).click();
  await page.getByRole('button', { name: /Open final vote \(top 3\)/ }).click();
  await voters[0].waitForTimeout(700);
  check((await voters[0].getByRole('radio').count()) === 3, 'final vote narrows to the top three cards');
  check(!(await voters[0].getByRole('radio', { name: /Graff seems/ }).count()), 'a card nobody chose is not in the final');
  for (const v of voters) {
    await v.getByRole('radio', { name: /The adults know/ }).click();
    await v.getByRole('button', { name: /Send|Update/ }).click();
  }
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: 'Lock responses' }).click();
  await page.getByRole('button', { name: 'Reveal results' }).click();
  await page.waitForTimeout(600);
  check(await page.getByRole('heading', { name: 'Final vote' }).isVisible(), 'final vote results revealed');
  for (const v of voters) await v.close();

  // ------------------------------------------------------------ playbook
  console.log('Lesson playbook');
  await page.goto(`${BASE}#/teacher`);
  await page.getByRole('button', { name: 'Start warm-up' }).click();
  await page.waitForURL(/teacher\/live\//);
  check(await page.locator('.live-prompt').innerText().then((t) => t.length > 20), 'warm-up opens a ready-made Four Corners session');
  await page.goto(`${BASE}#/teacher`);
  check(await page.getByText('Recent live sessions').isVisible(), 'dashboard lists recent live sessions');
  await page.getByRole('button', { name: 'Start exit ticket' }).click();
  await page.waitForURL(/teacher\/live\//);
  check((await page.locator('.live-prompt').innerText()).includes('changed your thinking'), 'exit ticket opens a response wall');

  // ------------------------------------------------------------ second novel
  console.log('Second demo novel: Jekyll and Hyde');
  await page.goto(`${BASE}#/student`);
  check(await page.getByRole('heading', { name: /Jekyll and Mr Hyde/ }).isVisible(), 'Jekyll and Hyde appears on the student map');
  check(await page.getByRole('button', { name: /Chapter 8: classified/ }).isVisible(), 'the revelation chapters are classified');
  await page.goto(`${BASE}#/student/mission/m-utterson/u-dilemma`);
  await page.locator('.hotspot-btn').first().waitFor();
  check(await page.locator('[data-skin="noir"]').count() > 0, 'Jekyll mission renders in the noir world');
  check(await page.getByRole('button', { name: '3D room' }).count() === 0, 'the Battle School 3D deck is not offered for other novels');
  check((await page.locator('.map2d-svg').innerHTML()).includes('THE LETTER IN THE SAFE'), '2D scene is labelled for this novel');
  await axe(page, 'Jekyll dilemma', check);
  await page.goto(`${BASE}#/student/mission/m-utterson/u-brief`);
  await page.getByRole('button', { name: /Next transmission/ }).click();
  check(await page.getByLabel(/First thought: why would a respected man/).isVisible(), 'briefing prompt belongs to this novel');

  // ------------------------------------------------------------ phone widths
  console.log('Phone-width layouts');
  const phone = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const ph = await phone.newPage();
  for (const r of ['/teacher', '/teacher/live', '/join', '/student/mission/m-tribunal/t-court', '/student/mission/m-tribunal/t-studio', '/student/mission/m-utterson/u-board', '/teacher/curriculum', '/teacher/missions']) {
    await ph.goto(`${BASE}#${r}`);
    await ph.waitForTimeout(700);
    const over = await ph.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(over <= 1, `no sideways scroll at 375px on ${r}${over > 1 ? ` (${over}px)` : ''}`);
  }
  await phone.close();

  // ------------------------------------------------------------ AI mentor
  console.log('AI mentor (mock Anthropic API)');
  const calls = [];
  let mode = 'good';
  const mock = createServer(async (req, res) => {
    let body = '';
    for await (const c of req) body += c;
    calls.push({ url: req.url, headers: req.headers, body: JSON.parse(body || '{}') });
    const text = mode === 'good' ? 'NOTICE: You wrote a full sentence about leaders.\nQUESTION: Which moment in Chapter 11 best shows that cost?' : 'QUESTION: Look again at page 212?';
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ id: 'msg_mock', type: 'message', role: 'assistant', model: 'claude-opus-5-5', content: [{ type: 'text', text }], stop_reason: 'end_turn', stop_sequence: null, usage: { input_tokens: 10, output_tokens: 10 } }));
  });
  await new Promise((r) => mock.listen(8795, r));
  const PORT = 8796;
  const srv = spawn(process.execPath, ['server/classroom.mjs'], { cwd: root, stdio: 'pipe',
    env: { ...process.env, PORT: String(PORT), NOVELVERSE_AI_MENTOR: 'on', ANTHROPIC_API_KEY: 'test-key', ANTHROPIC_BASE_URL: 'http://localhost:8795' } });
  try {
    for (let i = 0; ; i++) {
      try { if ((await fetch(`http://localhost:${PORT}/api/classroom`)).ok) break; } catch { /* starting */ }
      if (i > 50) throw new Error('server did not start');
      await new Promise((r) => setTimeout(r, 200));
    }
    const info = await (await fetch(`http://localhost:${PORT}/api/classroom`)).json();
    check(info.mentor === true, 'classroom server reports the AI mentor as enabled');
    const mctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const m = await mctx.newPage();
    const R = `http://localhost:${PORT}/`;
    const askOnLog = async () => {
      await m.goto(`${R}#/student/mission/m-pressure-point/s-log`);
      await m.reload();
      await m.locator('.ladder').waitFor();
      await m.getByRole('textbox', { name: 'Theme statement' }).fill('Leaders who keep winning can become lonely.');
      await m.getByRole('button', { name: 'Ask the Literary Mentor' }).click();
      await m.locator('.mentor-panel').waitFor();
      await m.waitForTimeout(300);
      return m.locator('.mentor-panel').innerText();
    };
    const good = await askOnLog();
    check(/Literary Mentor · AI/i.test(good) && good.includes('Which moment in Chapter 11'), 'AI mentor reply reaches the student, labelled as AI');
    const call = calls.at(-1);
    check(call?.body.model === 'claude-opus-5-5' && call.body.fallbacks === 'default' && String(call.headers['anthropic-beta']).includes('server-side-fallback-2026-07-01'), 'server calls claude-opus-5-5 with refusal fallbacks');
    const sent = JSON.stringify(call?.body.messages ?? '');
    check(sent.includes('Chapter 13') && !sent.includes('Ender’s Teacher') && !sent.includes('Chapter 14'), 'only unlocked chapters are sent to the AI');
    check(sent.includes('Leaders who keep winning'), 'the student draft is sent for coaching');
    mode = 'bad';
    const fallback = await askOnLog();
    check(!/· AI/i.test(fallback) && /question/i.test(fallback), 'a reply that breaks the rules is dropped and the built-in mentor answers');
    await mctx.close();
  } finally {
    srv.kill();
    mock.close();
  }

  await ctx.close();
}
