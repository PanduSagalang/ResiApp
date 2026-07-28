import { useState, useEffect } from 'react';
import { nota as notaAPI } from '../services/api';

function Nota({ toko }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const startWeek = new Date(now);
  startWeek.setDate(now.getDate() - now.getDay());
  const endWeek = new Date(startWeek);
  endWeek.setDate(startWeek.getDate() + 6);

  const [tglMulai, setTglMulai] = useState(startWeek.toISOString().split('T')[0]);
  const [tglSelesai, setTglSelesai] = useState(endWeek.toISOString().split('T')[0]);
  const [filterLabel, setFilterLabel] = useState('Minggu Ini');

  useEffect(() => { fetchNota(); }, [tglMulai, tglSelesai, toko.id]);

  const fetchNota = async () => {
    try { setLoading(true);
      const res = await notaAPI.bulanan(toko.id, { tgl_mulai: tglMulai, tgl_selesai: tglSelesai });
      setData(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleExport = async () => {
    try {
      const res = await notaAPI.exportExcel(toko.id, { tgl_mulai: tglMulai, tgl_selesai: tglSelesai });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `NOTA-${tglMulai}-${tglSelesai}.xlsx`);
      document.body.appendChild(link); link.click(); link.remove();
    } catch (err) { alert('Gagal export Excel'); }
  };

  const setRange = (label, mulai, selesai) => { setFilterLabel(label); setTglMulai(mulai); setTglSelesai(selesai); };

  const presets = [
    { label: 'Hari Ini', fn: () => setRange('Hari Ini', today, today) },
    { label: 'Minggu Ini', fn: () => { const s = new Date(); s.setDate(s.getDate() - s.getDay()); const e = new Date(s); e.setDate(e.getDate() + 6); setRange('Minggu Ini', s.toISOString().split('T')[0], e.toISOString().split('T')[0]); }},
    { label: 'Minggu Lalu', fn: () => { const s = new Date(); s.setDate(s.getDate() - s.getDay() - 7); const e = new Date(s); e.setDate(e.getDate() + 6); setRange('Minggu Lalu', s.toISOString().split('T')[0], e.toISOString().split('T')[0]); }},
    { label: 'Bulan Ini', fn: () => { const n = new Date(); const y = n.getFullYear(), m = String(n.getMonth() + 1).padStart(2,'0'); setRange('Bulan Ini', `${y}-${m}-01`, `${y}-${m}-${new Date(y, n.getMonth()+1, 0).getDate()}`); }},
  ];

  const fmt = (n) => new Intl.NumberFormat('id-ID').format(n || 0);
  const btnBase = 'inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 shadow-sm';

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold text-gray-800">Nota</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <input type="date" value={tglMulai} onChange={(e) => setRange('Filter', e.target.value, tglSelesai)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-36" />
            <span className="text-gray-400 text-sm">s/d</span>
            <input type="date" value={tglSelesai} onChange={(e) => setRange('Filter', tglMulai, e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-36" />
          </div>
          <button onClick={handleExport}
            className={`${btnBase} bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 w-full sm:w-auto`}>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export Excel
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6">
        {presets.map(p => (
          <button key={p.label} onClick={p.fn}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterLabel === p.label
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700'
            }`}>{p.label}</button>
        ))}
      </div>

      {!data || data.total_resi === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
          <p className="text-sm text-gray-500">Tidak ada data untuk periode {filterLabel}.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div><h2 className="text-lg font-bold text-gray-800">NOTA</h2><p className="text-sm text-gray-500">{data.toko}</p></div>
              <div className="text-right"><p className="text-sm text-gray-500">Periode</p><p className="font-semibold text-gray-800">{data.periode}</p><p className="text-gray-400 text-xs mt-1">{data.total_resi} resi</p></div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <div className="min-w-[700px] sm:min-w-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-50 to-blue-50">
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Produk</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Variasi</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Qty</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">H.Beli</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">H.Jual</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Sub. Beli</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Sub. Jual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.items.map((item, i) => (
                      <tr key={i} className="hover:bg-indigo-50/40 transition-colors">
                        <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                        <td className="px-3 py-2 font-medium text-gray-800">{item.nama_produk}</td>
                        <td className="px-3 py-2 text-gray-500">{item.variasi || '-'}</td>
                        <td className="px-3 py-2 text-right font-medium">{item.qty}</td>
                        <td className="px-3 py-2 text-right text-gray-600">Rp {fmt(item.harga_beli)}</td>
                        <td className="px-3 py-2 text-right text-gray-600">Rp {fmt(item.harga_jual)}</td>
                        <td className="px-3 py-2 text-right font-medium">Rp {fmt(item.subtotal_beli)}</td>
                        <td className="px-3 py-2 text-right font-medium">Rp {fmt(item.subtotal_jual)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Ringkasan Keuangan</h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {[
                { label: 'Total HPP', value: data.ringkasan.total_hpp, color: 'text-gray-800' },
                { label: 'Total Jual', value: data.ringkasan.total_jual, color: 'text-gray-800' },
                { label: 'Admin Fee', value: data.ringkasan.total_admin, color: 'text-rose-600' },
                { label: 'PPN', value: data.ringkasan.total_ppn, color: 'text-rose-600' },
                { label: 'Kotor', value: data.ringkasan.total_kotor, color: 'text-gray-800' },
                { label: 'Bersih', value: data.ringkasan.total_bersih, color: 'text-emerald-700' },
              ].map(r => (
                <div key={r.label} className="bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-xl p-4 border border-indigo-100/50">
                  <p className="text-xs text-gray-500 font-medium">{r.label}</p>
                  <p className={`text-lg font-bold ${r.color} mt-1`}>Rp {fmt(r.value)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Nota;