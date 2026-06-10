import mammoth from 'mammoth';

/** DOCX 본문 텍스트 추출 (mammoth). */
export async function extractDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  return value.trim();
}
