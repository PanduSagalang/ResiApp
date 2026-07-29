const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');

const ProdukMaster = db.ProdukMaster;
const { getCustomerDir, getNextInvoiceNumber, invoiceFileName, generatePDF, generateExcel } = require('../services/offlineNota.service');
async function getNotaData(tokoId, tglMulai, tglSelesai) {
  const toko = await db.Toko.findByPk(tokoId);
  if (!toko) return null;

  const resis = await db.Resi.findAll({
    where: { toko_id: tokoId,
      tanggal_pesan: { [Op.between]: [tglMulai, tglSelesai] }
    },
    include: [
      { model: db.ResiItem, as: 'items', include: [{ model: db.ProdukMaster, as: 'produk_master' }] },
      { model: db.Transaksi, as: 'transaksi' }
    ],
    order: [['tanggal_pesan', 'ASC']]
  });

  const itemMap = {};
  for (const r of resis) {
    for (const item of r.items) {
      const v = item.produk_master?.variasi || item.variasi || '';
      const key = `${item.nama_produk}|${v}`;
      if (!itemMap[key]) itemMap[key] = { nama_produk: item.nama_produk, variasi: v, qty: 0, harga_beli: 0, harga_jual: 0, subtotal_beli: 0, subtotal_jual: 0, statuses: new Set() };
      itemMap[key].qty += item.qty;
      itemMap[key].statuses.add(r.status);
      const hb = parseFloat(item.produk_master?.harga_beli || 0);
      if (hb > itemMap[key].harga_beli) {
        itemMap[key].harga_beli = hb;
        itemMap[key].harga_jual = hb; // For reseller, jual = hpp
      }
    }
  }

  for (const key in itemMap) {
    itemMap[key].subtotal_beli = itemMap[key].harga_beli * itemMap[key].qty;
    itemMap[key].subtotal_jual = itemMap[key].harga_jual * itemMap[key].qty;
    itemMap[key].status = [...itemMap[key].statuses].join(', ');
    delete itemMap[key].statuses;
  }

  let totalBeli = 0, totalJual = 0, totalAdmin = 0, totalPpn = 0, totalKotor = 0, totalBersih = 0;
  for (const r of resis) {
    if (r.transaksi) {
      const hpp = parseFloat(r.transaksi.hpp_total) || 0;
      totalBeli += hpp;
      totalJual += hpp; // For reseller, jual = hpp
      totalAdmin += 0;
      totalPpn += 0;
      totalKotor += hpp;
      totalBersih += hpp;
    }
  }

  return {
    toko: toko.nama_toko,
    total_resi: resis.length,
    items: Object.values(itemMap).sort((a, b) => a.nama_produk.localeCompare(b.nama_produk)),
    ringkasan: { total_hpp: totalBeli, total_jual: totalJual, total_admin: totalAdmin, total_ppn: totalPpn, total_kotor: totalKotor, total_bersih: totalBersih }
  };
}

/**
 * GET /api/nota/toko/:tokoId/bulanan
 */
router.get('/toko/:tokoId/bulanan', async (req, res) => {
  try {
    const { tokoId } = req.params;
    const { tgl_mulai, tgl_selesai } = req.query;
    let tahun, bulan, tglMulai, tglSelesai;

    if (tgl_mulai && tgl_selesai) {
      tglMulai = tgl_mulai;
      tglSelesai = tgl_selesai;
    } else {
      tahun = parseInt(req.query.tahun) || new Date().getFullYear();
      bulan = parseInt(req.query.bulan) || (new Date().getMonth() + 1);
      tglMulai = `${tahun}-${String(bulan).padStart(2,'0')}-01`;
      const lastDay = new Date(tahun, bulan, 0).getDate();
      tglSelesai = `${tahun}-${String(bulan).padStart(2,'0')}-${lastDay}`;
    }

    const data = await getNotaData(tokoId, tglMulai, tglSelesai);
    if (!data) return res.status(404).json({ success: false, message: 'Toko not found' });

    res.json({ success: true, data: { ...data, periode: `${tglMulai} s/d ${tglSelesai}` } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/nota/toko/:tokoId/export-excel?tgl_mulai=...&tgl_selesai=...
 * Export nota ke Excel (.xlsx) sesuai layout
 */
router.get('/toko/:tokoId/export-excel', async (req, res) => {
  try {
    const { tokoId } = req.params;
    const { tgl_mulai, tgl_selesai } = req.query;
    if (!tgl_mulai || !tgl_selesai) return res.status(400).json({ success: false, message: 'tgl_mulai & tgl_selesai required' });

    // 1 — Active resis → NOTA MINGGUAN sum
    const activeResis = await db.Resi.findAll({
      where: { toko_id: tokoId, status: 'aktif', tanggal_pesan: { [Op.between]: [tgl_mulai, tgl_selesai] } },
      include: [{ model: db.Transaksi, as: 'transaksi' }]
    });
    let totalAktif = 0;
    for (const r of activeResis) {
      totalAktif += parseFloat(r.transaksi?.harga_jual_total || 0);
    }
    const totalResi = activeResis.length;

    // 2 — Retur resis → RETURN DAN CANCEL table (negative items)
    const returResis = await db.Resi.findAll({
      where: { toko_id: tokoId, status: 'retur', tanggal_pesan: { [Op.between]: [tgl_mulai, tgl_selesai] } },
      include: [
        { model: db.Retur, as: 'retur' },
        { model: db.ResiItem, as: 'items', include: [{ model: db.ProdukMaster, as: 'produk_master' }] },
        { model: db.Transaksi, as: 'transaksi' }
      ]
    });

    // Build retur items list with negative values
    const returItems = [];
    for (const rr of returResis) {
      let items = [];
      if (rr.items && rr.items.length > 0) {
        items = rr.items.map(it => {
          const hb = parseFloat(it.produk_master?.harga_beli || 0);
          return { nama: it.nama_produk + (it.variasi ? ' ' + it.variasi : ''), qty: it.qty, nominal: -hb, total: -(hb * it.qty) };
        });
      } else {
        const pot = parseFloat(rr.retur?.jumlah_potongan || 0);
        items = [{ nama: 'RETUR', qty: 0, nominal: 0, total: -pot }];
      }
      returItems.push(...items);
    }

    // 3 — Dibatalkan resis (same concept: negative items of 0 or existing transaksi)
    const cancelResis = await db.Resi.findAll({
      where: { toko_id: tokoId, status: 'dibatalkan', tanggal_pesan: { [Op.between]: [tgl_mulai, tgl_selesai] } },
      include: [{ model: db.ResiItem, as: 'items', include: [{ model: db.ProdukMaster, as: 'produk_master' }] }]
    });
    const cancelItems = [];
    for (const rr of cancelResis) {
      if (rr.items && rr.items.length > 0) {
        rr.items.forEach(it => {
          const hb = parseFloat(it.produk_master?.harga_beli || 0);
          cancelItems.push({ nama: it.nama_produk + (it.variasi ? ' ' + it.variasi : ''), qty: it.qty, nominal: -hb, total: -(hb * it.qty) });
        });
      }
    }

    const allReturCancel = [...returItems, ...cancelItems];

    // Build Excel
    const wb = new ExcelJS.Workbook();
    wb.creator = 'ResiApp';
    const ws = wb.addWorksheet('NOTA', { pageSetup: { orientation: 'portrait', fitToPage: true } });

    ws.columns = [
      { key: 'a', width: 6 },
      { key: 'b', width: 32 },
      { key: 'c', width: 10 },
      { key: 'd', width: 18 },
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

    let r = 1;
    // Row 1: Title NOTA
    ws.mergeCells(1, 1, 1, 5);
    ws.getCell('A1').value = 'NOTA';
    ws.getCell('A1').font = { name: 'Calibri', size: 16, bold: true };
    ws.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 30;

    // Row 2: Tuan / Toko
    ws.mergeCells(2, 1, 2, 3);
    ws.getCell('D2').value = 'Tuan';
    ws.getCell('D2').alignment = { horizontal: 'right', vertical: 'middle' };
    ws.getCell('D2').font = { name: 'Calibri', size: 11, bold: true };
    ws.mergeCells(2, 4, 2, 5);
    const toko = await db.Toko.findByPk(tokoId);
    ws.getCell('E2').value = toko?.nama_toko || 'SINERGIA';
    ws.getCell('E2').alignment = { horizontal: 'left' };
    ws.getCell('E2').font = { name: 'Calibri', size: 11 };

    // Row 3: Tanggal
    ws.mergeCells(3, 1, 3, 3);
    ws.getCell('D3').value = 'Tanggal';
    ws.getCell('D3').alignment = { horizontal: 'right', vertical: 'middle' };
    ws.getCell('D3').font = { name: 'Calibri', size: 11, bold: true };
    ws.mergeCells(3, 4, 3, 5);
    ws.getCell('E3').value = `${tgl_mulai} s/d ${tgl_selesai}`;
    ws.getCell('E3').alignment = { horizontal: 'left' };
    ws.getCell('E3').font = { name: 'Calibri', size: 11 };
    ws.getRow(3).height = 20;

    // === Table 1 (row 5) ===
    r = 5;
    const h1 = ws.getRow(r);
    h1.getCell(1).value = 'NO'; h1.getCell(2).value = 'KETERANGAN'; h1.getCell(3).value = 'TOTAL';
    styleRow(h1, clrHeader, true, 10); h1.height = 22;

    const t1 = [
      [1, 'NOTA MINGGUAN', totalAktif],
      [2, 'NOTA MINGGU LALU', null],
      [3, 'FEE GUDANG', 150000],
      [4, 'SUBSIDI IKLAN', null],
    ];
    t1.forEach((d, i) => {
      const row = ws.getRow(6 + i);
      row.getCell(1).value = d[0];
      row.getCell(2).value = d[1];
      if (d[2] !== null) { row.getCell(3).value = d[2]; row.getCell(3).numFmt = 'Rp #,##0'; }
      styleRow(row, clrBody, false, 10);
      row.height = 20;
    });

    // Separator row 11
    r = 11;
    ws.mergeCells(r, 1, r, 5);
    const sep = ws.getCell('A' + r);
    sep.value = 'RETURN DAN CANCEL';
    sep.font = { name: 'Calibri', size: 11, bold: true };
    sep.alignment = { horizontal: 'center', vertical: 'middle' };
    sep.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: clrHeader } };
    sep.border = {
      top: { style: 'thin', color: { argb: clrBorder } },
      bottom: { style: 'medium', color: { argb: clrBorder } },
      left: { style: 'thin', color: { argb: clrBorder } },
      right: { style: 'thin', color: { argb: clrBorder } },
    };
    for (let c = 1; c <= 5; c++) {
      ws.getCell(r, c).border = {
        top: { style: 'thin', color: { argb: clrBorder } },
        bottom: { style: 'medium', color: { argb: clrBorder } },
        left: { style: 'thin', color: { argb: clrBorder } },
        right: { style: 'thin', color: { argb: clrBorder } },
      };
    }
    ws.getRow(r).height = 24;

    // Table 2 header (row 12)
    r = 12;
    const h2 = ws.getRow(r);
    h2.getCell(1).value = 'NO'; h2.getCell(2).value = 'KETERANGAN'; h2.getCell(3).value = 'JUMLAH'; h2.getCell(4).value = 'NOMINAL'; h2.getCell(5).value = 'TOTAL';
    styleRow(h2, clrHeader, true, 10); h2.height = 22;

    // Table 2 items (row 13+)
    let curRow = 13;
    allReturCancel.forEach((item, i) => {
      const row = ws.getRow(curRow + i);
      row.getCell(1).value = i + 1;
      row.getCell(2).value = item.nama;
      if (item.qty) row.getCell(3).value = item.qty;
      row.getCell(4).value = item.nominal;
      row.getCell(4).numFmt = 'Rp #,##0;(Rp #,##0)';
      row.getCell(5).value = item.total;
      row.getCell(5).numFmt = 'Rp #,##0;(Rp #,##0)';
      styleRow(row, clrBody, false, 10);
      row.height = 20;
    });

    // Fill blank rows up to row 27 (15 items)
    let blankRow = curRow + allReturCancel.length;
    const maxBlanks = 15 - allReturCancel.length;
    for (let i = 0; i < Math.max(0, maxBlanks); i++) {
      const row = ws.getRow(blankRow + i);
      row.getCell(1).value = allReturCancel.length + i + 1;
      row.getCell(5).value = 0;
      row.getCell(5).numFmt = 'Rp #,##0';
      styleRow(row, clrBody, false, 10);
      row.height = 20;
    }
    blankRow += Math.max(0, maxBlanks);
    blankRow++; // spacer

    // Footer: TOTAL KESELURUHAN
    const f1 = ws.getRow(blankRow);
    ws.mergeCells(blankRow, 1, blankRow, 4);
    f1.getCell(1).value = 'TOTAL KESELURUHAN';
    f1.getCell(1).font = { name: 'Calibri', size: 12, bold: true };
    f1.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
    const allNegTotal = allReturCancel.reduce((s, i) => s + i.total, 0);
    f1.getCell(5).value = totalAktif + 150000 + allNegTotal;
    f1.getCell(5).numFmt = 'Rp #,##0';
    f1.getCell(5).font = { name: 'Calibri', size: 12, bold: true };
    styleRow(f1, clrHeader, true, 12);
    f1.height = 26;
    blankRow++;

    const f2 = ws.getRow(blankRow);
    ws.mergeCells(blankRow, 1, blankRow, 4);
    f2.getCell(1).value = 'TOTAL RESI';
    f2.getCell(1).font = { name: 'Calibri', size: 11, bold: true };
    f2.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
    f2.getCell(5).value = totalResi;
    f2.getCell(5).font = { name: 'Calibri', size: 11, bold: true };
    styleRow(f2, clrBody, false, 11);
    f2.height = 22;

    const buf = await wb.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=NOTA-${tgl_mulai}-${tgl_selesai}.xlsx`);
    res.send(buf);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/nota/resi/:resiId
 */
router.get('/resi/:resiId', async (req, res) => {
  try {
    const resi = await db.Resi.findByPk(req.params.resiId, {
      include: [
        { model: db.Toko, as: 'toko' },
        { model: db.ResiItem, as: 'items', include: [{ model: db.ProdukMaster, as: 'produk_master' }] },
        { model: db.Transaksi, as: 'transaksi' }
      ]
    });
    if (!resi) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: resi });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/offline/history', async (req, res) => {
  const fs = require('fs');
  const BASE_DIR = 'D:/SINERGIA ELEKTRIK/Customer Offline';
  const history = [];
  try {
    if (fs.existsSync(BASE_DIR)) {
      const customers = fs.readdirSync(BASE_DIR);
      for (const cust of customers) {
        const custDir = path.join(BASE_DIR, cust);
        if (fs.statSync(custDir).isDirectory()) {
          const files = fs.readdirSync(custDir).filter(f => f.endsWith('.pdf'));
          for (const f of files) {
            const stat = fs.statSync(path.join(custDir, f));
            history.push({ customer: cust, filename: f, date: stat.mtime, size: stat.size });
          }
        }
      }
    }
    history.sort((a,b) => b.date - a.date);
    res.json({ success: true, data: history });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/offline/download', (req, res) => {
  const { customer, filename } = req.query;
  const BASE_DIR = 'D:/SINERGIA ELEKTRIK/Customer Offline';
  const p = path.join(BASE_DIR, customer, filename);
  if (require('fs').existsSync(p)) {
    res.download(p);
  } else {
    res.status(404).send('File not found');
  }
});

/**
 * POST /api/nota/offline/:tokoId
 * Buat nota transaksi offline (tanpa PPN)
 * Body: { pembeli, alamat, ongkir, biaya_lain, items: [{ produk_master_id, nama, qty, harga }] }
 * Response: { data: {...}, pdf_path, xlsx_buffer }
 */
router.post('/offline/:tokoId', async (req, res) => {
  try {
    const { tokoId } = req.params;
    const { pembeli, alamat, ongkir = 0, biaya_lain = 0, items } = req.body;
    if (!pembeli || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
    }

    // Grab product names from DB for dropdown, but allow manual override
    const ids = items.map(i => i.produk_master_id).filter(Boolean);
    const produk = ids.length > 0 ? await ProdukMaster.findAll({ where: { id: ids, toko_id: tokoId } }) : [];
    const produkMap = {};
    produk.forEach(p => { produkMap[p.id] = p; });

    const detailItems = [];
    let subtotal_barang = 0;
    for (const item of items) {
      const p = item.produk_master_id ? produkMap[item.produk_master_id] : null;
      const nama_produk = item.nama || (p ? p.nama_produk + (p.variasi ? ' ' + p.variasi : '') : '');
      const harga = parseFloat(String(item.harga).replace(/,/g, '')) || (p ? parseFloat(p.harga_beli) : 0);
      const qty = parseInt(item.qty) || 1;
      const sub = harga * qty;
      detailItems.push({ nama_produk, qty, harga, subtotal: sub });
      subtotal_barang += sub;
    }

    const ongkirNum = parseFloat(ongkir) || 0;
    const biayaLainNum = parseFloat(biaya_lain) || 0;
    const grandTotal = subtotal_barang + ongkirNum + biayaLainNum;

    // Generate invoice number & file
    const customerDir = getCustomerDir(pembeli);
    const invoiceNum = getNextInvoiceNumber(customerDir);
    const pdfName = invoiceFileName(invoiceNum);
    const pdfPath = path.join(customerDir, pdfName);

    const data = {
      no_invoice: pdfName.replace('.pdf', ''),
      tgl: new Date().toISOString().split('T')[0],
      pembeli,
      alamat: alamat || '',
      items: detailItems,
      subtotal_barang,
      ongkir: ongkirNum,
      biaya_lain: biayaLainNum,
      grand_total: grandTotal
    };

    await generatePDF(data, pdfPath);

    // Also return Excel
    const xlsxBuf = await generateExcel(data);

    res.json({
      success: true,
      data: {
        ...data,
        message: `Nota ${pembeli}: Rp${grandTotal.toLocaleString('id-ID')}`,
        file: pdfPath,
        xlsx: xlsxBuf.toString('base64')
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;