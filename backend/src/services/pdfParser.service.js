const { PDFParse } = require('pdf-parse');
const fs = require('fs');

/**
 * Parsing teks mentah dari file PDF resi Shopee
 * @param {string} filePath 
 * @returns {Promise<object>}
 */
async function parseResiPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfParser = new PDFParse({ data: dataBuffer });
    const textResult = await pdfParser.getText();
    const teks = textResult.text;

    // Pattern regex disesuaikan dengan template umum resi Shopee
    // 1. No Resi
    // Pola: "No. Resi: SPXID0291928" atau "No. Resi SPXID..." dll.
    const noResiMatch = teks.match(/No\.?\s*Resi[:\s]*([A-Z0-9\-]+)/i) || 
                        teks.match(/([A-Z0-9]{10,20})/); // Fallback string panjang alfanumerik

    // 2. No Pesanan
    // Pola: "No. Pesanan: 230912ABCDE"
    const noPesananMatch = teks.match(/No\.?\s*Pesanan[:\s]*([A-Z0-9]+)/i) ||
                           teks.match(/Pesanan\s*No[:\s]*([A-Z0-9]+)/i);

    // 3. Penerima (Nama & Alamat)
    // Pola: "Penerima: [Nama]" diikuti baris baru alamat
    const penerimaMatch = teks.match(/Penerima[:\s]+([^\n\r]+)/i);
    const penerimaNama = penerimaMatch ? penerimaMatch[1].trim() : null;

    // Alamat Penerima
    // Mencari block alamat setelah Penerima hingga baris Pengirim atau batas lain
    let penerimaAlamat = null;
    const alamatStartIndex = teks.indexOf('Penerima:');
    if (alamatStartIndex !== -1) {
      const alamatSlice = teks.substring(alamatStartIndex, alamatStartIndex + 300);
      const lines = alamatSlice.split('\n').map(l => l.trim()).filter(Boolean);
      // Ambil 3-4 baris setelah baris pertama "Penerima"
      if (lines.length > 2) {
        penerimaAlamat = lines.slice(2, 6).join(' ');
      }
    }

    // 4. Pengirim
    const pengirimMatch = teks.match(/Pengirim[:\s]+([^\n\r]+)/i) ||
                          teks.match(/Dari[:\s]+([^\n\r]+)/i);
    const pengirim = pengirimMatch ? pengirimMatch[1].trim() : null;

    // 5. Berat
    // Pola: "Berat: 1.2 kg" atau "1200 gr"
    const beratMatch = teks.match(/Berat[:\s]*([\d\.,]+)\s*(kg|gr|g)/i);
    let berat = 0.1; // Default
    if (beratMatch) {
      const nilai = parseFloat(beratMatch[1].replace(',', '.'));
      const satuan = beratMatch[2].toLowerCase();
      berat = (satuan === 'kg') ? nilai : nilai / 1000;
    }

    // 6. Parsing Item / Rincian Produk
    // Mencari teks di antara "Rincian Pesanan" atau "Nama Produk" sampai batas bawah (misal "Total", "Catatan")
    const items = [];
    const itemSectionMatch = teks.match(/Rincian\s*Pesanan([\s\S]*?)(Total|Catatan|Kurir|Shopee|Pembayaran)/i) ||
                             teks.match(/Nama\s*Produk([\s\S]*?)(Total|Catatan|Kurir)/i);

    if (itemSectionMatch) {
      const sectionText = itemSectionMatch[1];
      const lines = sectionText.split('\n').map(l => l.trim()).filter(Boolean);

      // Algoritma parsing item sederhana
      // Biasanya format item: [Nama Produk] [Variasi] [Qty]
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Cek jika baris mengandung Qty (biasanya didahului "x" atau angka di ujung)
        const qtyMatch = line.match(/x\s*(\d+)/i) || line.match(/[\s]+(\d+)$/);
        if (qtyMatch) {
          const qty = parseInt(qtyMatch[1], 10);
          let nama_produk = line.replace(qtyMatch[0], '').trim();
          let variasi = null;

          // Cek baris berikutnya apakah merupakan variasi produk
          if (i + 1 < lines.length && !lines[i + 1].match(/x\s*(\d+)/i)) {
            variasi = lines[i + 1].trim();
            i++; // skip baris variasi
          }

          items.push({
            nama_produk,
            variasi,
            qty
          });
        }
      }
    }

    // Jika parsing item gagal, buat fallback item dummy agar transaksi tetap bisa dicatat
    if (items.length === 0) {
      items.push({
        nama_produk: 'Produk Tanpa Nama (Gagal Parsing)',
        variasi: '-',
        qty: 1
      });
    }

    return {
      no_resi: noResiMatch ? noResiMatch[1].trim() : 'UNKNOWN_RESI_' + Date.now(),
      no_pesanan: noPesananMatch ? noPesananMatch[1].trim() : 'UNKNOWN_PESANAN_' + Date.now(),
      penerima_nama: penerimaNama || 'Pelanggan Shopee',
      penerima_alamat: penerimaAlamat || 'Alamat tidak terdeteksi',
      pengirim: pengirim || 'Toko Shopee',
      berat: berat,
      tanggal_pesan: new Date(), // default tanggal hari ini
      items: items
    };

  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Gagal memproses file PDF: ' + error.message);
  }
}

module.exports = { parseResiPDF };
