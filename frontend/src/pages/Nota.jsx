import { useState, useEffect } from 'react';
import { nota as notaAPI } from '../services/api';

function Nota({ toko }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const now = new Date();
  const [tahun, setTahun] = useState(now.getFullYear());
  const [bulan, setBulan] = useState(now.getMonth() + 1);

  useEffect(() => { fetchNota(); }, [tahun, bulan, toko.id]);

  const fetchNota = async () => {
    try {
      setLoading(true);
      const res = await notaAPI.bulanan(toko.id, { tahun, bulan });
      setData(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

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
        <h1 className="text-xl font-semibold text-gray-900">Nota Bulanan</h1>
        <div className="flex gap-2">
          <select value={bulan} onChange={(e) => setBulan(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm">
            {bulanNama.map((n, i) => <option key={i} value={i + 1}>{n}</option>)}
          </select>
          <input type="number" value={tahun} onChange={(e) => setTahun(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm w-24" />
        </div>
      </div>

      {!data || data.total_resi === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-sm text-gray-500">Tidak ada data untuk periode ini.</p>
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
                <p className="font-medium">{bulanNama[bulan - 1]} {tahun}</p>
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
                      <td className="px-4 py-2 text-right">{item.qty}</td>
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