import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Genera un PDF formal de Cotización / Presupuesto
 * @param {Object} quote Datos del presupuesto
 * @param {Object} settings Ajustes del negocio (empresa, rif, teléfono, tasa)
 * @param {'download' | 'open' | 'blob'} action Acción a ejecutar
 */
export function generateQuotePdf(quote, settings, action = 'download') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Colores del sistema
  const primaryColor = [0, 168, 132]; // Emerald #00a884
  const darkColor = [15, 23, 42];     // Slate 900
  const grayColor = [100, 116, 139];  // Slate 500

  // 1. Encabezado Corporativo
  doc.setFillColor(...darkColor);
  doc.rect(0, 0, 210, 32, 'F');

  // Nombre de la Empresa
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const companyName = settings?.company_name || 'FERRETERÍA HEBERT';
  doc.text(companyName.toUpperCase(), 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  const rif = settings?.company_rif ? `RIF: ${settings.company_rif}` : 'SISTEMA POS & INVENTARIO';
  const phone = settings?.company_phone ? ` | Tel: ${settings.company_phone}` : '';
  const address = settings?.company_address ? ` | ${settings.company_address}` : '';
  doc.text(`${rif}${phone}${address}`, 14, 23);

  // Distintivo de Cotización Superior Derecha
  doc.setFillColor(...primaryColor);
  doc.roundedRect(140, 7, 56, 18, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('COTIZACIÓN', 168, 14, { align: 'center' });
  doc.setFontSize(12);
  doc.text(quote.quote_number || 'COT-00000', 168, 21, { align: 'center' });

  // 2. Tarjetas de Información (Cliente & Detalles de Emisión)
  doc.setTextColor(...darkColor);

  // Tarjeta Cliente
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 38, 110, 32, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryColor);
  doc.text('DATOS DEL CLIENTE', 18, 44);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...darkColor);
  doc.text(quote.customer_name || 'Cliente Mostrador', 18, 51);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...grayColor);
  let yOffset = 57;
  if (quote.customer_ci || quote.customer_id_card) {
    doc.text(`C.I. / RIF: ${quote.customer_ci || quote.customer_id_card}`, 18, yOffset);
    yOffset += 5;
  }
  if (quote.customer_phone) {
    doc.text(`Teléfono / WhatsApp: ${quote.customer_phone}`, 18, yOffset);
  }

  // Tarjeta Detalles de Emisión
  doc.roundedRect(130, 38, 66, 32, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryColor);
  doc.text('DETALLES DE EMISIÓN', 134, 44);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...darkColor);
  const quoteDate = quote.created_at ? new Date(quote.created_at) : new Date();
  doc.text(`Fecha: ${quoteDate.toLocaleDateString('es-VE')}`, 134, 51);
  doc.text(`Válido por: 3 días continuos`, 134, 57);
  const tasa = Number(quote.tasa_interna || settings?.tasa_interna || 960);
  doc.text(`Tasa Ref.: Bs. ${tasa.toFixed(2)} / $`, 134, 63);

  // 3. Tabla de Productos
  const tableRows = (quote.items || []).map((item, index) => {
    const qty = parseFloat(item.quantity) || 1;
    const priceUsd = parseFloat(item.price_usd || item.price_usd_tienda) || 0;
    const priceBs = Math.round(priceUsd * tasa * 100) / 100;
    const subtotalUsd = Math.round(priceUsd * qty * 100) / 100;
    const subtotalBs = Math.round(priceBs * qty * 100) / 100;

    return [
      (index + 1).toString(),
      item.product_code || item.code || '-',
      item.product_name || item.name || 'Producto',
      qty.toString(),
      item.unit || 'und',
      `$${priceUsd.toFixed(2)}`,
      `Bs. ${priceBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
      `$${subtotalUsd.toFixed(2)}`,
      `Bs. ${subtotalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
    ];
  });

  autoTable(doc, {
    startY: 76,
    head: [[
      '#',
      'Código',
      'Descripción del Producto',
      'Cant.',
      'Und',
      'P. Unit ($)',
      'P. Unit (Bs)',
      'Subtotal ($)',
      'Subtotal (Bs)'
    ]],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      valign: 'middle'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'left' },
      3: { halign: 'center', cellWidth: 12 },
      4: { halign: 'center', cellWidth: 12 },
      5: { halign: 'right', cellWidth: 20 },
      6: { halign: 'right', cellWidth: 25 },
      7: { halign: 'right', cellWidth: 22, fontStyle: 'bold' },
      8: { halign: 'right', cellWidth: 28, fontStyle: 'bold', textColor: [0, 168, 132] }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  const finalY = doc.lastAutoTable?.finalY || 150;

  // 4. Bloque de Totales
  const totalUsd = Number(quote.total_usd || 0);
  const totalBs = Number(quote.total_bs || totalUsd * tasa);

  const totalsBoxX = 115;
  const totalsBoxY = finalY + 8;
  const totalsBoxW = 81;
  const totalsBoxH = 28;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(totalsBoxX, totalsBoxY, totalsBoxW, totalsBoxH, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...darkColor);
  doc.text('Total en Dólares ($):', totalsBoxX + 4, totalsBoxY + 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`$${totalUsd.toFixed(2)}`, totalsBoxX + totalsBoxW - 4, totalsBoxY + 8, { align: 'right' });

  doc.setDrawColor(226, 232, 240);
  doc.line(totalsBoxX + 4, totalsBoxY + 12, totalsBoxX + totalsBoxW - 4, totalsBoxY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...primaryColor);
  doc.text('TOTAL EN BOLÍVARES:', totalsBoxX + 4, totalsBoxY + 20);
  doc.setFontSize(11.5);
  doc.text(`Bs. ${totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`, totalsBoxX + totalsBoxW - 4, totalsBoxY + 20, { align: 'right' });

  // 5. Condiciones Comerciales
  const notesBoxX = 14;
  const notesBoxY = totalsBoxY;
  const notesBoxW = 95;
  const notesBoxH = totalsBoxH;

  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(251, 191, 36);
  doc.roundedRect(notesBoxX, notesBoxY, notesBoxW, notesBoxH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(146, 64, 14);
  doc.text('CONDICIONES COMERCIALES:', notesBoxX + 3, notesBoxY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(180, 83, 9);
  doc.text('• Los precios en dólares se mantienen durante los 3 días de vigencia.', notesBoxX + 3, notesBoxY + 12);
  doc.text('• Los montos en Bs. se recalculan a la tasa del día al momento del pago.', notesBoxX + 3, notesBoxY + 17);
  if (quote.notes) {
    doc.text(`• Nota: ${quote.notes.substring(0, 48)}`, notesBoxX + 3, notesBoxY + 22);
  } else {
    doc.text('• Formas de pago: Transferencia, Pago Móvil, Divisas en Efectivo, Cashea.', notesBoxX + 3, notesBoxY + 22);
  }

  // 6. Pie de Página
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text('Gracias por su preferencia. Este documento es un presupuesto formal informativo.', 105, 285, { align: 'center' });

  const fileName = `Presupuesto_${quote.quote_number || 'COT'}.pdf`;

  if (action === 'download') {
    doc.save(fileName);
  } else if (action === 'blob') {
    return doc.output('blob');
  } else if (action === 'open') {
    window.open(doc.output('bloburl'), '_blank');
  }

  return doc;
}
