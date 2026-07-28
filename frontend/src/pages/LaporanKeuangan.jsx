import { useState, useEffect } from 'react';
import { laporan as laporanAPI } from '../services/api';

function LaporanKeuangan({ toko }) {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const start7 = new Date(); start7.setDate(start7.getDate() - 7);
  const [tglMulai, setTglMulai] = useState(start7.toISOString().split('T')[0]);
  const [tglSelesai, setTglSelesai] = useState(new Date().toISOString().split('T')[0]);
  const [filterLabel, setFilterLabel] = useState('7 Hari Terakhir');

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

  const setRange = (label, mulai, selesai) => { setFilterLabel(label); setTglMulai(mulai); setTglSelesai(selesai); };

  const presets = [
    { label: 'Hari Ini', fn: () => setRange('Hari Ini', new Date().toISOString().split('T')[0], new Date().toISOString().split('T')[0]) },
    { label: 'Bulan Ini', fn: () => { const n = new Date(); const y = n.getFullYear(), m = String(n.getMonth()+1).padStart(2,'0'); setRange('Bulan Ini', `${y}-${m}-01`, `${y}-${m}-${new Date(y, n.getMonth()+1, 0).getDate()}`); }},
    { label: 'Bulan Lalu', fn: () => { const n = new Date(); n.setMonth(n.getMonth()-1); const y = n.getFullYear(), m = String(n.getMonth()+1).padStart(2,'0'); setRange('Bulan Lalu', `${y}-${m}-01`, `${y}-${m}-${new Date(y, n.getMonth()+1, 0).getDate()}`); }},
    { label: 'Tahun Ini', fn: () => { const y = new Date().getFullYear(); setRange('Tahun Ini', `${y}-01-01`, `${y}-12-31`); }},
  ];

  const fmt = (n) => new Intl.NumberFormat('id-ID').format(n || 0);
  const btnBase = 'inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 shadow-sm';

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-100 rounded-xl flex items-center justify-center shadow-sm border border-indigo-200">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Laporan Keuangan</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Rekap untung kotor, bersih, dan filter tanggal</p>
          </div>
        </div>
        
        <button onClick={handleExport}
          className={`${btnBase} bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 w-full sm:w-auto hover:-translate-y-0.5 shadow-md`}>
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Export CSV
        </button>
      </div>

      <div className="bg-white/90 backdrop-blur-md border border-gray-100 rounded-2xl p-4 sm:p-5 mb-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <input type="date" value={tglMulai} onChange={(e) => setRange('Filter', e.target.value, tglSelesai)}
                className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-32 sm:w-auto shadow-sm" />
              <span className="text-gray-400 text-sm">s/d</span>
              <input type="date" value={tglSelesai} onChange={(e) => setRange('Filter', tglMulai, e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-32 sm:w-auto shadow-sm" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {presets.map(p => (
                <button key={p.label} onClick={p.fn}
                  className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${
                    filterLabel === p.label ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700'
                  }`}>{p.label}</button>
              ))}
            </div>
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