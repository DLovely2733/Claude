import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { create } from 'zustand';

// In-page replacements for window.confirm and window.prompt. Native dialogs
// are blocked in some embedded viewers and can't be styled or themed; these
// trap focus, close on Escape and return focus where it was.

interface Req {
  title: string;
  body?: string;
  confirmLabel?: string;
  danger?: boolean;
  /** When set, the dialog asks for text and resolves with it (or null). */
  input?: { label: string; value: string };
  resolve: (v: boolean | string | null) => void;
}

const useDialogs = create<{ current: Req | null; set: (r: Req | null) => void }>((set) => ({ current: null, set: (current) => set({ current }) }));

export function ask(o: Omit<Req, 'resolve' | 'input'>): Promise<boolean> {
  return new Promise((resolve) => useDialogs.getState().set({ ...o, resolve: (v) => resolve(v === true) }));
}

export function askText(o: Omit<Req, 'resolve' | 'input'> & { label: string; value?: string }): Promise<string | null> {
  return new Promise((resolve) => useDialogs.getState().set({ ...o, input: { label: o.label, value: o.value ?? '' }, resolve: (v) => resolve(typeof v === 'string' ? v : null) }));
}

export function DialogHost() {
  const req = useDialogs((s) => s.current);
  const setReq = useDialogs((s) => s.set);
  const [text, setText] = useState('');
  const returnTo = useRef<Element | null>(null);
  const first = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!req) return;
    returnTo.current = document.activeElement;
    setText(req.input?.value ?? '');
    setTimeout(() => first.current?.focus(), 0);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(req.input ? null : false); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); (returnTo.current as HTMLElement | null)?.focus?.(); };
  }, [req]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = (v: boolean | string | null) => { req?.resolve(v); setReq(null); };

  return (
    <AnimatePresence>
      {req && (
        <>
          <motion.div className="scrim" style={{ zIndex: 190 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => close(req.input ? null : false)} />
          <motion.div className="modal" style={{ zIndex: 200 }} role="alertdialog" aria-modal="true" aria-labelledby="dlg-title" aria-describedby={req.body ? 'dlg-body' : undefined}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <h2 id="dlg-title" style={{ fontSize: '1.3rem' }}>{req.title}</h2>
            {req.body && <p id="dlg-body" className="text-2">{req.body}</p>}
            <form onSubmit={(e) => { e.preventDefault(); close(req.input ? text.trim() || null : true); }}>
              {req.input && (
                <label className="field">
                  <span className="label">{req.input.label}</span>
                  <input ref={(el) => { first.current = el; }} id="dlg-input" className="input" value={text} onChange={(e) => setText(e.target.value)} />
                </label>
              )}
              <div className="row end" style={{ marginTop: '1rem' }}>
                <button type="button" className="btn quiet" onClick={() => close(req.input ? null : false)}>Cancel</button>
                <button ref={(el) => { if (!req.input) first.current = el; }} type="submit" className={`btn ${req.danger ? 'danger' : 'primary'}`}
                  disabled={!!req.input && !text.trim()}>{req.confirmLabel ?? 'OK'}</button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
