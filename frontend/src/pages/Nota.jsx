import { useState, useEffect } from 'react';
import { nota as notaAPI } from '../services/api';

function Nota({ toko }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // Filter defaults: minggu ini
  const startWeek = new Date(now);
  startWeek.setDate(now.getDate() - now.getDay());
  const endWeek = new Date(startWeek);
  endWeek.setDate(startWeek.getDate() + 6);

  const [tglMulai, setTglMulai] = useState(startWeek.toISOString().split('T')[0]);
  const [tglSelesai, setTglSelesai] = useState(endWeek.toISOString().split('T')[0]);
  const [filterLabel, setFilterLabel] = useState('Minggu Ini');

  useEffect(() => { fetchNota(); }, [tglMulai, tglSelesai, toko.id]);

  const fetchNota = async () => {
    try {
      setLoading(true);
      const res = await notaAPI.bulanan(toko.id, { tgl_mulai: tglMulai, tgl_selesai: tglSelesai });
      setData(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const setRange = (label, mulai, selesai) => {
    setFilterLabel(label);
    setTglMulai(mulai);
    setTglSelesai(selesai);
  };

  const presets = [
    { label: 'Hari Ini', fn: () => setRange('Hari Ini', today, today) },
    {
      label: 'Minggu Ini',
      fn: () => {
        const s = new Date(); s.setDate(s.getDate() - s.getDay());
        const e = new Date(s); e.setDate(s.getDate() + 6);
        setRange('Minggu Ini', s.toISOString().split('T')[0], e.toISOString().split('T')[0]);
      }
    },
    {
      label: 'Minggu Lalu',
      fn: () => {
        const s = new Date(); s.setDate(s.getDate() - s.getDay() - 7);
        const e = new Date(s); e.setDate(s.getDate() + 6);
        setRange('Minggu Lalu', s.toISOString().split('T')[0], e.toISOString().split('T')[0]);
      }
    },
    { label: 'Bulan Ini', fn: () => {
      const n = new Date();
      const y = n.getFullYear(), m = String(n.getMonth() + 1).padStart(2, '0');
      setRange('Bulan Ini', `${y}-${m}-01`, `${y}-${m}-${new Date(y, n.getMonth() + 1, 0).getDate()}`);
    }},
  ];

  const fmt = (n) => new Intl.NumberFormat('id-ID').format(n || 0);
  const bulanNama = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
    </div>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Nota</h1>
        <div className="flex items-center gap-2">
          <input type="date" value={tglMulai} onChange={(e) => setRange('Filter', e.target.value, tglSelesai)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
          <span className="text-gray-400 text-sm">s/d</span>
          <input type="date" value={tglSelesai} onChange={(e) => setRange('Filter', tglMulai, e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {presets.map(p => (
          <button key={p.label} onClick={p.fn}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
              filterLabel === p.label ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>{p.label}</button>
        ))}
      </div>

      {!data || data.total_resi === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-sm text-gray-500">Tidak ada data untuk periode {filterLabel}.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Nota */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">NOTA</h2>
                <p className="text-sm text-gray-500">{data.toko}</p>
              </div>
              <div className="text-right text-sm">
                <p className="text-gray-500">Periode</p>
                <p className="font-medium">{data.periode}</p>
                <p className="text-gray-400 text-xs mt-1">{data.total_resi} resi</p>
              </div>
            </div>
          </div>

          {/* Tabel Produk Akumulasi */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variasi</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">H.Beli</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">H.Jual</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal Beli</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal Jual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.items.map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-2 font-medium text-gray-900">{item.nama_produk}</td>
                      <td className="px-4 py-2 text-gray-500">{item.variasi || '-'}</td>
                      <td className="px-4 py-2 text-right font-medium">{item.qty}</td>
                      <td className="px-4 py-2 text-right text-gray-600">Rp {fmt(item.harga_beli)}</td>
                      <td className="px-4 py-2 text-right text-gray-600">Rp {fmt(item.harga_jual)}</td>
                      <td className="px-4 py-2 text-right font-medium">Rp {fmt(item.subtotal_beli)}</td>
                      <td className="px-4 py-2 text-right font-medium">Rp {fmt(item.subtotal_jual)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ringkasan */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Ringkasan Keuangan</h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Total HPP (Beli)', value: data.ringkasan.total_hpp, color: 'text-gray-900' },
                { label: 'Total Jual', value: data.ringkasan.total_jual, color: 'text-gray-900' },
                { label: 'Admin Fee', value: data.ringkasan.total_admin, color: 'text-red-600' },
                { label: 'PPN', value: data.ringkasan.total_ppn, color: 'text-red-600' },
                { label: 'Penghasilan Kotor', value: data.ringkasan.total_kotor, color: 'text-gray-900' },
                { label: 'Penghasilan Bersih', value: data.ringkasan.total_bersih, color: 'text-green-700' },
              ].map(r => (
                <div key={r.label} className="bg-gray-50 rounded-md p-3">
                  <p className="text-xs text-gray-500">{r.label}</p>
                  <p className={`text-lg font-semibold ${r.color} mt-1`}>Rp {fmt(r.value)}</p>
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