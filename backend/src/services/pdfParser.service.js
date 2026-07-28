const { PDFParse } = require('pdf-parse');
const fs = require('fs');

function parseBlock(t) {
  t = t.trim();
  if (!t) return null;

  const noResi = (t.match(/Resi:\s*([A-Z0-9]+)/i) || [])[1];
  if (!noResi) return null;

  // --- Penerima & Alamat ---
  let penerimaNama = null, penerimaAlamat = null;
  const penerimaIdx = t.search(/Penerima:\s*/i);
  if (penerimaIdx !== -1) {
    const afterPenerima = t.substring(penerimaIdx + 'Penerima:'.length).trim();
    const lines = afterPenerima.split('\n').map(l => l.trim()).filter(Boolean);

    // lines[0] might be empty string if Penerima: was on its own line
    // Find first line that's not just empty/tab
    let dataLine = '';
    let lineOffset = 0;
    for (let i = 0; i < lines.length; i++) {
      if (/^Berat:/i.test(lines[i]) || /^# Nama/i.test(lines[i]) || /^No\.?\s*(Pesanan|Resi):/i.test(lines[i])) break;
      if (lines[i].length > 0) {
        dataLine = lines[i];
        lineOffset = i;
        break;
      }
    }

    if (!dataLine) {
      // No data found — leave defaults
      penerimaNama = 'Pelanggan';
      penerimaAlamat = '-';
    } else {
      // Try to find phone number in current line or next lines
      let phoneLine = -1;
      let phoneInLine = false;
      const phoneMatchInline = dataLine.match(/(628\d{7,14})/);
      if (phoneMatchInline) {
        phoneInLine = true;
        const phone = phoneMatchInline[1];
        const idxInStr = phoneMatchInline.index;
        const nameStart = idxInStr + phone.length;
        let rest = dataLine.substring(nameStart).trim();
        const commaIdx = rest.indexOf(',');
        penerimaNama = commaIdx > -1
          ? rest.substring(0, commaIdx).trim()
          : rest.split(/\s+/).slice(0, 4).join(' ');
        let addr = commaIdx > -1 ? rest.substring(commaIdx + 1).trim() : '';
        for (let i = lineOffset + 1; i < lines.length; i++) {
          if (/^Berat:/i.test(lines[i]) || /^# Nama/i.test(lines[i]) || /^No\.?\s*(Pesanan|Resi):/i.test(lines[i])) break;
          addr += (addr ? ', ' : '') + lines[i];
        }
        penerimaAlamat = addr || '-';
      } else {
        // Phone on its own line
        for (let i = lineOffset; i < lines.length; i++) {
          if (/^628\d{7,14}$/.test(lines[i].replace(/\D/g, '')) && lines[i].replace(/\D/g, '').length >= 10) {
            phoneLine = i; break;
          }
        }
        if (phoneLine >= 0 && phoneLine + 1 < lines.length) {
          penerimaNama = lines[phoneLine + 1].replace(/^[,\s]+/, '').replace(/[,\s]+$/, '').trim();
          let addrLines = [];
          for (let i = phoneLine + 2; i < lines.length; i++) {
            if (/^Berat:/i.test(lines[i]) || /^# Nama/i.test(lines[i]) || /^No\.?\s*(Pesanan|Resi):/i.test(lines[i])) break;
            addrLines.push(lines[i]);
          }
          penerimaAlamat = addrLines.filter(Boolean).join(', ') || '-';
        } else {
          // No phone found — first data line is the name
          penerimaNama = dataLine.replace(/^[,\s]+/, '').replace(/[,\s]+$/, '').trim();
          let addrLines = [];
          for (let i = lineOffset + 1; i < lines.length; i++) {
            if (/^Berat:/i.test(lines[i]) || /^# Nama/i.test(lines[i]) || /^No\.?\s*(Pesanan|Resi):/i.test(lines[i])) break;
            addrLines.push(lines[i]);
          }
          penerimaAlamat = addrLines.filter(Boolean).join(', ') || '-';
        }
      }
    }
  }

  const pengirim = (t.match(/Pengirim:\s*([^\n]*)/i) || [])[1]?.trim() || null;
  const noPesanan = (t.match(/No\.?\s*Pesanan:\s*([A-Z0-9]+)/i) || [])[1] ||
                    (t.match(/Pesan:\s*\(([A-Z0-9]+)\)/i) || [])[1] || ('SPX' + Date.now());

  let berat = 0.1;
  const bm = t.match(/(\d+[.,]?\d*)\s*(kg|gr|g)\b/i);
  if (bm) {
    const n = parseFloat(bm[1].replace(',', '.'));
    berat = bm[2].toLowerCase() === 'kg' ? n : n / 1000;
  }

  let tanggalPesan = new Date();
  const batas = t.match(/Batas\s*Kirim:\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i);
  if (batas) {
    const p = batas[1].split(/[-\/]/);
    if (p.length === 3) tanggalPesan = new Date(`${p[2]}-${p[1]}-${p[0]}`);
  }

  // Items
  const items = [];
  const tblIdx = t.indexOf('# Nama Produk');
  if (tblIdx !== -1) {
    const endIdx = t.indexOf('Pesan:', tblIdx);
    const sec = t.substring(tblIdx, endIdx > -1 ? endIdx : tblIdx + 2000);
    const itemLines = sec.split('\n').map(l => l.trim()).filter(Boolean);
    let currentItem = null;
    for (const line of itemLines) {
      if (/^# Nama/i.test(line)) continue;
      const numMatch = line.match(/^(\d+)\s+(.+)/);
      if (numMatch) {
        if (currentItem && currentItem.qty) items.push(currentItem);
        currentItem = { nama_produk: numMatch[2].trim(), variasi: null, qty: 1 };
      } else if (currentItem) {
        const vqMatch = line.match(/^(.+?)\t+(\d+)$/);
        if (vqMatch) {
          currentItem.variasi = vqMatch[1].trim();
          currentItem.qty = parseInt(vqMatch[2]);
          items.push(currentItem);
          currentItem = null;
        } else {
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

async function parseResiPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const pdfParser = new PDFParse({ data: dataBuffer });
  const textResult = await pdfParser.getText();
  const fullTeks = textResult.text;
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