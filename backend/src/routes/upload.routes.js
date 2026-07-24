const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../../models');
const { parseResiPDF } = require('../services/pdfParser.service');
const { extractAndParseZip } = require('../services/zipHandler.service');
const { hitungTransaksi, autoMatchProduk } = require('../services/kalkulasi.service');

const Resi = db.Resi;
const ResiItem = db.ResiItem;
const UploadLog = db.UploadLog;
const Toko = db.Toko;

// Konfigurasi Multer untuk upload file
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tokoUploadDir = path.join(uploadsDir, req.params.tokoId);
    if (!fs.existsSync(tokoUploadDir)) {
      fs.mkdirSync(tokoUploadDir, { recursive: true });
    }
    cb(null, tokoUploadDir);
  },
  filename: (req, file, cb) => {
    // Preserve original filename dengan timestamp untuk avoid collision
    const timestamp = Date.now();
    const name = `${timestamp}_${file.originalname}`;
    cb(null, name);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['application/pdf', 'application/zip'];
  const allowedExts = ['.pdf', '.zip'];
  const fileExt = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file PDF dan ZIP yang diperbolehkan'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB
});

/**
 * POST /api/upload/:tokoId
 * Upload file PDF atau ZIP berisi resi Shopee
 */
router.post('/:tokoId', upload.single('file'), async (req, res) => {
  try {
    const { tokoId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'File tidak ditemukan'
      });
    }

    // Validasi toko exists
    const toko = await Toko.findByPk(tokoId);
    if (!toko) {
      // Hapus file yang sudah upload
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Toko tidak ditemukan'
      });
    }

    const fileName = req.file.originalname;
    const fileExt = path.extname(fileName).toLowerCase();
    let parseResults = [];

    try {
      // Parse berdasarkan tipe file
      if (fileExt === '.pdf') {
        // Single PDF
        const parsed = await parseResiPDF(req.file.path);
        parseResults = [
          {
            file: fileName,
            data: parsed,
            status: 'success'
          }
        ];
      } else if (fileExt === '.zip') {
        // Multiple PDF dari ZIP
        const zipResult = await extractAndParseZip(req.file.path);
        parseResults = zipResult.results;

        if (zipResult.failed > 0) {
          console.warn(`ZIP parsing: ${zipResult.success} sukses, ${zipResult.failed} gagal`);
        }
      }

      // Simpan hasil parsing ke database
      const savedResis = [];
      const failedItems = [];

      for (const result of parseResults) {
        if (result.status === 'success') {
          try {
            // Buat record Resi
            const resi = await Resi.create({
              toko_id: tokoId,
              no_resi: result.data.no_resi,
              no_pesanan: result.data.no_pesanan,
              penerima_nama: result.data.penerima_nama,
              penerima_alamat: result.data.penerima_alamat,
              pengirim: result.data.pengirim,
              berat: result.data.berat,
              tanggal_pesan: result.data.tanggal_pesan,
              status: 'aktif',
              file_asal: fileName
            });

            // Buat records ResiItem (produk dalam resi)
            if (result.data.items && result.data.items.length > 0) {
              for (const item of result.data.items) {
                await ResiItem.create({
                  resi_id: resi.id,
                  nama_produk: item.nama_produk,
                  variasi: item.variasi,
                  qty: item.qty
                });
              }
            }

            savedResis.push({
              id: resi.id,
              no_resi: resi.no_resi,
              no_pesanan: resi.no_pesanan
            });

          } catch (dbErr) {
            failedItems.push({
              file: result.file,
              error: dbErr.message
            });
          }
        } else {
          failedItems.push({
            file: result.file,
            error: result.error
          });
        }
      }

      // Buat record UploadLog
      const uploadLog = await UploadLog.create({
        toko_id: tokoId,
        nama_file: fileName,
        jumlah_resi: savedResis.length
      });

      // Auto-match produk dan hitung transaksi
      try {
        await autoMatchProduk(tokoId);
        
        // Hitung transaksi untuk semua resi yang baru diupload
        for (const resiInfo of savedResis) {
          await hitungTransaksi(resiInfo.id);
        }
      } catch (calcErr) {
        console.warn('Auto-matching/kalkulasi warning:', calcErr.message);
        // Tidak throw error, karena upload sudah berhasil
      }

      return res.status(200).json({
        success: true,
        message: `${savedResis.length} resi berhasil diupload`,
        data: {
          upload_log_id: uploadLog.id,
          total_uploaded: savedResis.length,
          saved_resis: savedResis,
          failed: failedItems.length > 0 ? failedItems : null
        }
      });

    } catch (parseErr) {
      console.error('Parse error:', parseErr);
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Gagal memproses file: ' + parseErr.message
      });
    }

  } catch (error) {
    console.error('POST /api/upload error:', error);
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    res.status(500).json({
      success: false,
      message: 'Gagal upload file',
      error: error.message
    });
  }
});

module.exports = router;
