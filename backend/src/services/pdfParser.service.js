const { PDFParse } = require('pdf-parse');
const fs = require('fs');

/**
 * Parse 1 block teks resi (format SPXID Sinergia)
 */
function parseBlock(t) {
  t = t.trim();
  if (!t) return null;

  // Resi: SPXID...
  const noResi = (t.match(/Resi:\s*([A-Z0-9]+)/i) || [])[1];
  if (!noResi) return null;

  // Penerima
  let penerimaNama = null, penerimaAlamat = null;
  const pm = t.match(/Penerima:\s*[^\n]+/);
  if (pm) {
    const afterPenerima = t.substring(t.indexOf(pm[0]));
    const lines = afterPenerima.split('\n').map(l => l.trim()).filter(Boolean);
    // Baris 0: "Penerima: \tNamaToko ..."
    penerimaNama = lines[0].replace(/^Penerima:\s*/, '').replace(/\s+…$/, '').trim();
    // Cari nomor HP
    let hpIdx = -1;
    for (let i = 1; i < lines.length; i++) {
      if (/^628\d{7,}/.test(lines[i])) { hpIdx = i; break; }
    }
    // Nama penerima sebenarnya = baris setelah HP
    if (hpIdx >= 0 && hpIdx + 1 < lines.length) {
      penerimaNama = lines[hpIdx + 1];
    }
    // Alamat = baris setelah nama
    let addrLines = [];
    for (let i = (hpIdx >= 0 ? hpIdx + 2 : 2); i < lines.length; i++) {
      if (/^Berat:/i.test(lines[i]) || /^# Nama/i.test(lines[i])) break;
      addrLines.push(lines[i]);
    }
    penerimaAlamat = addrLines.filter(Boolean).join(', ');
  }

  // Pengirim
  const pengirim = (t.match(/Pengirim:\s*([^\n]*)/i) || [])[1]?.trim() || null;

  // No Pesanan
  const noPesanan = (t.match(/No\.?\s*Pesanan:\s*([A-Z0-9]+)/i) || [])[1] ||
                    (t.match(/Pesan:\s*\(([A-Z0-9]+)\)/i) || [])[1] || ('SPX' + Date.now());

  // Berat
  let berat = 0.1;
  const bm = t.match(/(\d+[.,]?\d*)\s*(kg|gr|g)\b/i);
  if (bm) {
    const n = parseFloat(bm[1].replace(',', '.'));
    berat = bm[2].toLowerCase() === 'kg' ? n : n / 1000;
  }

  // Tanggal dari Batas Kirim
  let tanggalPesan = new Date();
  const batas = t.match(/Batas\s*Kirim:\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i);
  if (batas) {
    const p = batas[1].split(/[-\/]/);
    if (p.length === 3) tanggalPesan = new Date(`${p[2]}-${p[1]}-${p[0]}`);
  }

  // Items — format tabel
  const items = [];
  const tblIdx = t.indexOf('# Nama Produk');
  if (tblIdx !== -1) {
    const endIdx = t.indexOf('Pesan:', tblIdx);
    const sec = t.substring(tblIdx, endIdx > -1 ? endIdx : tblIdx + 2000);
    const itemLines = sec.split('\n').map(l => l.trim()).filter(Boolean);
    
    let currentItem = null;
    for (const line of itemLines) {
      if (/^# Nama/i.test(line)) continue;
      // Check if line starts with number: "1 ..." or "2 ..."
      const numMatch = line.match(/^(\d+)\s+(.+)/);
      if (numMatch) {
        // Save previous
        if (currentItem && currentItem.qty) items.push(currentItem);
        currentItem = { nama_produk: numMatch[2].trim(), variasi: null, qty: 1 };
      } else if (currentItem) {
        // This line might be variasi + qty: "10A 	1"
        const vqMatch = line.match(/^(.+?)\t+(\d+)$/);
        if (vqMatch) {
          currentItem.variasi = vqMatch[1].trim();
          currentItem.qty = parseInt(vqMatch[2]);
          items.push(currentItem);
          currentItem = null;
        } else {
          // Or continuation of product name — but don't append, replace with shorter
          if (!currentItem.variasi && line.length < 50) {
            currentItem.variasi = line.trim();
          }
        }
      }
    }
    if (currentItem && currentItem.qty) items.push(currentItem);
  }

  return {
    no_resi: noResi.trim(),
    no_pesanan: noPesanan,
    penerima_nama: penerimaNama || 'Pelanggan',
    penerima_alamat: penerimaAlamat || '-',
    pengirim: pengirim || 'Toko',
    berat,
    tanggal_pesan: tanggalPesan,
    items: items.length > 0 ? items : [{ nama_produk: 'Produk', variasi: null, qty: 1 }]
  };
}

/**
 * Parse PDF — return array of resi objects
 */
async function parseResiPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const pdfParser = new PDFParse({ data: dataBuffer });
  const textResult = await pdfParser.getText();
  const fullTeks = textResult.text;

  // Split by "-- N of M --" marker
  const blocks = fullTeks.split(/--\s*\d+\s+of\s+\d+\s*--/);
  let results = blocks.map(b => parseBlock(b)).filter(Boolean);

  if (results.length === 0) {
    const single = parseBlock(fullTeks);
    if (single) results.push(single);
  }

  console.log(`Parsed ${results.length} resi from PDF`);
  return results;
}

module.exports = { parseResiPDF };