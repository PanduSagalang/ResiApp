const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const BASE_DIR = 'D:/SINERGIA ELEKTRIK/Customer Offline';

function getCustomerDir(customerName) {
  const dir = path.join(BASE_DIR, customerName);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getNextInvoiceNumber(customerDir) {
  let max = 0;
  if (fs.existsSync(customerDir)) {
    const files = fs.readdirSync(customerDir);
    for (const f of files) {
      const m = f.match(/INVl0*(\d+)/i);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > max) max = n;
      }
    }
  }
  return max + 1;
}

function invoiceFileName(num) {
  const n = String(num).padStart(3, '0');
  const now = new Date();
  const monthRoman = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'][now.getMonth()];
  const year = now.getFullYear();
  return `INVl${n}SE${monthRoman}${year}.pdf`;
}

/**
 * Generate PDF nota offline
 */
function generatePDF(data, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // === HEADER ===
      doc.fontSize(18).font('Helvetica-Bold').text('NOTA', 40, 40);
      doc.fontSize(9).font('Helvetica');
      doc.text(`No. Invoice: ${data.no_invoice}`, 40, 65);
      doc.text(`Tanggal: ${data.tgl}`, 40, 78);
      doc.text(`Kepada: ${data.pembeli}`, 40, 91);
      if (data.alamat) doc.text(`Alamat: ${data.alamat}`, 40, 104);

      // === ITEMS TABLE ===
      const tableTop = data.alamat ? 130 : 115;
      const colX = [40, 120, 340, 400, 470];
      const colW = [75, 215, 55, 65, 75];

      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('No', colX[0], tableTop, { width: colW[0] });
      doc.text('Nama Barang', colX[1], tableTop, { width: colW[1] });
      doc.text('Qty', colX[2], tableTop, { width: colW[2], align: 'center' });
      doc.text('Harga', colX[3], tableTop, { width: colW[3], align: 'right' });
      doc.text('Subtotal', colX[4], tableTop, { width: colW[4], align: 'right' });

      doc.moveTo(40, tableTop + 14).lineTo(545, tableTop + 14).stroke('#ccc');

      let y = tableTop + 20;
      doc.fontSize(9).font('Helvetica');
      data.items.forEach((item, i) => {
        doc.text(String(i + 1), colX[0], y, { width: colW[0] });
        doc.text(item.nama_produk, colX[1], y, { width: colW[1] });
        doc.text(String(item.qty), colX[2], y, { width: colW[2], align: 'center' });
        doc.text(formatRp(item.harga), colX[3], y, { width: colW[3], align: 'right' });
        doc.text(formatRp(item.subtotal), colX[4], y, { width: colW[4], align: 'right' });
        y += 18;
      });

      // === TOTAL ===
      y += 10;
      doc.moveTo(40, y - 5).lineTo(545, y - 5).stroke('#ccc');
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Total Barang', 40, y, { width: 350, align: 'right' });
      doc.text(formatRp(data.subtotal_barang), 470, y, { width: 75, align: 'right' });
      y += 16;

      if (data.ongkir > 0) {
        doc.fontSize(9).font('Helvetica');
        doc.text('Ongkos Kirim', 40, y, { width: 350, align: 'right' });
        doc.text(formatRp(data.ongkir), 470, y, { width: 75, align: 'right' });
        y += 16;
      }
      if (data.biaya_lain > 0) {
        doc.fontSize(9).font('Helvetica');
        doc.text('Biaya Lain', 40, y, { width: 350, align: 'right' });
        doc.text(formatRp(data.biaya_lain), 470, y, { width: 75, align: 'right' });
        y += 16;
      }
      doc.fontSize(11).font('Helvetica-Bold');
      doc.text('GRAND TOTAL', 40, y, { width: 350, align: 'right' });
      doc.text(formatRp(data.grand_total), 470, y, { width: 75, align: 'right' });

      // === FOOTER ===
      y += 40;
      doc.fontSize(8).font('Helvetica').fillColor('#666');
      doc.text('Terima kasih atas kepercayaan Anda.', 40, y, { align: 'center' });

      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    } catch (err) { reject(err); }
  });
}

function formatRp(n) {
  return 'Rp' + (n || 0).toLocaleString('id-ID');
}

/**
 * Generate Excel nota offline
 */
async function generateExcel(data) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'ResiApp';
  const ws = wb.addWorksheet('NOTA');

  ws.columns = [
    { key: 'a', width: 6 },
    { key: 'b', width: 30 },
    { key: 'c', width: 8 },
    { key: 'd', width: 15 },
    { key: 'e', width: 18 },
  ];

  const clrHeader = 'D9D9D9';
  const clrBody = 'F2EFE9';
  const clrBorder = '808080';

  function styleRow(row, bgColor, fontBold, fontSize) {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.font = { name: 'Calibri', size: fontSize || 10, bold: !!fontBold, color: { argb: '000000' } };
      cell.alignment = { vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: clrBorder } },
        bottom: { style: 'thin', color: { argb: clrBorder } },
        left: { style: 'thin', color: { argb: clrBorder } },
        right: { style: 'thin', color: { argb: clrBorder } },
      };
    });
  }

  ws.mergeCells(1, 1, 1, 5);
  const titleCell = ws.getCell('A1');
  titleCell.value = 'NOTA OFFLINE';
  titleCell.font = { name: 'Calibri', size: 16, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 30;

  ws.mergeCells(2, 1, 2, 3);
  ws.getCell('D2').value = 'Pembeli';
  ws.getCell('D2').alignment = { horizontal: 'right', vertical: 'middle' };
  ws.getCell('D2').font = { name: 'Calibri', size: 11, bold: true };
  ws.mergeCells(2, 4, 2, 5);
  ws.getCell('E2').value = data.pembeli;
  ws.getCell('E2').alignment = { horizontal: 'left', vertical: 'middle' };

  ws.mergeCells(3, 1, 3, 3);
  ws.getCell('D3').value = 'Tanggal';
  ws.getCell('D3').alignment = { horizontal: 'right', vertical: 'middle' };
  ws.getCell('D3').font = { name: 'Calibri', size: 11, bold: true };
  ws.mergeCells(3, 4, 3, 5);
  ws.getCell('E3').value = data.tgl;
  ws.getCell('E3').alignment = { horizontal: 'left', vertical: 'middle' };

  // Alamat optional
  let curRow = 4;
  if (data.alamat) {
    ws.mergeCells(curRow, 1, curRow, 3);
    ws.getCell('D' + curRow).value = 'Alamat';
    ws.getCell('D' + curRow).alignment = { horizontal: 'right' };
    ws.getCell('D' + curRow).font = { bold: true };
    ws.mergeCells(curRow, 4, curRow, 5);
    ws.getCell('E' + curRow).value = data.alamat;
    ws.getCell('E' + curRow).alignment = { horizontal: 'left' };
    curRow++;
  }

  curRow++; // spacer
  // Table header
  const hRow = ws.getRow(curRow);
  hRow.getCell(1).value = 'NO';
  hRow.getCell(2).value = 'NAMA BARANG';
  hRow.getCell(3).value = 'QTY';
  hRow.getCell(4).value = 'HARGA';
  hRow.getCell(5).value = 'SUBTOTAL';
  styleRow(hRow, clrHeader, true, 10);
  hRow.height = 22;
  curRow++;

  data.items.forEach((item, i) => {
    const r = ws.getRow(curRow + i);
    r.getCell(1).value = i + 1;
    r.getCell(2).value = item.nama_produk;
    r.getCell(3).value = item.qty;
    r.getCell(4).value = item.harga;
    r.getCell(4).numFmt = 'Rp #,##0';
    r.getCell(5).value = item.subtotal;
    r.getCell(5).numFmt = 'Rp #,##0';
    styleRow(r, clrBody, false, 10);
    r.height = 20;
  });

  curRow += data.items.length;
  curRow++; // spacer

  const f1 = ws.getRow(curRow);
  ws.mergeCells(curRow, 1, curRow, 4);
  f1.getCell(1).value = 'TOTAL BARANG';
  f1.getCell(1).font = { name: 'Calibri', size: 11, bold: true };
  f1.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
  f1.getCell(5).value = data.subtotal_barang;
  f1.getCell(5).numFmt = 'Rp #,##0';
  f1.getCell(5).font = { bold: true };
  styleRow(f1, clrBody, false, 11);
  curRow++;

  if (data.ongkir > 0) {
    const r = ws.getRow(curRow);
    ws.mergeCells(curRow, 1, curRow, 4);
    r.getCell(1).value = 'ONGKOS KIRIM';
    r.getCell(1).alignment = { horizontal: 'right' };
    r.getCell(5).value = data.ongkir;
    r.getCell(5).numFmt = 'Rp #,##0';
    styleRow(r, clrBody, false, 10);
    curRow++;
  }
  if (data.biaya_lain > 0) {
    const r = ws.getRow(curRow);
    ws.mergeCells(curRow, 1, curRow, 4);
    r.getCell(1).value = 'BIAYA LAIN';
    r.getCell(1).alignment = { horizontal: 'right' };
    r.getCell(5).value = data.biaya_lain;
    r.getCell(5).numFmt = 'Rp #,##0';
    styleRow(r, clrBody, false, 10);
    curRow++;
  }

  curRow++;
  const gf = ws.getRow(curRow);
  ws.mergeCells(curRow, 1, curRow, 4);
  gf.getCell(1).value = 'GRAND TOTAL';
  gf.getCell(1).font = { name: 'Calibri', size: 13, bold: true };
  gf.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
  gf.getCell(5).value = data.grand_total;
  gf.getCell(5).numFmt = 'Rp #,##0';
  gf.getCell(5).font = { name: 'Calibri', size: 13, bold: true };
  styleRow(gf, clrHeader, true, 13);
  gf.height = 28;

  const buf = await wb.xlsx.writeBuffer();
  return buf;
}

module.exports = { getCustomerDir, getNextInvoiceNumber, invoiceFileName, generatePDF, generateExcel, formatRp };