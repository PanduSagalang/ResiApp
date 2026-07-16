'use strict';
const { Parser } = require('json2csv');

/**
 * Export data laporan keuangan ke CSV string
 * @param {Array} rows - array objects dari query laporan
 * @returns {string} CSV string
 */
function exportLaporanCSV(rows) {
  const fields = [
    { label: 'Tanggal', value: 'tanggal_pesan' },
    { label: 'No Resi', value: 'no_resi' },
    { label: 'No Pesanan', value: 'no_pesanan' },
    { label: 'Penerima', value: 'penerima_nama' },
    { label: 'Status', value: 'status' },
    { label: 'HPP (Rp)', value: 'hpp_total' },
    { label: 'Harga Jual (Rp)', value: 'harga_jual_total' },
    { label: 'Admin Fee (Rp)', value: 'admin_fee' },
    { label: 'PPN (Rp)', value: 'ppn' },
    { label: 'Potongan Retur (Rp)', value: 'potongan_retur' },
    { label: 'Penghasilan Kotor (Rp)', value: 'penghasilan_kotor' },
    { label: 'Penghasilan Bersih (Rp)', value: 'penghasilan_bersih' },
  ];
  const parser = new Parser({ fields });
  return parser.parse(rows);
}

module.exports = { exportLaporanCSV };
