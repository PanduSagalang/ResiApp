const express = require('express');
const router = express.Router();
const db = require('../../models');
const { PDFDocument, rgb } = require('pdf-lib');

/**
 * GET /api/nota/:resiId
 * Generate nota transaksi dalam bentuk PDF
 */
router.get('/:resiId', async (req, res) => {
  try {
    const resi = await db.Resi.findByPk(req.params.resiId, {
      include: [
        { model: db.Toko, as: 'toko' },
        { model: db.ResiItem, as: 'items' },
        { model: db.Transaksi, as: 'transaksi' }
      ]
    });

    if (!resi) return res.status(404).json({ success: false, message: 'Not found' });

    // Build PDF minimal (pdf-lib)
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([400, 600]);
    const { width, height } = page.getSize();
    
    let y = height - 50;
    const drawText = (t, size=12, x=50) => {
      page.drawText(t, { x, y, size, color: rgb(0,0,0) });
      y -= size + 5;
    };

    drawText(`NOTA PESANAN: ${resi.no_pesanan}`, 16);
    drawText(`Toko: ${resi.toko ? resi.toko.nama_toko : '-'}`);
    drawText(`Tanggal: ${resi.tanggal_pesan}`);
    y -= 10;
    
    drawText(`Kepada: ${resi.penerima_nama}`, 14);
    drawText(`${resi.penerima_alamat}`, 10);
    y -= 10;
    
    drawText('Rincian Produk:', 14);
    resi.items.forEach(item => {
      drawText(`- ${item.qty}x ${item.nama_produk} (${item.variasi || '-'})`, 10);
    });
    
    y -= 10;
    if (resi.transaksi) {
      drawText(`Harga Jual Total : Rp ${resi.transaksi.harga_jual_total}`);
      if (resi.status === 'retur') {
        drawText(`Potongan Retur   : Rp ${resi.transaksi.potongan_retur}`, 12, 50, rgb(0.8, 0, 0));
      }
    }

    const pdfBytes = await pdfDoc.save();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Nota-${resi.no_pesanan}.pdf`);
    res.send(Buffer.from(pdfBytes));
    
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
