import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Molecule, PDFExportConfig } from '../types';
import { addChineseFont } from './fonts';

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 10;
const HEADER_HEIGHT = 25;
const FOOTER_HEIGHT = 8;
const CONTENT_TOP = MARGIN + HEADER_HEIGHT;
const CONTENT_MAX_HEIGHT = PAGE_HEIGHT - MARGIN - HEADER_HEIGHT - FOOTER_HEIGHT;

async function createHeaderCanvas(moleculeName: string, pageInfo?: string): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 140;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#0a1628';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('分子性质报告', 40, 45);

  ctx.font = '30px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText(`分子: ${moleculeName}`, 40, 95);

  if (pageInfo) {
    ctx.textAlign = 'right';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '26px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
    ctx.fillText(pageInfo, canvas.width - 40, 45);
    ctx.textAlign = 'left';
  }

  return canvas.toDataURL('image/png');
}

async function createFooterCanvas(dateStr: string, timeStr: string): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 60;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#64748b';
  ctx.font = '22px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
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

  const originalScrollTop = contentElement.scrollTop;
  contentElement.scrollTop = 0;

  await new Promise(resolve => setTimeout(resolve, 100));

  const canvas = await html2canvas(contentElement, {
    backgroundColor: '#0f172a',
    scale: 2,
    useCORS: true,
    logging: false,
    scrollX: 0,
    scrollY: 0,
    windowWidth: contentElement.scrollWidth,
    windowHeight: contentElement.scrollHeight,
  });

  contentElement.scrollTop = originalScrollTop;

  const imgData = canvas.toDataURL('image/png');
  
  const contentWidth = PAGE_WIDTH - MARGIN * 2;
  const imgWidth = contentWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const date = new Date();
  const dateStr = date.toLocaleDateString();
  const timeStr = date.toLocaleTimeString();

  const totalPages = Math.ceil(imgHeight / CONTENT_MAX_HEIGHT);

  const pxPerMm = canvas.height / imgHeight;

  for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
    if (currentPage > 1) {
      doc.addPage();
    }

    const pageInfo = `第 ${currentPage} 页 / 共 ${totalPages} 页`;
    const headerImgData = await createHeaderCanvas(molecule.name, pageInfo);
    doc.addImage(headerImgData, 'PNG', 0, 0, PAGE_WIDTH, HEADER_HEIGHT);

    const pageContentStartMm = (currentPage - 1) * CONTENT_MAX_HEIGHT;
    const pageContentStartPx = pageContentStartMm * pxPerMm;

    const pageContentHeightMm = Math.min(CONTENT_MAX_HEIGHT, imgHeight - pageContentStartMm);
    const pageContentHeightPx = pageContentHeightMm * pxPerMm;

    if (pageContentHeightPx > 0 && pageContentStartPx < canvas.height) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = Math.min(pageContentHeightPx, canvas.height - pageContentStartPx);
      
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.fillStyle = '#0f172a';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        const sourceHeight = Math.min(pageContentHeightPx, canvas.height - pageContentStartPx);
        tempCtx.drawImage(
          canvas,
          0, pageContentStartPx, canvas.width, sourceHeight,
          0, 0, canvas.width, sourceHeight
        );
        
        const pageImgData = tempCanvas.toDataURL('image/png');
        const pageImgHeight = (tempCanvas.height * imgWidth) / canvas.width;
        doc.addImage(pageImgData, 'PNG', MARGIN, CONTENT_TOP, imgWidth, pageImgHeight);
      }
    }

    const footerImgData = await createFooterCanvas(dateStr, timeStr);
    doc.addImage(footerImgData, 'PNG', 0, PAGE_HEIGHT - FOOTER_HEIGHT, PAGE_WIDTH, FOOTER_HEIGHT);
  }

  const fileName = `${molecule.name.replace(/\s+/g, '_')}_性质报告.pdf`;
  doc.save(fileName);
}
