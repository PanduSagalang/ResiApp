import { useState, useEffect } from 'react';
import { laporan as laporanAPI } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Package } from 'lucide-react';

function LaporanKeuangan({ toko }) {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const [tglMulai, setTglMulai] = useState(today);
  const [tglSelesai, setTglSelesai] = useState(today);
  const [filterLabel, setFilterLabel] = useState('Hari Ini');

  useEffect(() => {
    if (tglMulai && tglSelesai) fetchData();
  }, [tglMulai, tglSelesai, toko.id]);

  const fetchData = async () => {
    try { setLoading(true);
      const [lap, chart] = await Promise.all([
        laporanAPI.getAll(toko.id, { tgl_mulai: tglMulai, tgl_selesai: tglSelesai }),
        laporanAPI.getChart(toko.id, { tgl_mulai: tglMulai, tgl_selesai: tglSelesai })
      ]);
      setData(lap.data.list || []);
      setSummary(lap.data.summary || null);
      setChartData(chart.data.data || []);
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
  const btnBase = 'inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 shadow-md shadow-black/20';

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent"></div></div>;

  const trend = chartData.length >= 2 ? (chartData[chartData.length-1].kotor - chartData[0].kotor) : 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-purple-500/20 border border-purple-500/20 flex items-center justify-center">
            <DollarSign size={18} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Laporan Keuangan</h1>
            <p className="text-xs text-gray-400">Pantau performa toko {filterLabel}</p>
          </div>
        </div>
        <button onClick={handleExport} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20 hover:-translate-y-0.5">
          Export CSV
        </button>
      </div>

      <div className="bg-[#111322]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <input type="date" value={tglMulai} onChange={(e) => setRange('Filter', e.target.value, tglSelesai)}
              className="bg-[#1A1D2E] text-white px-3 py-2 border border-white/10 rounded-xl text-sm [color-scheme:dark]" />
            <span className="text-gray-400 text-sm">s/d</span>
            <input type="date" value={tglSelesai} onChange={(e) => setRange('Filter', tglMulai, e.target.value)}
              className="bg-[#1A1D2E] text-white px-3 py-2 border border-white/10 rounded-xl text-sm [color-scheme:dark]" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {presets.map(p => (
              <button key={p.label} onClick={p.fn}
                className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${
                  filterLabel === p.label ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' : 'bg-white/5 text-gray-400 hover:bg-purple-500/10 hover:text-purple-400'
                }`}>{p.label}</button>
            ))}
          </div>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Pesanan', value: summary.total_pesanan, prefix: '', icon: <Package size={18} /> },
            { label: 'Total Penjualan', value: summary.total_jual, prefix: 'Rp ' },
            { label: 'Penghasilan Kotor', value: summary.total_kotor, prefix: 'Rp ' },
            { label: 'Penghasilan Bersih', value: summary.total_bersih, prefix: 'Rp ' },
          ].map(card => (
            <div key={card.label} className="bg-[#111322] border border-white/5 rounded-2xl p-4">
              <p className="text-xs text-gray-500 font-medium mb-1">{card.label}</p>
              <p className="text-xl font-bold text-white">{card.prefix}{fmt(card.value)}</p>
            </div>
          ))}
        </div>
      )}

      {chartData.length > 1 && (
        <div className="bg-[#111322]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Tren Penghasilan</h3>
            <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {((trend / (chartData[0]?.kotor || 1)) * 100).toFixed(1)}%
            </div>
          </div>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="kotorGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="bersihGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#1A1D2E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
                  formatter={(val) => `Rp ${fmt(val)}`}
                />
                <Area type="monotone" dataKey="kotor" stroke="#8B5CF6" fill="url(#kotorGrad)" strokeWidth={2} name="Kotor" />
                <Area type="monotone" dataKey="bersih" stroke="#10B981" fill="url(#bersihGrad)" strokeWidth={2} name="Bersih" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {data.length === 0 ? (
        <div className="bg-[#111322] border border-white/5 rounded-xl p-12 text-center">
          <p className="text-sm text-gray-400">Tidak ada data untuk periode ini.</p>
        </div>
      ) : (
        <div className="bg-[#111322] border border-white/5 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-500/20 to-blue-500/20">
                    {['Tanggal', 'No Resi', 'Penerima', 'Status', 'HPP', 'Jual', 'Admin', 'PPN', 'Kotor', 'Bersih'].map(h => (
                      <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.map((row, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-3 py-3 text-gray-400 whitespace-nowrap">{row.tanggal_pesan}</td>
                      <td className="px-3 py-3 font-mono text-gray-100 whitespace-nowrap">{row.no_resi}</td>
                      <td className="px-3 py-3 text-gray-400 max-w-[150px] truncate">{row.penerima_nama}</td>
                      <td className="px-3 py-3"><span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        row.status === 'aktif' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                      }`}>{row.status}</span></td>
                      <td className="px-3 py-3 text-right text-gray-400 whitespace-nowrap">{fmt(row.hpp_total)}</td>
                      <td className="px-3 py-3 text-right text-gray-100 font-medium whitespace-nowrap">{fmt(row.harga_jual_total)}</td>
                      <td className="px-3 py-3 text-right text-rose-400 whitespace-nowrap">{fmt(row.admin_fee)}</td>
                      <td className="px-3 py-3 text-right text-rose-400 whitespace-nowrap">{fmt(row.ppn)}</td>
                      <td className="px-3 py-3 text-right text-gray-100 font-medium whitespace-nowrap">{fmt(row.penghasilan_kotor)}</td>
                      <td className="px-3 py-3 text-right font-bold text-emerald-400 whitespace-nowrap">{fmt(row.penghasilan_bersih)}</td>
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