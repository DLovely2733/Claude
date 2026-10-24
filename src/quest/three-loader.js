// Loads three.js: the vendored copy first (offline classrooms), then the same
// release from jsDelivr (hosted copies that do not ship vendor/).

let promise = null;
const CDN = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

export function loadThree() {
  if (!promise) promise = import('../../vendor/three/three.module.min.js').catch(() => import(CDN));
  return promise;
}

/** True when the device can create a WebGL context. */
export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
