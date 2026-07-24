import { useState, useEffect } from 'react';
import { laporan as laporanAPI } from '../services/api';

function LaporanKeuangan({ toko }) {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const [tglMulai, setTglMulai] = useState(today);
  const [tglSelesai, setTglSelesai] = useState(today);

  useEffect(() => {
    if (tglMulai && tglSelesai) fetchLaporan();
  }, [tglMulai, tglSelesai, toko.id]);

  const fetchLaporan = async () => {
    try {
      setLoading(true);
      const res = await laporanAPI.getAll(toko.id, { tgl_mulai: tglMulai, tgl_selesai: tglSelesai });
      setData(res.data.list || []);
      setSummary(res.data.summary || null);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
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
    } catch (err) { alert('Gagal export CSV'); }
  };

  const fmt = (n) => new Intl.NumberFormat('id-ID').format(n || 0);

  const presets = [
    { label: 'Hari Ini', fn: () => {
      const t = new Date().toISOString().split('T')[0];
      setTglMulai(t); setTglSelesai(t);
    }},
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

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Laporan Keuangan</h1>
        <button
          onClick={handleExport}
          className="self-start sm:self-auto bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 text-sm font-medium transition-colors"
        >
          Export CSV
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-500">Dari:</label>
            <input type="date" value={tglMulai} onChange={(e) => setTglMulai(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-500">Sampai:</label>
            <input type="date" value={tglSelesai} onChange={(e) => setTglSelesai(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div className="flex flex-wrap gap-2">
            {presets.map(p => (
              <button key={p.label} onClick={p.fn}
                className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Pesanan', value: summary.total_pesanan, prefix: '' },
            { label: 'Total Penjualan', value: summary.total_jual, prefix: 'Rp ' },
            { label: 'Penghasilan Kotor', value: summary.total_kotor, prefix: 'Rp ' },
            { label: 'Penghasilan Bersih', value: summary.total_bersih, prefix: 'Rp ' },
          ].map(card => (
            <div key={card.label} className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500">{card.label}</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {card.prefix}{card.prefix ? fmt(card.value) : card.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {data.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-sm text-gray-500">Tidak ada data untuk periode ini.</p>
        </div>
      ) : (
        <>
          <div className="sm:hidden space-y-2">
            {data.map((row, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs text-gray-400">{row.tanggal_pesan}</p>
                    <p className="font-mono text-sm font-semibold text-gray-900">{row.no_resi}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${
                    row.status === 'aktif' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-yellow-50 text-yellow-700 ring-yellow-600/20'
                  }`}>{row.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 p-2 rounded"><span className="text-gray-400">HPP</span><br/><span className="font-medium text-gray-700">Rp {fmt(row.hpp_total)}</span></div>
                  <div className="bg-gray-50 p-2 rounded"><span className="text-gray-400">Jual</span><br/><span className="font-medium text-gray-700">Rp {fmt(row.harga_jual_total)}</span></div>
                  <div className="bg-red-50 p-2 rounded"><span className="text-red-500">Admin</span><br/><span className="font-medium text-red-700">Rp {fmt(row.admin_fee)}</span></div>
                  <div className="bg-red-50 p-2 rounded"><span className="text-red-500">PPN</span><br/><span className="font-medium text-red-700">Rp {fmt(row.ppn)}</span></div>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-gray-100">
                  <div><span className="text-xs text-gray-400">Kotor</span><br/><span className="text-sm font-medium text-gray-900">Rp {fmt(row.penghasilan_kotor)}</span></div>
                  <div className="text-right"><span className="text-xs text-gray-400">Bersih</span><br/><span className="text-sm font-semibold text-green-700">Rp {fmt(row.penghasilan_bersih)}</span></div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden sm:block bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    {['Tanggal', 'No Resi', 'Penerima', 'Status', 'HPP', 'Jual', 'Admin', 'PPN', 'Kotor', 'Bersih'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{row.tanggal_pesan}</td>
                      <td className="px-4 py-3 font-mono text-gray-900 whitespace-nowrap">{row.no_resi}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[150px] truncate">{row.penerima_nama}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${
                          row.status === 'aktif' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-yellow-50 text-yellow-700 ring-yellow-600/20'
                        }`}>{row.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 whitespace-nowrap">{fmt(row.hpp_total)}</td>
                      <td className="px-4 py-3 text-right text-gray-600 whitespace-nowrap">{fmt(row.harga_jual_total)}</td>
                      <td className="px-4 py-3 text-right text-red-600 whitespace-nowrap">{fmt(row.admin_fee)}</td>
                      <td className="px-4 py-3 text-right text-red-600 whitespace-nowrap">{fmt(row.ppn)}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 whitespace-nowrap">{fmt(row.penghasilan_kotor)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-700 whitespace-nowrap">{fmt(row.penghasilan_bersih)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default LaporanKeuangan;
