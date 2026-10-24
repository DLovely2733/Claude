// Tiny hash router shared by views (kept separate from main.js to avoid
// circular imports).

let renderFn = () => {};

export function setRenderer(fn) {
  renderFn = fn;
}

export function go(path) {
  if (location.hash === `#/${path}`) renderFn();
  else location.hash = `#/${path}`;
}

export function rerender() {
  renderFn();
}
