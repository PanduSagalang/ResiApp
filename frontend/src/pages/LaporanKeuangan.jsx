import { useState, useEffect } from 'react';
import { laporan as laporanAPI } from '../services/api';

function LaporanKeuangan({ toko }) {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tglMulai, setTglMulai] = useState('');
  const [tglSelesai, setTglSelesai] = useState('');

  useEffect(() => {
    // Default: bulan ini
    const now = new Date();
    const y = now.getFullYear(), m = String(now.getMonth() + 1).padStart(2, '0');
    setTglMulai(`${y}-${m}-01`);
    setTglSelesai(`${y}-${m}-${new Date(y, now.getMonth() + 1, 0).getDate()}`);
  }, []);

  useEffect(() => {
    if (tglMulai && tglSelesai) fetchLaporan();
  }, [tglMulai, tglSelesai]);

  const fetchLaporan = async () => {
    try {
      setLoading(true);
      const res = await laporanAPI.getAll(toko.id, { tgl_mulai: tglMulai, tgl_selesai: tglSelesai });
      setData(res.data.list || []);
      setSummary(res.data.summary || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await laporanAPI.exportCSV(toko.id, { tgl_mulai: tglMulai, tgl_selesai: tglSelesai });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Laporan-${tglMulai}-${tglSelesai}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Gagal export CSV');
    }
  };

  const fmt = (n) => new Intl.NumberFormat('id-ID').format(n || 0);

  const presets = [
    { label: 'Bulan Ini', fn: () => {
      const n = new Date();
      const y = n.getFullYear(), m = String(n.getMonth() + 1).padStart(2, '0');
      setTglMulai(`${y}-${m}-01`);
      setTglSelesai(`${y}-${m}-${new Date(y, n.getMonth() + 1, 0).getDate()}`);
    }},
    { label: 'Bulan Lalu', fn: () => {
      const n = new Date();
      n.setMonth(n.getMonth() - 1);
      const y = n.getFullYear(), m = String(n.getMonth() + 1).padStart(2, '0');
      setTglMulai(`${y}-${m}-01`);
      setTglSelesai(`${y}-${m}-${new Date(y, n.getMonth() + 1, 0).getDate()}`);
    }},
    { label: 'Tahun Ini', fn: () => {
      const y = new Date().getFullYear();
      setTglMulai(`${y}-01-01`);
      setTglSelesai(`${y}-12-31`);
    }},
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Laporan Keuangan</h2>
        <button
          onClick={handleExport}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Export CSV
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Dari:</label>
            <input type="date" value={tglMulai} onChange={(e) => setTglMulai(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Sampai:</label>
            <input type="date" value={tglSelesai} onChange={(e) => setTglSelesai(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex space-x-2">
            {presets.map(p => (
              <button key={p.label} onClick={p.fn}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Pesanan', value: summary.total_pesanan, prefix: '' },
            { label: 'Total Pendapatan', value: summary.total_jual, prefix: 'Rp ' },
            { label: 'Penghasilan Kotor', value: summary.total_kotor, prefix: 'Rp ' },
            { label: 'Penghasilan Bersih', value: summary.total_bersih, prefix: 'Rp ', highlight: true },
          ].map(card => (
            <div key={card.label} className={`p-4 rounded-lg shadow text-center ${card.highlight ? 'bg-green-600 text-white' : 'bg-white'}`}>
              <p className={`text-sm ${card.highlight ? 'text-green-100' : 'text-gray-500'}`}>{card.label}</p>
              <p className={`text-xl font-bold mt-1 ${card.highlight ? 'text-white' : 'text-gray-800'}`}>
                {card.prefix}{card.prefix ? fmt(card.value) : card.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tabel Detail */}
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : data.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
          Tidak ada data untuk periode ini.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Tanggal','No Resi','Penerima','Status','HPP','Jual','Admin','PPN','Kotor','Bersih'].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{row.tanggal_pesan}</td>
                  <td className="px-3 py-2 font-mono text-gray-800 whitespace-nowrap">{row.no_resi}</td>
                  <td className="px-3 py-2 text-gray-800">{row.penerima_nama}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      row.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700">{fmt(row.hpp_total)}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{fmt(row.harga_jual_total)}</td>
                  <td className="px-3 py-2 text-right text-red-600">{fmt(row.admin_fee)}</td>
                  <td className="px-3 py-2 text-right text-red-600">{fmt(row.ppn)}</td>
                  <td className="px-3 py-2 text-right font-medium text-gray-900">{fmt(row.penghasilan_kotor)}</td>
                  <td className="px-3 py-2 text-right font-bold text-green-700">{fmt(row.penghasilan_bersih)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default LaporanKeuangan;
