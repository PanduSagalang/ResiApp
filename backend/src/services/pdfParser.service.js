const { PDFParse } = require('pdf-parse');
const fs = require('fs');

function parseSingleResi(teksBlock) {
  const t = teksBlock.trim();
  if (!t) return null;

  const noResi = (t.match(/No\.?\s*Resi[:\s]*([A-Z0-9]+)/i) || [])[1] || null;
  if (!noResi) return null;

  const lines = t.split('\n').map(l => l.trim()).filter(Boolean);
  let penerimaNama = null, penerimaAlamat = null;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/No\.?\s*Resi/i) && i + 1 < lines.length) {
      penerimaNama = lines[i + 1].replace(/\s+/g, ' ').trim();
      let addr = [];
      for (let j = i + 2; j < Math.min(i + 12, lines.length); j++) {
        if (lines[j].match(/^628\d{8,}/) || lines[j].match(/^Berat/i) || lines[j].match(/^# Nama/i)) break;
        addr.push(lines[j].replace(/\s+/g, ' ').trim());
      }
      penerimaAlamat = addr.filter(Boolean).join(', ') || null;
      break;
    }
  }

  const pengirim = (t.match(/Pengirim[:\s]*([^\n]+)/i) || [])[1]?.trim() || null;
  const noPesanan = (t.match(/Pesan[:\s]*\(([A-Z0-9]+)\)/i) || [])[1] || null;

  let berat = 0.1;
  const bm = t.match(/(\d+[.,]?\d*)\s*(kg|gr|g)/i);
  if (bm) {
    const n = parseFloat(bm[1].replace(',', '.'));
    berat = bm[2].toLowerCase() === 'kg' ? n : n / 1000;
  }

  let tanggalPesan = new Date();
  const batas = t.match(/Batas\s*Kirim[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i);
  if (batas) {
    const p = batas[1].split(/[-\/]/);
    if (p.length === 3) tanggalPesan = new Date(`${p[2]}-${p[1]}-${p[0]}`);
  }

  const items = [];
  const idx = t.indexOf('# Nama Produk');
  if (idx !== -1) {
    const end = t.indexOf('Pesan:', idx);
    const sec = t.substring(idx, end > -1 ? end : idx + 1500);
    sec.split('\n').map(l => l.trim()).filter(Boolean).forEach(line => {
      const qtyM = line.match(/(\d+)$/);
      if (qtyM && line.match(/^\d+\s/)) {
        const qty = parseInt(qtyM[1]);
        let nama = line.replace(qtyM[0], '').replace(/^\d+\s+/, '').trim();
        const w = nama.split(/\s+/);
        nama = w.length > 6 ? w.slice(0, 6).join(' ') : nama;
        items.push({ nama_produk: nama || 'Produk', variasi: null, qty });
      }
    });
  }

  return {
    no_resi: noResi,
    no_pesanan: noPesanan || 'SPX' + Date.now(),
    penerima_nama: penerimaNama || 'Pelanggan',
    penerima_alamat: penerimaAlamat || '-',
    pengirim: pengirim || 'Toko',
    berat,
    tanggal_pesan: tanggalPesan,
    items: items.length > 0 ? items : [{ nama_produk: 'Produk', variasi: null, qty: 1 }]
  };
}

async function parseResiPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const pdfParser = new PDFParse({ data: dataBuffer });
  const textResult = await pdfParser.getText();
  const fullTeks = textResult.text;

  const blocks = fullTeks.split(/--\s*\d+\s+of\s+\d+\s*--/);
  let results = blocks.map(b => parseSingleResi(b)).filter(Boolean);

  if (results.length === 0) {
    const single = parseSingleResi(fullTeks);
    if (single) results.push(single);
  }

  return results; // return array
}

module.exports = { parseResiPDF };