// Maintainer tool: extract an official curriculum PDF with the same pipeline
// the browser uses, and write a curriculum version file the app can load.
//
//   node scripts/extract-curriculum.mjs <file.pdf> <out.json> <version-id> "<label>"

import { readFile, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { layoutPdfPages, parseCurriculumText } from '../src/curriculum/parser.js';
import { suggestedAreaIds } from '../src/curriculum/model.js';

const [pdfPath, outPath, id, label] = process.argv.slice(2);
if (!pdfPath || !outPath || !id || !label) {
  console.error('usage: node scripts/extract-curriculum.mjs <file.pdf> <out.json> <version-id> "<label>"');
  process.exit(1);
}

const doc = await pdfjs.getDocument({ data: new Uint8Array(await readFile(pdfPath)), isEvalSupported: false }).promise;
const pages = [];
for (let n = 1; n <= doc.numPages; n++) {
  const page = await doc.getPage(n);
  const vp = page.getViewport({ scale: 1 });
  const content = await page.getTextContent();
  pages.push({
    pageNumber: n,
    height: vp.height,
    items: content.items
      .filter((it) => typeof it.str === 'string')
      .map((it) => ({ str: it.str, x: it.transform[4], y: vp.height - it.transform[5], width: it.width, height: it.height || Math.abs(it.transform[3]) })),
  });
}
const sourceLines = layoutPdfPages(pages).map(({ text, page }) => ({ text, page }));
const parsed = parseCurriculumText(layoutPdfPages(pages));

// Content areas are suggestions only; the teacher confirms them in Review.
for (const o of parsed.outcomes) {
  o.contentAreaIds = suggestedAreaIds(o);
  o.contentAreaSource = 'suggested';
}

const version = {
  id,
  label,
  notes: `Extracted from ${basename(pdfPath)} (${doc.numPages} pages). Wording is verbatim from the source; every outcome still needs teacher verification.`,
  sourceName: basename(pdfPath),
  sourceType: `PDF (${doc.numPages} pages)`,
  uploadedAt: new Date().toISOString(),
  bundled: true,
  outcomes: parsed.outcomes,
  warnings: parsed.warnings,
  stats: parsed.stats,
  sourceLines,
};
await writeFile(outPath, JSON.stringify(version, null, 1));
console.log(`${parsed.stats.outcomes} outcomes, ${parsed.stats.statements} statements → ${outPath}`);
for (const o of parsed.outcomes) console.log(o.id, o.contentAreaIds.join(','), '|', o.text);
