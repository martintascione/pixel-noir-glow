import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatCurrency } from '@/utils/formatters';

export interface RemitoData {
  cliente: {
    name: string;
    company_name: string;
    cuit: string;
    whatsapp_number?: string;
  };
  items: Array<{
    cantidad: number;
    medida: string;
    producto: string;
    precioUnitario: number;
    precioTotal: number;
  }>;
  total: number;
  fecha: string;
  numero: string;
}

export const generateRemitoPDF = async (remitoData: RemitoData): Promise<Blob> => {
  const pdf = new jsPDF();
  
  // Configuración de fuentes y colores
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text('REMITO', 105, 20, { align: 'center' });
  
  // Información de la empresa
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Hierros Tascione', 20, 40);
  pdf.text(`Fecha: ${remitoData.fecha}`, 20, 50);
  pdf.text(`Remito N°: ${remitoData.numero}`, 20, 60);
  
  // Información del cliente
  pdf.setFont('helvetica', 'bold');
  pdf.text('CLIENTE:', 20, 80);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${remitoData.cliente.name}`, 20, 90);
  pdf.text(`${remitoData.cliente.company_name}`, 20, 100);
  pdf.text(`CUIT: ${remitoData.cliente.cuit}`, 20, 110);
  
  // Tabla de productos
  const startY = 130;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Cant.', 20, startY);
  pdf.text('Medida', 50, startY);
  pdf.text('Producto', 100, startY);
  pdf.text('P. Unit.', 150, startY);
  pdf.text('Total', 175, startY);
  
  // Línea separadora
  pdf.line(20, startY + 5, 190, startY + 5);
  
  // Items
  pdf.setFont('helvetica', 'normal');
  let currentY = startY + 15;
  
  remitoData.items.forEach((item, index) => {
    pdf.text(item.cantidad.toString(), 20, currentY);
    pdf.text(item.medida, 50, currentY);
    pdf.text(item.producto, 100, currentY);
    pdf.text(formatCurrency(item.precioUnitario), 150, currentY);
    pdf.text(formatCurrency(item.precioTotal), 175, currentY);
    currentY += 10;
  });
  
  // Total
  pdf.line(20, currentY + 5, 190, currentY + 5);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`TOTAL: ${formatCurrency(remitoData.total)}`, 150, currentY + 15);
  
  return pdf.output('blob');
};

export const generateRemitoJPG = async (elementId: string): Promise<Blob> => {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Elemento no encontrado');
  
  // Configurar dimensiones estándar para el remito
  const fixedWidth = 420;
  
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 3, // Escala alta para mejor calidad
    useCORS: true,
    allowTaint: true,
    width: fixedWidth,
    removeContainer: true,
    foreignObjectRendering: false,
    scrollX: 0,
    scrollY: 0,
    onclone: (clonedDoc) => {
      const clonedElement = clonedDoc.getElementById(elementId);
      if (clonedElement) {
        // Remover todas las transformaciones y contenedores responsivos
        clonedElement.style.transform = 'none';
        clonedElement.style.scale = '1';
        clonedElement.style.width = `${fixedWidth}px`;
        clonedElement.style.maxWidth = `${fixedWidth}px`;
        clonedElement.style.minWidth = `${fixedWidth}px`;
        clonedElement.style.position = 'static';
        clonedElement.style.overflow = 'visible';
        clonedElement.style.margin = '0';
        clonedElement.style.padding = '0';
        clonedElement.style.boxSizing = 'border-box';
        
        // Remover estilos responsivos del elemento padre si existen
        const parentElements = clonedElement.closest('[class*="max-w"]');
        if (parentElements) {
          const parent = parentElements as HTMLElement;
          parent.style.maxWidth = 'none';
          parent.style.width = 'auto';
          parent.style.transform = 'none';
        }
        
        // Asegurar que todos los elementos internos mantengan su estilo
        const allChildren = clonedElement.querySelectorAll('*');
        allChildren.forEach((child) => {
          const childElement = child as HTMLElement;
          childElement.style.transform = 'none';
          childElement.style.scale = '1';
        });
      }
    }
  });
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
    }, 'image/jpeg', 0.95);
  });
};

export const sendToWhatsApp = (phoneNumber: string, message: string) => {
  // Limpiar el número de teléfono
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
};

export const downloadFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};