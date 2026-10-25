import { isEmbedded } from './embedded';
import { toast } from '../components/toast';

export function downloadFile(name: string, content: string, type = 'application/json') {
  // Embedded previews block downloads; say so instead of silently doing nothing.
  if (isEmbedded()) { toast('Downloads are blocked in this embedded view. Open NovelVerse on its own site to export.'); return; }
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function toCsv(rows: (string | number)[][]): string {
  return rows
    .map((r) => r.map((cell) => {
      const s = String(cell ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(','))
    .join('\n');
}
