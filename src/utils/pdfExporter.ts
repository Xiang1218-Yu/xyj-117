import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Molecule, PDFExportConfig } from '../types';

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 10;

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

  let heightLeft = imgHeight;
  let position = MARGIN + 20;

  doc.setFillColor(10, 22, 40);
  doc.rect(0, 0, PAGE_WIDTH, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('分子性质报告', MARGIN, 16);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`分子: ${molecule.name}`, MARGIN, 22);

  doc.addImage(imgData, 'PNG', MARGIN, position, imgWidth, imgHeight);
  heightLeft -= (PAGE_HEIGHT - MARGIN - 20);

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + MARGIN;
    doc.addPage();
    
    doc.setFillColor(10, 22, 40);
    doc.rect(0, 0, PAGE_WIDTH, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('分子性质报告', MARGIN, 16);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`分子: ${molecule.name}`, MARGIN, 22);
    
    doc.addImage(imgData, 'PNG', MARGIN, position, imgWidth, imgHeight);
    heightLeft -= (PAGE_HEIGHT - MARGIN - 20);
  }

  const date = new Date();
  const totalPages = doc.getNumberOfPages();
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(10);
    doc.text(`第 ${i} 页 / 共 ${totalPages} 页`, PAGE_WIDTH - MARGIN - 25, 22, { align: 'right' });
    
    doc.setFillColor(240, 240, 240);
    doc.rect(0, PAGE_HEIGHT - 12, PAGE_WIDTH, 12, 'F');
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `由分子性质计算器生成于 ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`,
      MARGIN,
      PAGE_HEIGHT - 4
    );
  }
  
  const fileName = `${molecule.name.replace(/\s+/g, '_')}_性质报告.pdf`;
  doc.save(fileName);
}
