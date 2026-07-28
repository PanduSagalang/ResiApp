import { useState, useEffect } from 'react';
import { laporan as laporanAPI } from '../services/api';

function LaporanKeuangan({ toko }) {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const start7 = new Date(); start7.setDate(start7.getDate() - 7);
  const [tglMulai, setTglMulai] = useState(start7.toISOString().split('T')[0]);
  const [tglSelesai, setTglSelesai] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (tglMulai && tglSelesai) fetchLaporan();
  }, [tglMulai, tglSelesai, toko.id]);

  const fetchLaporan = async () => {
    try { setLoading(true);
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
      document.body.appendChild(link); link.click(); link.remove();
    } catch (err) { alert('Gagal export CSV'); }
  };

  const fmt = (n) => new Intl.NumberFormat('id-ID').format(n || 0);

  const presets = [
    { label: 'Hari Ini', fn: () => { const t = new Date().toISOString().split('T')[0]; setTglMulai(t); setTglSelesai(t); }},
    { label: 'Bulan Ini', fn: () => { const n = new Date(); const y = n.getFullYear(), m = String(n.getMonth()+1).padStart(2,'0'); setTglMulai(`${y}-${m}-01`); setTglSelesai(`${y}-${m}-${new Date(y, n.getMonth()+1, 0).getDate()}`); }},
    { label: 'Bulan Lalu', fn: () => { const n = new Date(); n.setMonth(n.getMonth()-1); const y = n.getFullYear(), m = String(n.getMonth()+1).padStart(2,'0'); setTglMulai(`${y}-${m}-01`); setTglSelesai(`${y}-${m}-${new Date(y, n.getMonth()+1, 0).getDate()}`); }},
    { label: 'Tahun Ini', fn: () => { const y = new Date().getFullYear(); setTglMulai(`${y}-01-01`); setTglSelesai(`${y}-12-31`); }},
  ];

  const btnBase = 'inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 shadow-sm';

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold text-gray-800">Laporan Keuangan</h1>
        <button onClick={handleExport}
          className={`${btnBase} bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 w-full sm:w-auto`}>
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Export CSV
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-2">
            <label className="text-sm text-gray-500 whitespace-nowrap">Dari:</label>
            <input type="date" value={tglMulai} onChange={(e) => setTglMulai(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-36 sm:w-auto" />
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <label className="text-sm text-gray-500 whitespace-nowrap">Sampai:</label>
            <input type="date" value={tglSelesai} onChange={(e) => setTglSelesai(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-36 sm:w-auto" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {presets.map(p => (
              <button key={p.label} onClick={p.fn}
                className="text-xs px-2.5 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-indigo-100 hover:text-indigo-700 transition-colors font-medium">{p.label}</button>
            ))}
          </div>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            { label: 'Total Pesanan', value: summary.total_pesanan, prefix: '' },
            { label: 'Total Penjualan', value: summary.total_jual, prefix: 'Rp ' },
            { label: 'Penghasilan Kotor', value: summary.total_kotor, prefix: 'Rp ' },
            { label: 'Penghasilan Bersih', value: summary.total_bersih, prefix: 'Rp ' },
          ].map(card => (
            <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 font-medium">{card.label}</p>
              <p className="text-lg font-bold text-gray-800 mt-1">{card.prefix}{fmt(card.value)}</p>
            </div>
          ))}
        </div>
      )}

      {data.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
          <p className="text-sm text-gray-500">Tidak ada data untuk periode ini.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="min-w-[700px] sm:min-w-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-50 to-blue-50">
                    {['Tanggal', 'No Resi', 'Penerima', 'Status', 'HPP', 'Jual', 'Admin', 'PPN', 'Kotor', 'Bersih'].map(h => (
                      <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map((row, i) => (
                    <tr key={i} className="hover:bg-indigo-50/40 transition-colors">
                      <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{row.tanggal_pesan}</td>
                      <td className="px-3 py-3 font-mono text-gray-800 whitespace-nowrap">{row.no_resi}</td>
                      <td className="px-3 py-3 text-gray-600 max-w-[150px] truncate">{row.penerima_nama}</td>
                      <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        row.status === 'aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>{row.status}</span></td>
                      <td className="px-3 py-3 text-right text-gray-600 whitespace-nowrap">{fmt(row.hpp_total)}</td>
                      <td className="px-3 py-3 text-right text-gray-800 font-medium whitespace-nowrap">{fmt(row.harga_jual_total)}</td>
                      <td className="px-3 py-3 text-right text-rose-600 whitespace-nowrap">{fmt(row.admin_fee)}</td>
                      <td className="px-3 py-3 text-right text-rose-600 whitespace-nowrap">{fmt(row.ppn)}</td>
                      <td className="px-3 py-3 text-right text-gray-800 font-medium whitespace-nowrap">{fmt(row.penghasilan_kotor)}</td>
                      <td className="px-3 py-3 text-right font-bold text-emerald-700 whitespace-nowrap">{fmt(row.penghasilan_bersih)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LaporanKeuangan;