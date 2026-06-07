const NOTO_SANS_SC_REGULAR = '';

export const CHINESE_FONT = {
  name: 'NotoSansSC',
  style: 'normal',
  data: NOTO_SANS_SC_REGULAR,
};

export function addChineseFont(doc: any): void {
  if (CHINESE_FONT.data && doc.addFont) {
    try {
      doc.addFileToVFS(`${CHINESE_FONT.name}.ttf`, CHINESE_FONT.data);
      doc.addFont(`${CHINESE_FONT.name}.ttf`, CHINESE_FONT.name, CHINESE_FONT.style);
    } catch (e) {
      console.warn('Failed to add Chinese font:', e);
    }
  }
}

export function setChineseFont(doc: any, size: number = 12, style: string = 'normal'): void {
  try {
    doc.setFont(CHINESE_FONT.name, style);
    doc.setFontSize(size);
  } catch (e) {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
  }
}
