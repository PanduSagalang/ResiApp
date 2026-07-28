import { useState, useEffect } from 'react';
import { toko as tokoAPI } from '../services/api';

function PilihToko({ onSelect }) {
  const [tokos, setTokos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [namaToko, setNamaToko] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTokos();
  }, []);

  const fetchTokos = async () => {
    try {
      setLoading(true);
      const res = await tokoAPI.getAll();
      setTokos(res.data.data || []);
    } catch (err) {
      setError('Gagal memuat daftar toko');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!namaToko.trim()) { setError('Nama toko tidak boleh kosong'); return; }
    try {
      const res = await tokoAPI.create({ nama_toko: namaToko });
      setTokos([...tokos, res.data.data]);
      setNamaToko(''); setShowForm(false); setError('');
    } catch (err) { setError(err.response?.data?.message || 'Gagal membuat toko'); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 shadow-sm border border-indigo-200">
            <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">ResiApp</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Manajemen Resi Shopee</p>
        </div>

        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
          {error && <div className="mb-5 p-3 bg-rose-50 text-rose-600 text-sm font-medium rounded-lg border border-rose-100">{error}</div>}

          {showForm ? (
            <form onSubmit={handleCreate} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Toko Baru</label>
                <input type="text" value={namaToko} onChange={(e) => setNamaToko(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                  placeholder="Contoh: Toko Elektronik A" autoFocus />
              </div>
              <div className="flex space-x-3 pt-2">
                <button type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl hover:bg-indigo-700 active:bg-indigo-800 text-sm font-semibold transition-all shadow-sm">
                  Simpan
                </button>
                <button type="button" onClick={() => { setShowForm(false); setNamaToko(''); setError(''); }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl hover:bg-gray-200 hover:text-gray-900 text-sm font-semibold transition-all">
                  Batal
                </button>
              </div>
            </form>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {tokos.length === 0 ? (
                <div className="text-center py-8 mb-4">
                  <p className="text-sm text-gray-500">Belum ada toko.<br/>Buat toko baru untuk memulai.</p>
                </div>
              ) : (
                <div className="space-y-3 mb-6 max-h-[40vh] overflow-y-auto pr-1">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Pilih Toko:</p>
                  {tokos.map((t) => (
                    <button key={t.id} onClick={() => onSelect(t)}
                      className="w-full flex items-center justify-between px-4 py-3.5 border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all text-sm group shadow-sm">
                      <span className="font-semibold text-gray-800 group-hover:text-indigo-700">{t.nama_toko}</span>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  ))}
                </div>
              )}

              <button onClick={() => setShowForm(true)}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 active:bg-indigo-800 text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Tambah Toko Baru
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PilihToko;