import { useState, useEffect } from 'react';
import { toko as tokoAPI } from '../services/api';
import { Store, Plus, ChevronRight } from 'lucide-react';

function PilihToko({ onSelect }) {
  const [tokos, setTokos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [namaToko, setNamaToko] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { fetchTokos(); }, []);

  const fetchTokos = async () => {
    try { setLoading(true); const res = await tokoAPI.getAll(); setTokos(res.data.data || []); } 
    catch (err) { setError('Gagal memuat daftar toko'); } 
    finally { setLoading(false); }
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
    <div className="min-h-screen bg-[#0A0B14] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0B14] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-5 shadow-2xl shadow-purple-500/20 rotate-3 hover:rotate-0 transition-transform duration-300">
            <Store size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">ResiApp</h1>
          <p className="text-sm text-gray-400 mt-2">Pilih toko untuk memulai</p>
        </div>

        {/* Card */}
        <div className="bg-[#111322] border border-white/5 rounded-2xl p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 text-rose-400 text-sm rounded-xl border border-rose-500/20 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0"></span>
              {error}
            </div>
          )}

          {showForm ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">Nama Toko Baru</label>
                <input type="text" value={namaToko} onChange={(e) => setNamaToko(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#1A1D2E] text-white border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Contoh: Toko Elektronik A" autoFocus />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit"
                  className="flex-1 bg-purple-600 text-white py-2.5 rounded-xl hover:bg-purple-700 text-sm font-semibold transition-all shadow-lg shadow-purple-500/20">
                  Simpan
                </button>
                <button type="button" onClick={() => { setShowForm(false); setNamaToko(''); setError(''); }}
                  className="flex-1 bg-white/5 text-gray-400 py-2.5 rounded-xl hover:bg-white/10 text-sm font-semibold transition-all">
                  Batal
                </button>
              </div>
            </form>
          ) : (
            <div>
              {tokos.length === 0 ? (
                <div className="text-center py-10">
                  <Store size={40} className="mx-auto text-gray-500 mb-3" />
                  <p className="text-gray-400 text-sm">Belum ada toko</p>
                  <p className="text-gray-500 text-xs mt-1">Buat toko baru untuk memulai</p>
                </div>
              ) : (
                <div className="space-y-2 mb-5 max-h-52 overflow-y-auto pr-1 custom-scroll">
                  {tokos.map((t) => (
                    <button key={t.id} onClick={() => onSelect(t)}
                      className="w-full group flex items-center gap-3 px-4 py-3.5 bg-white/5 border border-white/5 hover:border-purple-500/30 hover:bg-purple-500/10 rounded-xl transition-all text-left">
                      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center text-purple-400 font-bold text-sm shrink-0">
                        {t.nama_toko.substring(0, 1).toUpperCase()}
                      </div>
                      <span className="flex-1 font-semibold text-gray-200 group-hover:text-purple-400 transition-colors">{t.nama_toko}</span>
                      <ChevronRight size={18} className="text-gray-500 group-hover:text-purple-400 transition-colors" />
                    </button>
                  ))}
                </div>
              )}

              <button onClick={() => setShowForm(true)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 text-sm font-semibold transition-all shadow-lg shadow-purple-500/20">
                <Plus size={18} />
                Tambah Toko Baru
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">Aplikasi Manajemen Resi & Keuangan Offline</p>
      </div>
    </div>
  );
}

export default PilihToko;