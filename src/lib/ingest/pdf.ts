import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
// Vite: 워커를 별도 청크로 번들 (pdfjs 는 무거우므로 이 모듈은 동적 import 로만 로드됨)
import PdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';

GlobalWorkerOptions.workerPort = new PdfjsWorker();

/** PDF 텍스트 레이어 추출. 스캔 PDF(텍스트 없음)는 빈/짧은 문자열 반환 → 호출 측에서 경고. */
export async function extractPdf(file: File): Promise<string> {
  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = getDocument({ data });
  const pdf = await loadingTask.promise;
  try {
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/[ \t]+/g, ' ')
        .trim();
      if (text) pages.push(text);
      page.cleanup();
    }
    return pages.join('\n\n');
  } finally {
    await loadingTask.destroy();
  }
}
