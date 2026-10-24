// Browser-only: reads an uploaded PDF with the vendored pdf.js build and
// returns positioned text items per page for layoutPdfPages().

let pdfjsPromise = null;

function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('../../vendor/pdfjs/pdf.min.mjs').then((lib) => {
      lib.GlobalWorkerOptions.workerSrc = new URL('../../vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;
      return lib;
    });
  }
  return pdfjsPromise;
}

export async function readPdfPages(arrayBuffer, onProgress = () => {}) {
  const pdfjs = await loadPdfjs();
  const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const pages = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const items = content.items
      .filter((it) => typeof it.str === 'string')
      .map((it) => ({
        str: it.str,
        x: it.transform[4],
        y: viewport.height - it.transform[5],
        width: it.width,
        height: it.height || Math.abs(it.transform[3]) || 10,
      }));
    pages.push({ pageNumber: n, height: viewport.height, items });
    onProgress(n, doc.numPages);
  }
  return { pages, numPages: doc.numPages, info: (await doc.getMetadata().catch(() => null))?.info || {} };
}
