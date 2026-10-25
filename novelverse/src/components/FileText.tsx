import { useRef } from 'react';
import { Icon } from './Icon';
import { toast } from './toast';

/**
 * Loads a plain-text file (.txt, .md, .csv, .json) into a callback. Word and
 * PDF files are not read here: save them as plain text first, which also
 * keeps whole copyrighted chapters out of the app.
 */
export function FileText({ label = 'Load from file', accept = '.txt,.md,.csv,.json,text/plain', onText }: { label?: string; accept?: string; onText: (text: string, name: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={ref} type="file" accept={accept} hidden aria-hidden="true" tabIndex={-1}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          if (f.size > 1_000_000) { toast('That file is over 1 MB. Paste only your own notes or short excerpts.'); return; }
          if (/\.(docx?|pdf)$/i.test(f.name)) { toast('Save Word or PDF files as plain text (.txt) first.'); return; }
          onText(await f.text(), f.name);
        }} />
      <button type="button" className="btn ghost small" onClick={() => ref.current?.click()}><Icon name="file" size={16} /> {label}</button>
    </>
  );
}
