// Minimal DOM helpers shared by the views.

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') el.innerHTML = v;
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

export function toast(message, tone = 'info') {
  const host = document.getElementById('toasts');
  const t = h('div', { class: `toast ${tone}`, role: 'status' }, message);
  host.append(t);
  setTimeout(() => t.remove(), 4500);
}

export function badge(text, tone = 'neutral', title) {
  return h('span', { class: `badge ${tone}`, title }, text);
}

export function field(label, control, help) {
  const id = control.id || `f_${Math.random().toString(36).slice(2, 8)}`;
  control.id = id;
  return h('div', { class: 'field' }, h('label', { for: id }, label), control, help ? h('p', { class: 'help' }, help) : null);
}

export function select(options, value, onChange) {
  return h(
    'select',
    { onchange: (e) => onChange(e.target.value) },
    options.map((o) => h('option', { value: o.id ?? o.value ?? o, selected: (o.id ?? o.value ?? o) === value }, o.label ?? o))
  );
}

export function textarea(value, onInput, attrs = {}) {
  const el = h('textarea', { rows: attrs.rows || 3, ...attrs });
  el.value = value ?? '';
  el.addEventListener('input', (e) => onInput(e.target.value));
  return el;
}

export function input(value, onInput, attrs = {}) {
  const el = h('input', { type: 'text', ...attrs });
  el.value = value ?? '';
  el.addEventListener('input', (e) => onInput(attrs.type === 'number' || attrs.type === 'range' ? Number(e.target.value) : e.target.value));
  return el;
}

export function checkbox(label, checked, onChange) {
  const cb = h('input', { type: 'checkbox', checked });
  cb.addEventListener('change', (e) => onChange(e.target.checked));
  return h('label', { class: 'check' }, cb, ' ', label);
}

export function modal(title, body, actions = []) {
  const dlg = h('dialog', { class: 'modal', 'aria-label': title });
  const close = () => {
    dlg.close();
    dlg.remove();
  };
  dlg.append(
    h('div', { class: 'modal-head' }, h('h2', {}, title), h('button', { class: 'ghost', onclick: close, 'aria-label': 'Close' }, '✕')),
    h('div', { class: 'modal-body' }, body),
    h('div', { class: 'modal-actions' }, actions.map((a) => h('button', { class: a.class || '', onclick: () => a.onClick(close) }, a.label)))
  );
  document.body.append(dlg);
  dlg.showModal();
  return close;
}

export function download(filename, content, type = 'application/json') {
  const blob = new Blob([content], { type });
  const a = h('a', { href: URL.createObjectURL(blob), download: filename });
  document.body.append(a);
  a.click();
  setTimeout(() => (URL.revokeObjectURL(a.href), a.remove()), 1000);
}

// ---------------------------------------------------------------------------
// Narration (Web Speech API). Optional, teacher-controlled.
// ---------------------------------------------------------------------------

export function speechAvailable() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speak(text, rate = 0.9) {
  if (!speechAvailable() || !text) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/\p{Extended_Pictographic}/gu, ''));
  u.rate = rate;
  u.lang = 'en-CA';
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (speechAvailable()) window.speechSynthesis.cancel();
}
