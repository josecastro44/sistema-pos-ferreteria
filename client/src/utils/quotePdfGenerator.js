import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Genera un PDF formal de Cotización / Presupuesto adaptado a la moneda y condiciones solicitadas
 * - Divisas ($): 100% en dólares, sin mezclar bolívares ni tasas.
 * - Bolívares (Bs.): Con tasa del día y cláusula obligatoria "Válido únicamente por 24 horas".
 * - Dólares BCV ($ BCV): Con tasa oficial BCV y cláusula 24 horas.
 * - Cashea: Con desglose de inicial y cuotas a tasa BCV.
 *
 * @param {Object} quote Datos del presupuesto
 * @param {Object} settings Ajustes del negocio (empresa, rif, teléfono, tasas)
 * @param {'download' | 'open' | 'blob'} action Acción a ejecutar
 */
export function generateQuotePdf(quote, settings, action = 'download') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Paleta de colores
  const primaryColor = [0, 168, 132]; // Emerald #00a884
  const darkColor = [15, 23, 42];     // Slate 900
  const grayColor = [100, 116, 139];  // Slate 500
  const purpleColor = [126, 34, 206]; // Purple 700
  const amberColor = [180, 83, 9];    // Amber 700

  // Determinación de modo de cotización
  const mode = quote.currency_mode || (quote.is_cashea ? 'cashea' : 'bolivares');
  const isDivisasOnly = mode === 'divisas';
  const isCashea = mode === 'cashea';
  const isBcv = mode === 'bcv';
  const isBolivares = mode === 'bolivares';

  const tasaInterna = Number(quote.tasa_interna || settings?.tasa_interna || 960);
  const tasaBcv = Number(settings?.tasa_bcv || 883.40);
  const casheaPercent = Number(settings?.cashea_percent || 15);

  // 1. Encabezado Corporativo
  doc.setFillColor(...darkColor);
  doc.rect(0, 0, 210, 32, 'F');

  // Nombre de la Empresa
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  const companyName = settings?.company_name || 'FERRETERÍA HEBERT';
  doc.text(companyName.toUpperCase(), 14, 15);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  const rif = settings?.company_rif ? `RIF: ${settings.company_rif}` : 'SISTEMA DE VENTAS & INVENTARIO';
  const phone = settings?.company_phone ? ` | Tel: ${settings.company_phone}` : '';
  const address = settings?.company_address ? ` | ${settings.company_address}` : '';
  doc.text(`${rif}${phone}${address}`, 14, 23);

  // Distintivo de Modalidad Superior Derecha
  let badgeColor = primaryColor;
  let badgeTitle = 'PRESUPUESTO';
  if (isDivisasOnly) {
    badgeColor = [16, 185, 129]; // Emerald green
    badgeTitle = 'SOLO DIVISAS ($)';
  } else if (isCashea) {
    badgeColor = purpleColor;
    badgeTitle = 'MODO CASHEA';
  } else if (isBcv) {
    badgeColor = [79, 70, 229]; // Indigo
    badgeTitle = 'TASA BCV OFICIAL';
  } else {
    badgeColor = [220, 38, 38]; // Red/warning for 24h Bolívares
    badgeTitle = 'VÁLIDO 24 HORAS';
  }

  doc.setFillColor(...badgeColor);
  doc.roundedRect(138, 6, 58, 20, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(badgeTitle, 167, 13, { align: 'center' });
  doc.setFontSize(11);
  doc.text(quote.quote_number || 'COT-00000', 167, 21, { align: 'center' });

  // 2. Banner de Aviso Especial según Modo
  let bannerHeight = 8;
  let bannerY = 35;
  if (isDivisasOnly) {
    doc.setFillColor(236, 253, 245); // Emerald 50
    doc.setDrawColor(52, 211, 153);
    doc.roundedRect(14, bannerY, 182, bannerHeight, 1.5, 1.5, 'FD');
    doc.setTextColor(6, 95, 70);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('PRESUPUESTO – MÉTODO DE PAGO: SOLO VÁLIDO EN DIVISAS (Efectivo / Zelle / Binance) • Precios fijos en USD', 105, bannerY + 5.5, { align: 'center' });
  } else if (isBolivares) {
    doc.setFillColor(254, 242, 242); // Rose 50
    doc.setDrawColor(248, 113, 113);
    doc.roundedRect(14, bannerY, 182, bannerHeight, 1.5, 1.5, 'FD');
    doc.setTextColor(153, 27, 27);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`PRESUPUESTO EN BOLÍVARES – TASA DEL DÍA: Bs. ${tasaInterna.toFixed(2)} • ¡CLÁUSULA OBLIGATORIA: VÁLIDO ÚNICAMENTE POR 24 HORAS!`, 105, bannerY + 5.5, { align: 'center' });
  } else if (isBcv) {
    doc.setFillColor(238, 242, 255); // Indigo 50
    doc.setDrawColor(129, 140, 248);
    doc.roundedRect(14, bannerY, 182, bannerHeight, 1.5, 1.5, 'FD');
    doc.setTextColor(49, 46, 129);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`COTIZACIÓN A TASA OFICIAL BCV: Bs. ${tasaBcv.toFixed(2)} / $ • VÁLIDO POR 24 HORAS`, 105, bannerY + 5.5, { align: 'center' });
  } else if (isCashea) {
    doc.setFillColor(250, 245, 255); // Purple 50
    doc.setDrawColor(192, 132, 252);
    doc.roundedRect(14, bannerY, 182, bannerHeight, 1.5, 1.5, 'FD');
    doc.setTextColor(88, 28, 135);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`COTIZACIÓN TASA BCV – MODALIDAD CASHEA (+${casheaPercent}%) • INICIAL Y 3 CUOTAS • VÁLIDO POR 24 HORAS`, 105, bannerY + 5.5, { align: 'center' });
  }

  // 3. Tarjetas de Información (Cliente & Detalles de Emisión)
  const cardsY = bannerY + bannerHeight + 3;
  const cardsH = 28;

  // Tarjeta Cliente
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, cardsY, 110, cardsH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryColor);
  doc.text('DATOS DEL CLIENTE', 18, cardsY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...darkColor);
  doc.text(quote.customer_name || 'Cliente Mostrador', 18, cardsY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  let yOffset = cardsY + 19;
  if (quote.customer_ci || quote.customer_id_card) {
    doc.text(`C.I. / RIF: ${quote.customer_ci || quote.customer_id_card}`, 18, yOffset);
    yOffset += 4.5;
  }
  if (quote.customer_phone) {
    doc.text(`Teléfono / WhatsApp: ${quote.customer_phone}`, 18, yOffset);
  }

  // Tarjeta Detalles de Emisión
  doc.roundedRect(130, cardsY, 66, cardsH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryColor);
  doc.text('DETALLES DE EMISIÓN', 134, cardsY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...darkColor);
  const quoteDate = quote.created_at ? new Date(quote.created_at) : new Date();
  doc.text(`Fecha: ${quoteDate.toLocaleDateString('es-VE')}`, 134, cardsY + 12);

  if (isDivisasOnly) {
    doc.text(`Moneda: Divisas USD ($)`, 134, cardsY + 17);
    doc.text(`Condición: Precio fijo en $`, 134, cardsY + 22);
  } else if (isBolivares) {
    doc.text(`Tasa Ref.: Bs. ${tasaInterna.toFixed(2)}`, 134, cardsY + 17);
    doc.setTextColor(185, 28, 28);
    doc.setFont('helvetica', 'bold');
    doc.text(`Validez: 24 Horas`, 134, cardsY + 22);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkColor);
  } else if (isBcv) {
    doc.text(`Tasa BCV: Bs. ${tasaBcv.toFixed(2)}`, 134, cardsY + 17);
    doc.text(`Validez: 24 Horas`, 134, cardsY + 22);
  } else if (isCashea) {
    doc.text(`Modalidad: Cashea (+${casheaPercent}%)`, 134, cardsY + 17);
    doc.text(`Tasa BCV: Bs. ${tasaBcv.toFixed(2)}`, 134, cardsY + 22);
  }

  // 4. Tabla de Productos Adaptada según Modo
  let headers = [];
  let tableRows = [];
  let colStyles = {};

  if (isDivisasOnly) {
    // 100% en Dólares, sin mezclar bolívares para no confundir al cliente
    headers = [['#', 'Código', 'Descripción del Producto', 'Cant.', 'Und', 'P. Unitario ($)', 'Subtotal ($)']];
    colStyles = {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 26 },
      2: { halign: 'left' },
      3: { halign: 'center', cellWidth: 16 },
      4: { halign: 'center', cellWidth: 16 },
      5: { halign: 'right', cellWidth: 30 },
      6: { halign: 'right', cellWidth: 35, fontStyle: 'bold', textColor: [0, 168, 132] }
    };

    tableRows = (quote.items || []).map((item, index) => {
      const qty = parseFloat(item.quantity) || 1;
      const priceUsd = parseFloat(item.price_usd || item.price_usd_tienda) || 0;
      const subtotalUsd = Math.round(priceUsd * qty * 100) / 100;

      return [
        (index + 1).toString(),
        item.product_code || item.code || '-',
        item.product_name || item.name || 'Producto',
        qty.toString(),
        item.unit || 'und',
        `$${priceUsd.toFixed(2)}`,
        `$${subtotalUsd.toFixed(2)}`
      ];
    });
  } else if (isBolivares) {
    // Encabezado en Bolívares prominente + Ref en $
    headers = [['#', 'Código', 'Descripción del Producto', 'Cant.', 'Und', 'P. Unit (Bs.)', 'Subtotal (Bs.)', 'Ref. ($)']];
    colStyles = {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 24 },
      2: { halign: 'left' },
      3: { halign: 'center', cellWidth: 14 },
      4: { halign: 'center', cellWidth: 14 },
      5: { halign: 'right', cellWidth: 28 },
      6: { halign: 'right', cellWidth: 36, fontStyle: 'bold', textColor: [0, 168, 132] },
      7: { halign: 'right', cellWidth: 22, textColor: grayColor }
    };

    tableRows = (quote.items || []).map((item, index) => {
      const qty = parseFloat(item.quantity) || 1;
      const priceUsd = parseFloat(item.price_usd || item.price_usd_tienda) || 0;
      const priceBs = Math.round(priceUsd * tasaInterna * 100) / 100;
      const subtotalBs = Math.round(priceBs * qty * 100) / 100;
      const subtotalUsd = Math.round(priceUsd * qty * 100) / 100;

      return [
        (index + 1).toString(),
        item.product_code || item.code || '-',
        item.product_name || item.name || 'Producto',
        qty.toString(),
        item.unit || 'und',
        `Bs. ${priceBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
        `Bs. ${subtotalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
        `$${subtotalUsd.toFixed(2)}`
      ];
    });
  } else if (isBcv) {
    // Cotización Tasa BCV
    headers = [['#', 'Código', 'Descripción del Producto', 'Cant.', 'Und', 'P. ($ BCV)', 'P. (Bs.)', 'Total ($ BCV)', 'Total (Bs.)']];
    colStyles = {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'left' },
      3: { halign: 'center', cellWidth: 12 },
      4: { halign: 'center', cellWidth: 12 },
      5: { halign: 'right', cellWidth: 20 },
      6: { halign: 'right', cellWidth: 25 },
      7: { halign: 'right', cellWidth: 24, fontStyle: 'bold', textColor: [79, 70, 229] },
      8: { halign: 'right', cellWidth: 28, fontStyle: 'bold', textColor: [0, 168, 132] }
    };

    tableRows = (quote.items || []).map((item, index) => {
      const qty = parseFloat(item.quantity) || 1;
      const priceUsdTienda = parseFloat(item.price_usd || item.price_usd_tienda) || 0;
      const priceBs = Math.round(priceUsdTienda * tasaInterna * 100) / 100;
      const priceUsdBcv = Math.round((priceBs / tasaBcv) * 100) / 100;
      const subtotalBs = Math.round(priceBs * qty * 100) / 100;
      const subtotalUsdBcv = Math.round(priceUsdBcv * qty * 100) / 100;

      return [
        (index + 1).toString(),
        item.product_code || item.code || '-',
        item.product_name || item.name || 'Producto',
        qty.toString(),
        item.unit || 'und',
        `$${priceUsdBcv.toFixed(2)}`,
        `Bs. ${priceBs.toLocaleString('es-VE')}`,
        `$${subtotalUsdBcv.toFixed(2)}`,
        `Bs. ${subtotalBs.toLocaleString('es-VE')}`
      ];
    });
  } else {
    // Cashea
    headers = [['#', 'Código', 'Descripción del Producto', 'Cant.', 'Und', 'P. Cashea ($)', 'Subtotal ($)', 'Subtotal (Bs.)']];
    colStyles = {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'left' },
      3: { halign: 'center', cellWidth: 12 },
      4: { halign: 'center', cellWidth: 12 },
      5: { halign: 'right', cellWidth: 28 },
      6: { halign: 'right', cellWidth: 30, fontStyle: 'bold', textColor: purpleColor },
      7: { halign: 'right', cellWidth: 35, fontStyle: 'bold', textColor: [0, 168, 132] }
    };

    tableRows = (quote.items || []).map((item, index) => {
      const qty = parseFloat(item.quantity) || 1;
      const basePrice = parseFloat(item.price_usd || item.price_usd_tienda) || 0;
      const casheaPrice = Math.round(basePrice * (1 + casheaPercent / 100) * 100) / 100;
      const subtotalCashea = Math.round(casheaPrice * qty * 100) / 100;
      const subtotalBs = Math.round(subtotalCashea * tasaBcv * 100) / 100;

      return [
        (index + 1).toString(),
        item.product_code || item.code || '-',
        item.product_name || item.name || 'Producto',
        qty.toString(),
        item.unit || 'und',
        `$${casheaPrice.toFixed(2)}`,
        `$${subtotalCashea.toFixed(2)}`,
        `Bs. ${subtotalBs.toLocaleString('es-VE')}`
      ];
    });
  }

  autoTable(doc, {
    startY: cardsY + cardsH + 4,
    head: headers,
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: isCashea ? [88, 28, 135] : [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      valign: 'middle'
    },
    columnStyles: colStyles,
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  const finalY = doc.lastAutoTable?.finalY || 150;

  // 5. Bloque de Totales Adaptado
  const totalUsd = Number(quote.total_usd || 0);
  const totalBs = Number(quote.total_bs || totalUsd * tasaInterna);

  const totalsBoxX = 115;
  const totalsBoxY = finalY + 6;
  const totalsBoxW = 81;
  const totalsBoxH = isCashea ? 36 : (isDivisasOnly ? 20 : 28);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(totalsBoxX, totalsBoxY, totalsBoxW, totalsBoxH, 2, 2, 'FD');

  if (isDivisasOnly) {
    // Solo Dólares, sin bolívares
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...darkColor);
    doc.text('Total en Dólares ($):', totalsBoxX + 4, totalsBoxY + 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...primaryColor);
    doc.text(`$${totalUsd.toFixed(2)}`, totalsBoxX + totalsBoxW - 4, totalsBoxY + 14, { align: 'right' });
  } else if (isBolivares) {
    // Total en Bolívares como protagonista
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(153, 27, 27);
    doc.text('TOTAL EN BOLÍVARES:', totalsBoxX + 4, totalsBoxY + 8);
    doc.setFontSize(12);
    doc.text(`Bs. ${totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`, totalsBoxX + totalsBoxW - 4, totalsBoxY + 14, { align: 'right' });

    doc.setDrawColor(226, 232, 240);
    doc.line(totalsBoxX + 4, totalsBoxY + 18, totalsBoxX + totalsBoxW - 4, totalsBoxY + 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...grayColor);
    doc.text('Equivalente Ref. en Divisas:', totalsBoxX + 4, totalsBoxY + 24);
    doc.setFont('helvetica', 'bold');
    doc.text(`$${totalUsd.toFixed(2)}`, totalsBoxX + totalsBoxW - 4, totalsBoxY + 24, { align: 'right' });
  } else if (isBcv) {
    const totalUsdBcv = Math.round((totalBs / tasaBcv) * 100) / 100;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(79, 70, 229);
    doc.text('TOTAL TASA BCV ($):', totalsBoxX + 4, totalsBoxY + 8);
    doc.setFontSize(11.5);
    doc.text(`$${totalUsdBcv.toFixed(2)}`, totalsBoxX + totalsBoxW - 4, totalsBoxY + 8, { align: 'right' });

    doc.setDrawColor(226, 232, 240);
    doc.line(totalsBoxX + 4, totalsBoxY + 13, totalsBoxX + totalsBoxW - 4, totalsBoxY + 13);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...primaryColor);
    doc.text('TOTAL EN BOLÍVARES:', totalsBoxX + 4, totalsBoxY + 21);
    doc.setFontSize(11);
    doc.text(`Bs. ${totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`, totalsBoxX + totalsBoxW - 4, totalsBoxY + 21, { align: 'right' });
  } else if (isCashea) {
    // Desglose Cashea
    const inicialUsd = Math.round(totalUsd * 0.40 * 100) / 100;
    const cuotaUsd = Math.round(((totalUsd - inicialUsd) / 3) * 100) / 100;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...purpleColor);
    doc.text('TOTAL FINANCIADO CASHEA:', totalsBoxX + 4, totalsBoxY + 7);
    doc.setFontSize(10.5);
    doc.text(`$${totalUsd.toFixed(2)}`, totalsBoxX + totalsBoxW - 4, totalsBoxY + 7, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...darkColor);
    doc.text('Inicial (40%):', totalsBoxX + 4, totalsBoxY + 15);
    doc.setFont('helvetica', 'bold');
    doc.text(`$${inicialUsd.toFixed(2)} (Bs. ${Math.round(inicialUsd * tasaBcv).toLocaleString('es-VE')})`, totalsBoxX + totalsBoxW - 4, totalsBoxY + 15, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.text('3 Cuotas c/14 días de:', totalsBoxX + 4, totalsBoxY + 22);
    doc.setFont('helvetica', 'bold');
    doc.text(`$${cuotaUsd.toFixed(2)} c/u`, totalsBoxX + totalsBoxW - 4, totalsBoxY + 22, { align: 'right' });

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(...grayColor);
    doc.text(`Calculado a Tasa BCV: Bs. ${tasaBcv.toFixed(2)}`, totalsBoxX + 4, totalsBoxY + 30);
  }

  // 6. Condiciones Comerciales Adaptadas
  const notesBoxX = 14;
  const notesBoxY = totalsBoxY;
  const notesBoxW = 95;
  const notesBoxH = totalsBoxH;

  if (isDivisasOnly) {
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(notesBoxX, notesBoxY, notesBoxW, notesBoxH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(6, 95, 70);
    doc.text('CONDICIONES - SOLO VÁLIDO EN DIVISAS:', notesBoxX + 3, notesBoxY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(4, 120, 87);
    doc.text('• Precios fijos en dólares durante la vigencia del documento.', notesBoxX + 3, notesBoxY + 10.5);
    doc.text('• Métodos aceptados: Dólares en Efectivo, Zelle, Binance USDT.', notesBoxX + 3, notesBoxY + 14.5);
    if (quote.notes) {
      doc.text(`• Nota: ${quote.notes.substring(0, 52)}`, notesBoxX + 3, notesBoxY + 18);
    }
  } else if (isBolivares) {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 202, 202);
    doc.roundedRect(notesBoxX, notesBoxY, notesBoxW, notesBoxH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(153, 27, 27);
    doc.text('⚠️ CLÁUSULA OBLIGATORIA DE VIGENCIA:', notesBoxX + 3, notesBoxY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(185, 28, 28);
    doc.text('• PRESUPUESTO VÁLIDO ÚNICAMENTE POR 24 HORAS continuas.', notesBoxX + 3, notesBoxY + 10.5);
    doc.text(`• Emitido a la tasa del día: Bs. ${tasaInterna.toFixed(2)} por dólar.`, notesBoxX + 3, notesBoxY + 15);
    doc.text('• Pasadas 24h, los montos en Bs. se recalculan a la tasa del momento.', notesBoxX + 3, notesBoxY + 19.5);
    if (quote.notes) {
      doc.text(`• Nota: ${quote.notes.substring(0, 52)}`, notesBoxX + 3, notesBoxY + 24);
    }
  } else if (isBcv) {
    doc.setFillColor(238, 242, 255);
    doc.setDrawColor(199, 210, 254);
    doc.roundedRect(notesBoxX, notesBoxY, notesBoxW, notesBoxH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(49, 46, 129);
    doc.text('CONDICIONES - TASA OFICIAL BCV:', notesBoxX + 3, notesBoxY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(67, 56, 202);
    doc.text(`• Cotización a tasa oficial BCV: Bs. ${tasaBcv.toFixed(2)} / $.`, notesBoxX + 3, notesBoxY + 10.5);
    doc.text('• Válido estrictamente por 24 horas continuas.', notesBoxX + 3, notesBoxY + 15);
    doc.text('• Pagos en bolívares vía Transferencia o Pago Móvil.', notesBoxX + 3, notesBoxY + 19.5);
    if (quote.notes) {
      doc.text(`• Nota: ${quote.notes.substring(0, 52)}`, notesBoxX + 3, notesBoxY + 24);
    }
  } else {
    // Cashea
    doc.setFillColor(250, 245, 255);
    doc.setDrawColor(233, 213, 255);
    doc.roundedRect(notesBoxX, notesBoxY, notesBoxW, notesBoxH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(88, 28, 135);
    doc.text('CONDICIONES - MODALIDAD CASHEA:', notesBoxX + 3, notesBoxY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(107, 33, 168);
    doc.text('• Aprobación sujeta a la línea de compra disponible en la app Cashea.', notesBoxX + 3, notesBoxY + 10.5);
    doc.text(`• Precios calculados a Tasa Oficial BCV: Bs. ${tasaBcv.toFixed(2)}.`, notesBoxX + 3, notesBoxY + 15);
    doc.text('• Válido únicamente por 24 horas continuas.', notesBoxX + 3, notesBoxY + 19.5);
    if (quote.notes) {
      doc.text(`• Nota: ${quote.notes.substring(0, 52)}`, notesBoxX + 3, notesBoxY + 24);
    }
  }

  // 7. Pie de Página Formal
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text('Gracias por su preferencia. Documento proforma formal emitido por Ferretería Hebert.', 105, 285, { align: 'center' });

  const fileName = `Presupuesto_${quote.quote_number || 'COT'}_${mode}.pdf`;

  if (action === 'download') {
    doc.save(fileName);
  } else if (action === 'blob') {
    return doc.output('blob');
  } else if (action === 'open') {
    window.open(doc.output('bloburl'), '_blank');
  }

  return doc;
}