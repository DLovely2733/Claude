import type { LiveResponse } from '../data/types';
import type { PublicState } from './logic';

// How live-session messages travel.
//
// - local: BroadcastChannel. Works between tabs of one browser on one device
//   (e.g. a projector tab and a test student tab). Needs no server and works
//   on the static deployment.
// - relay: WebSocket to the classroom server (server/classroom.mjs), which a
//   teacher runs on a laptop on the school network. The server only relays
//   messages in memory; the teacher's browser stays the host and keeps the data.

export type LiveMessage =
  | { t: 'hello'; pid: string }
  | { t: 'join'; pid: string; callSign: string }
  | { t: 'respond'; r: LiveResponse }
  | { t: 'state'; team?: string; s: PublicState }
  | { t: 'ended' };

export interface Transport {
  kind: 'local' | 'relay';
  send: (m: LiveMessage) => void;
  close: () => void;
}

let infoCheck: Promise<{ relay: boolean; mentor: boolean }> | null = null;

/** What the server hosting this page offers. A static host offers nothing. */
export function serverInfo(): Promise<{ relay: boolean; mentor: boolean }> {
  infoCheck ??= fetch('api/classroom', { cache: 'no-store' })
    .then((r) => (r.ok && (r.headers.get('content-type') ?? '').includes('json') ? r.json() : null))
    .then((j) => ({ relay: !!j?.relay, mentor: !!j?.mentor }))
    .catch(() => ({ relay: false, mentor: false }));
  return infoCheck;
}

/** True when the app is being served by the classroom relay server. */
export const relayAvailable = () => serverInfo().then((i) => i.relay);

export async function connect(code: string, onMessage: (m: LiveMessage) => void, onStatus?: (s: 'open' | 'closed') => void): Promise<Transport> {
  if (await relayAvailable()) return connectRelay(code, onMessage, onStatus);
  const ch = new BroadcastChannel(`novelverse-live-${code}`);
  ch.onmessage = (e) => onMessage(e.data as LiveMessage);
  onStatus?.('open');
  return { kind: 'local', send: (m) => ch.postMessage(m), close: () => ch.close() };
}

function connectRelay(code: string, onMessage: (m: LiveMessage) => void, onStatus?: (s: 'open' | 'closed') => void): Transport {
  let ws: WebSocket | null = null;
  let closed = false;
  const queue: string[] = [];
  const open = () => {
    const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/relay?code=${encodeURIComponent(code)}`;
    ws = new WebSocket(url);
    ws.onopen = () => { onStatus?.('open'); while (queue.length) ws!.send(queue.shift()!); };
    ws.onmessage = (e) => { try { onMessage(JSON.parse(String(e.data))); } catch { /* ignore malformed */ } };
    ws.onclose = () => { onStatus?.('closed'); if (!closed) setTimeout(open, 1500); };
  };
  open();
  return {
    kind: 'relay',
    send: (m) => {
      const data = JSON.stringify(m);
      if (ws?.readyState === WebSocket.OPEN) ws.send(data);
      else queue.push(data);
    },
    close: () => { closed = true; ws?.close(); },
  };
}
