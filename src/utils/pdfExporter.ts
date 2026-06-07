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

function removeOverflowConstraints(element: HTMLElement): void {
  element.style.overflow = 'visible';
  element.style.overflowY = 'visible';
  element.style.overflowX = 'visible';
  element.style.maxHeight = 'none';
  element.style.minHeight = 'none';
  element.style.height = 'auto';
  
  const children = element.children as HTMLCollectionOf<HTMLElement>;
  for (let i = 0; i < children.length; i++) {
    removeOverflowConstraints(children[i]);
  }
}

function findBestSplitPosition(
  canvas: HTMLCanvasElement,
  targetY: number,
  pxPerMm: number,
  maxAdjustMm: number = 8
): number {
  const ctx = canvas.getContext('2d');
  if (!ctx) return targetY;

  const maxAdjustPx = Math.floor(maxAdjustMm * pxPerMm);
  let bestY = targetY;
  let minContentScore = Infinity;

  const startY = Math.max(0, targetY - maxAdjustPx);
  const endY = Math.min(canvas.height - 2, targetY + maxAdjustPx);

  for (let testY = startY; testY <= endY; testY += 2) {
    try {
      const imageData = ctx.getImageData(0, Math.floor(testY), canvas.width, 2);
      const data = imageData.data;
      
      let contentScore = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;
        if (brightness > 30) {
          contentScore += brightness;
        }
      }
      
      if (contentScore < minContentScore) {
        minContentScore = contentScore;
        bestY = testY;
      }
    } catch (e) {
      continue;
    }
  }

  return bestY;
}

async function captureFullContent(contentElement: HTMLElement): Promise<HTMLCanvasElement> {
  const clone = contentElement.cloneNode(true) as HTMLElement;
  
  clone.style.position = 'fixed';
  clone.style.top = '-99999px';
  clone.style.left = '-99999px';
  clone.style.width = `${contentElement.scrollWidth}px`;
  clone.style.height = 'auto';
  clone.style.maxHeight = 'none';
  clone.style.minHeight = 'none';
  clone.style.overflow = 'visible';
  clone.style.overflowY = 'visible';
  clone.style.overflowX = 'visible';
  clone.style.zIndex = '-9999';
  clone.style.pointerEvents = 'none';
  clone.style.backgroundColor = '#0f172a';
  clone.style.display = 'block';
  clone.style.flex = 'none';
  clone.style.flexGrow = '0';
  clone.style.flexShrink = '0';

  document.body.appendChild(clone);

  removeOverflowConstraints(clone);

  const allElements = clone.querySelectorAll('*') as NodeListOf<HTMLElement>;
  allElements.forEach((el) => {
    const style = window.getComputedStyle(el);
    if (style.transform !== 'none') {
      el.style.transform = 'none';
    }
  });

  await new Promise(resolve => setTimeout(resolve, 300));

  try {
    const canvas = await html2canvas(clone, {
      backgroundColor: '#0f172a',
      scale: 2,
      useCORS: true,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: clone.scrollWidth,
      windowHeight: clone.scrollHeight,
    });

    return canvas;
  } finally {
    document.body.removeChild(clone);
  }
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

  const canvas = await captureFullContent(contentElement);

  const imgData = canvas.toDataURL('image/png');
  
  const contentWidth = PAGE_WIDTH - MARGIN * 2;
  const imgWidth = contentWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const date = new Date();
  const dateStr = date.toLocaleDateString();
  const timeStr = date.toLocaleTimeString();

  const pxPerMm = canvas.height / imgHeight;
  const contentMaxHeightPx = CONTENT_MAX_HEIGHT * pxPerMm;

  const pageSplits: number[] = [0];
  let currentPos = 0;
  
  while (currentPos + contentMaxHeightPx < canvas.height) {
    const targetSplitY = currentPos + contentMaxHeightPx;
    const bestSplitY = findBestSplitPosition(canvas, targetSplitY, pxPerMm);
    pageSplits.push(bestSplitY);
    currentPos = bestSplitY;
  }
  
  if (currentPos < canvas.height) {
    pageSplits.push(canvas.height);
  }

  const totalPages = pageSplits.length - 1;

  for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
    if (currentPage > 1) {
      doc.addPage();
    }

    const pageInfo = `第 ${currentPage} 页 / 共 ${totalPages} 页`;
    const headerImgData = await createHeaderCanvas(molecule.name, pageInfo);
    doc.addImage(headerImgData, 'PNG', 0, 0, PAGE_WIDTH, HEADER_HEIGHT);

    const pageContentStartPx = pageSplits[currentPage - 1];
    const pageContentEndPx = pageSplits[currentPage];
    const pageContentHeightPx = pageContentEndPx - pageContentStartPx;

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
