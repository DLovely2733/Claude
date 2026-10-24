// Build a self-contained static site in dist/ that can be uploaded to any web
// host (GitHub Pages, Netlify, a school server) or opened from a USB stick via
// a local server. Usage: npm run export   (add --zip to also make dist.zip)

import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const out = join(root, 'dist');

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const dir of ['src', 'styles', 'vendor', 'curriculum']) await cp(join(root, dir), join(out, dir), { recursive: true });
await cp(join(root, 'teacher.html'), join(out, 'teacher.html'));

// index.html is authored as hosted-artifact page content; give it a full document.
const page = await readFile(join(root, 'index.html'), 'utf8');
await writeFile(
  join(out, 'index.html'),
  `<!doctype html>\n<html lang="en-CA">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>\n<body>\n${page}</body>\n</html>\n`
);
// Tell GitHub Pages not to run Jekyll (keeps every file as-is).
await writeFile(join(out, '.nojekyll'), '');

if (process.argv.includes('--zip')) {
  await rm(join(root, 'dist.zip'), { force: true });
  execFileSync('zip', ['-qr', join(root, 'dist.zip'), '.'], { cwd: out });
  console.log('Wrote dist.zip');
}
console.log('Static site written to dist/. Upload the contents of dist/ to any web host.');
