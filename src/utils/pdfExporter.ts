import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Molecule, PDFExportConfig } from '../types';
import { addChineseFont, setChineseFont } from './fonts';

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 10;

async function createTextCanvas(text: string, fontSize: number = 16, isBold: boolean = false): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const font = `${isBold ? 'bold ' : ''}${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif`;
  ctx.font = font;
  const metrics = ctx.measureText(text);
  canvas.width = Math.ceil(metrics.width) + 20;
  canvas.height = Math.ceil(fontSize * 1.5) + 10;

  const ctx2 = canvas.getContext('2d');
  if (!ctx2) return '';
  
  ctx2.fillStyle = '#ffffff';
  ctx2.font = font;
  ctx2.textBaseline = 'middle';
  ctx2.fillText(text, 10, canvas.height / 2);

  return canvas.toDataURL('image/png');
}

async function createHeaderCanvas(moleculeName: string, pageInfo?: string): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#0a1628';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('分子性质报告', 40, 35);

  ctx.font = '28px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText(`分子: ${moleculeName}`, 40, 75);

  if (pageInfo) {
    ctx.textAlign = 'right';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
    ctx.fillText(pageInfo, canvas.width - 40, 35);
    ctx.textAlign = 'left';
  }

  return canvas.toDataURL('image/png');
}

async function createFooterCanvas(dateStr: string, timeStr: string): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 50;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#64748b';
  ctx.font = '20px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(`由分子性质计算器生成于 ${dateStr} ${timeStr}`, 40, canvas.height / 2);

  return canvas.toDataURL('image/png');
}

export async function exportPropertyReport(
  molecule: Molecule,
  contentElement: HTMLElement,
  config: PDFExportConfig
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: config.pageSize || 'a4',
  });

  addChineseFont(doc);

  const canvas = await html2canvas(contentElement, {
    backgroundColor: '#0f172a',
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  
  const contentWidth = PAGE_WIDTH - MARGIN * 2;
  const imgWidth = contentWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const headerHeight = 25;
  const footerHeight = 8;
  const contentTop = MARGIN + headerHeight;
  const contentMaxHeight = PAGE_HEIGHT - MARGIN - headerHeight - footerHeight;

  const date = new Date();
  const dateStr = date.toLocaleDateString();
  const timeStr = date.toLocaleTimeString();

  let heightLeft = imgHeight;
  let position = contentTop;

  const totalPages = Math.ceil(imgHeight / contentMaxHeight);

  for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
    if (currentPage > 1) {
      doc.addPage();
    }

    const pageInfo = `第 ${currentPage} 页 / 共 ${totalPages} 页`;
    const headerImgData = await createHeaderCanvas(molecule.name, pageInfo);
    doc.addImage(headerImgData, 'PNG', 0, 0, PAGE_WIDTH, headerHeight);

    const yOffset = (currentPage - 1) * contentMaxHeight;
    const sourceY = yOffset * (canvas.height / imgHeight);
    const sourceHeight = Math.min(
      contentMaxHeight * (canvas.height / imgHeight),
      canvas.height - sourceY
    );

    if (sourceHeight > 0) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = sourceHeight;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(
          canvas,
          0, sourceY, canvas.width, sourceHeight,
          0, 0, canvas.width, sourceHeight
        );
        const pageImgData = tempCanvas.toDataURL('image/png');
        const pageImgHeight = (sourceHeight * imgWidth) / canvas.width;
        doc.addImage(pageImgData, 'PNG', MARGIN, contentTop, imgWidth, pageImgHeight);
      }
    }

    const footerImgData = await createFooterCanvas(dateStr, timeStr);
    doc.addImage(footerImgData, 'PNG', 0, PAGE_HEIGHT - footerHeight, PAGE_WIDTH, footerHeight);
  }

  const fileName = `${molecule.name.replace(/\s+/g, '_')}_性质报告.pdf`;
  doc.save(fileName);
}
