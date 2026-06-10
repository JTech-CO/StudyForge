import { toPng } from 'html-to-image';

/** DOM 노드를 PNG 로 캡처해 다운로드. 현재 테마 배경색으로 렌더. */
export async function exportNodeToPng(node: HTMLElement, filename: string): Promise<void> {
  const backgroundColor = getComputedStyle(document.body).backgroundColor || '#ffffff';
  const dataUrl = await toPng(node, { backgroundColor, pixelRatio: 2, cacheBust: true });
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
