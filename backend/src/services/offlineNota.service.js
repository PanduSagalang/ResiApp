const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

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
function generateExcel(data) {
  const wb = XLSX.utils.book_new();
  const wsData = [];

  wsData.push(['NOTA OFFLINE']);
  wsData.push(['No Invoice', data.no_invoice]);
  wsData.push(['Tanggal', data.tgl]);
  wsData.push(['Pembeli', data.pembeli]);
  if (data.alamat) wsData.push(['Alamat', data.alamat]);
  wsData.push([]);
  wsData.push(['No', 'Nama Barang', 'Qty', 'Harga', 'Subtotal']);
  data.items.forEach((item, i) => {
    wsData.push([i + 1, item.nama_produk + (item.variasi ? ' (' + item.variasi + ')' : ''), item.qty, item.harga, item.subtotal]);
  });
  wsData.push([]);
  wsData.push(['Total Barang', '', '', '', data.subtotal_barang]);
  if (data.ongkir > 0) wsData.push(['Ongkos Kirim', '', '', '', data.ongkir]);
  if (data.biaya_lain > 0) wsData.push(['Biaya Lain', '', '', '', data.biaya_lain]);
  wsData.push(['GRAND TOTAL', '', '', '', data.grand_total]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [{ wch: 5 }, { wch: 35 }, { wch: 8 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, ws, 'NOTA');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = { getCustomerDir, getNextInvoiceNumber, invoiceFileName, generatePDF, generateExcel, formatRp };