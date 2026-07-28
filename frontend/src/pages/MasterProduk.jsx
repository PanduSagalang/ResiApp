import { useState, useEffect } from 'react';
import { produk as produkAPI } from '../services/api';

function MasterProduk({ toko }) {
  const [produks, setProduks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState(null); // { nama: string, variants: [] }
  const [modal, setModal] = useState(null); // { variant?, bulk? }

  useEffect(() => { fetchProduks(); }, [toko.id]);

  const fetchProduks = async () => {
    try { setLoading(true);
      const res = await produkAPI.getAll(toko.id, search);
      setProduks(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // Group by nama_produk
  const groups = {};
  produks.forEach(p => {
    if (!groups[p.nama_produk]) groups[p.nama_produk] = [];
    groups[p.nama_produk].push(p);
  });

  const fmt = (n) => new Intl.NumberFormat('id-ID').format(n || 0);

  const handleSearch = (e) => { e.preventDefault(); fetchProduks(); };

  const openEdit = (p) => setModal({ variant: p });
  const openBulk = (nama) => setModal({ bulk: true, parent: nama });
  const openBulkEdit = (nama, variants) => setModal({ bulkEdit: true, parent: nama, variants });
  const closeModal = () => { setModal(null); fetchProduks(); };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin hapus?')) return;
    try { await produkAPI.delete(id); fetchProduks(); }
    catch (err) { alert('Gagal hapus'); }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-purple-500/20 rounded-xl flex items-center justify-center shadow-md shadow-black/20 border border-purple-500/20">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Master Produk</h1>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Kelola harga, variasi, dan data produk utama</p>
          </div>
        </div>
        <button onClick={() => setModal({ bulk: true, parent: '' })}
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-bold transition-all duration-150 shadow-md bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 hover:-translate-y-0.5">
          + Tambah Produk
        </button>
      </div>

      <form onSubmit={handleSearch} className="bg-[#111322]/80 backdrop-blur-md border border-white/5 rounded-2xl p-4 sm:p-5 mb-6 shadow-2xl shadow-black/50">
        <div className="flex gap-2">
          <input type="text" placeholder="Cari produk..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#1A1D2E] text-white flex-1 px-3 py-2 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-md shadow-black/20" />
          <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 active:bg-purple-800 text-sm font-semibold shadow-md transition-all">Cari</button>
        </div>
      </form>

      {Object.keys(groups).length === 0 ? (
        <div className="bg-[#111322]/80 backdrop-blur-md border border-white/5 rounded-2xl p-12 text-center shadow-2xl shadow-black/50">
          <p className="text-sm text-gray-400">Belum ada produk master.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groups).sort((a,b) => a[0].localeCompare(b[0])).map(([nama, variants]) => (
            <div key={nama} className="bg-[#111322] border border-white/5 rounded-lg overflow-hidden">
              <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-b border-white/5">
                <h3 className="font-semibold text-sm text-gray-100">{nama}</h3>
                <div className="space-x-2">
                  <button onClick={() => openBulkEdit(nama, variants)}
                    className="text-xs px-3 py-1.5 border border-purple-500/20 text-indigo-400 bg-[#111322] rounded-lg hover:bg-purple-500/10 font-medium transition-all shadow-md shadow-black/20">
                    Edit Massal
                  </button>
                  <button onClick={() => openBulk(nama)}
                    className="text-xs px-3 py-1.5 border border-white/5 text-gray-300 bg-[#111322] rounded-lg hover:bg-[#1A1D2E] font-medium transition-all shadow-md shadow-black/20">
                    + Variasi
                  </button>
                </div>
              </div>
              <table className="min-w-full divide-y divide-white/5 text-sm">
                <thead>
                  <tr className="text-xs text-gray-400">
                    <th className="px-4 py-2 text-left">Variasi / Amper</th>
                    <th className="px-4 py-2 text-right">Harga Beli</th>
                    <th className="px-4 py-2 text-right">Harga Jual</th>
                    <th className="px-4 py-2 text-right">Admin %</th>
                    <th className="px-4 py-2 text-right">PPN %</th>
                    <th className="px-4 py-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {variants.sort((a,b) => (a.variasi||'').localeCompare(b.variasi||'')).map(v => (
                    <tr key={v.id} className="hover:bg-[#1A1D2E]">
                      <td className="px-4 py-2 font-mono text-white">{v.variasi || '-'}</td>
                      <td className="px-4 py-2 text-right text-gray-400">Rp {fmt(v.harga_beli)}</td>
                      <td className="px-4 py-2 text-right text-white font-medium">Rp {fmt(v.harga_jual)}</td>
                      <td className="px-4 py-2 text-right text-gray-400">{v.admin_persen}%</td>
                      <td className="px-4 py-2 text-right text-gray-400">{v.ppn_persen}%</td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => openEdit(v)} className="text-indigo-400 hover:text-indigo-800 text-xs mr-3 font-medium">Edit</button>
                        <button onClick={() => handleDelete(v.id)} className="text-rose-400 hover:text-rose-400 text-xs font-medium">Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Modal Edit Variant */}
      {modal?.variant && <ProdukModal
        produk={modal.variant} tokoId={toko.id}
        onClose={closeModal} />
      }

      {/* Modal Bulk Add */}
      {modal?.bulk && <BulkForm
        parent={modal.parent || ''} tokoId={toko.id}
        onClose={closeModal} />
      }

      {/* Modal Bulk Edit */}
      {modal?.bulkEdit && <BulkEditForm
        parent={modal.parent} variants={modal.variants} tokoId={toko.id}
        onClose={closeModal} />
      }
    </div>
  );
}

function ProdukModal({ produk, tokoId, onClose }) {
  const [form, setForm] = useState({
    nama_produk: produk.nama_produk, variasi: produk.variasi || '',
    harga_beli: produk.harga_beli, harga_jual: produk.harga_jual,
    admin_persen: produk.admin_persen, ppn_persen: produk.ppn_persen,
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama_produk.trim()) { setError('Nama produk wajib'); return; }
    try {
      await produkAPI.update(produk.id, form);
      onClose();
    } catch (err) { setError(err.response?.data?.message || 'Gagal'); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Yakin hapus?')) return;
    try { await produkAPI.delete(produk.id); onClose(); }
    catch (err) { alert('Gagal hapus'); }
  };

  return (
    <Overlay onClose={onClose} onSubmit={handleSubmit} title="Edit Produk" error={error} form={form} setForm={setForm}
      isNew={false} onDelete={handleDelete} />
  );
}

function BulkForm({ parent, tokoId, onClose }) {
  const [form, setForm] = useState({
    nama_produk: parent, variasi: '', harga_beli: '', harga_jual: '',
    admin_persen: '', ppn_persen: '',
  });
  const [bulk, setBulk] = useState(''); // multiline: 2A=36500/51000
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const items = [];
      if (form.nama_produk.trim() && form.variasi.trim() && form.harga_beli !== '') {
        items.push({
          nama_produk: form.nama_produk.trim(), variasi: form.variasi.trim(),
          harga_beli: parseFloat(form.harga_beli) || 0, harga_jual: parseFloat(form.harga_jual) || 0,
          admin_persen: parseFloat(form.admin_persen) || 0, ppn_persen: parseFloat(form.ppn_persen) || 0,
        });
      }
      if (bulk.trim()) {
        bulk.split('\n').map(l => l.trim()).filter(Boolean).forEach(line => {
          const parts = line.split(/[=|\/]/);
          if (parts.length >= 2) {
            const variasi = parts[0].trim();
            const prices = parts[1].split('/');
            items.push({
              nama_produk: form.nama_produk.trim(), variasi,
              harga_beli: parseFloat(prices[0]) || 0, harga_jual: parseFloat(prices[1]) || parseFloat(prices[0]) || 0,
              admin_persen: parseFloat(form.admin_persen) || 0, ppn_persen: parseFloat(form.ppn_persen) || 0,
            });
          }
        });
      }
      if (items.length === 0) { setError('Isi minimal 1 variasi'); setSaving(false); return; }
      for (const item of items) {
        await produkAPI.create(tokoId, item);
      }
      onClose();
    } catch (err) { setError(err.response?.data?.message || 'Gagal simpan'); }
    finally { setSaving(false); }
  };

  return (
    <Overlay onClose={onClose} onSubmit={handleSubmit} title="Tambah Produk / Variasi" error={error}
      form={form} setForm={setForm} isNew={true} bulk={bulk} setBulk={setBulk} saving={saving} />
  );
}

function BulkEditForm({ parent, variants, tokoId, onClose }) {
  const [items, setItems] = useState(variants.map(v => ({
    id: v.id, variasi: v.variasi,
    harga_beli: v.harga_beli, harga_jual: v.harga_jual,
    admin_persen: v.admin_persen, ppn_persen: v.ppn_persen
  })));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (id, field, val) => {
    setItems(items.map(it => it.id === id ? { ...it, [field]: val } : it));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await produkAPI.bulkUpdate(items);
      onClose();
    } catch (err) { setError('Gagal edit massal'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-[#111322] rounded-lg shadow-2xl shadow-black/50 max-w-4xl w-full mx-4 max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-white/5 p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Edit Massal: {parent}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-300 text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="p-4 overflow-y-auto flex-1 space-y-3">
            {error && <div className="p-2 bg-red-50 text-red-600 text-sm rounded border border-red-100">{error}</div>}
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr className="bg-[#1A1D2E] text-xs text-gray-400">
                  <th className="px-3 py-2 text-left">Variasi</th>
                  <th className="px-3 py-2 text-left">Harga Beli</th>
                  <th className="px-3 py-2 text-left">Harga Jual</th>
                  <th className="px-3 py-2 text-left">Admin %</th>
                  <th className="px-3 py-2 text-left">PPN %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map(it => (
                  <tr key={it.id}>
                    <td className="px-3 py-2 font-mono">{it.variasi || '-'}</td>
                    <td className="px-3 py-2">
                      <input type="number" value={it.harga_beli} onChange={(e) => handleChange(it.id, 'harga_beli', e.target.value)}
                        className="bg-[#1A1D2E] text-white w-24 px-2 py-1 border border-white/10 rounded text-sm" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" value={it.harga_jual} onChange={(e) => handleChange(it.id, 'harga_jual', e.target.value)}
                        className="bg-[#1A1D2E] text-white w-24 px-2 py-1 border border-white/10 rounded text-sm" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" step="0.01" value={it.admin_persen} onChange={(e) => handleChange(it.id, 'admin_persen', e.target.value)}
                        className="bg-[#1A1D2E] text-white w-16 px-2 py-1 border border-white/10 rounded text-sm" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" step="0.01" value={it.ppn_persen} onChange={(e) => handleChange(it.id, 'ppn_persen', e.target.value)}
                        className="bg-[#1A1D2E] text-white w-16 px-2 py-1 border border-white/10 rounded text-sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-white/5 p-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-white/5 text-gray-300 rounded-lg hover:bg-gray-200 text-sm font-medium transition-all">Batal</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:bg-purple-800 text-sm font-medium shadow-md shadow-black/20 disabled:opacity-50 transition-all">
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Overlay({ onClose, onSubmit, title, error, form, setForm, isNew, onDelete, bulk, setBulk, saving }) {
  const fields = [
    { label: 'Nama Produk *', key: 'nama_produk', type: 'text' },
    { label: 'Variasi (Amper)', key: 'variasi', type: 'text' },
    { label: 'Harga Beli (HPP)', key: 'harga_beli', type: 'number' },
    { label: 'Harga Jual', key: 'harga_jual', type: 'number' },
    { label: 'Admin %', key: 'admin_persen', type: 'number', step: '0.01' },
    { label: 'PPN %', key: 'ppn_persen', type: 'number', step: '0.01' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-[#111322] rounded-lg shadow-2xl shadow-black/50 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-white/5 p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-300 text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="p-4 space-y-3">
            {error && <div className="p-2 bg-red-50 text-red-600 text-sm rounded border border-red-100">{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              {fields.map(f => (
                <div key={f.key} className={f.key === 'nama_produk' ? 'col-span-2' : ''}>
                  <label className="block text-xs font-medium text-gray-400 mb-1">{f.label}</label>
                  <input type={f.type} step={f.step} value={form[f.key]}
                    onChange={(e) => setForm({...form, [f.key]: e.target.value})}
                    required={f.key === 'nama_produk'}
                    className="bg-[#1A1D2E] text-white w-full px-3 py-2 border border-white/10 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              ))}
            </div>
            {setBulk && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Bulk Variasi (satu per baris: <code>2A=36500/51000</code>)
                </label>
                <textarea value={bulk} onChange={(e) => setBulk(e.target.value)}
                  placeholder="2A=36500/51000&#10;4A=36500/51000&#10;6A=36500/51000"
                  className="bg-[#1A1D2E] text-white w-full px-3 py-2 border border-white/10 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono h-24" />
              </div>
            )}
          </div>
          <div className="flex justify-between w-full">
            <div>
              {onDelete && (
                <button type="button" onClick={onDelete}
                  className="px-4 py-2 text-rose-400 hover:text-rose-400 text-sm font-medium hover:bg-rose-500/10 rounded-lg transition-all">Hapus</button>
              )}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={onClose}
                className="px-4 py-2 bg-white/5 text-gray-300 rounded-lg hover:bg-gray-200 text-sm font-medium transition-all">Batal</button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:bg-purple-800 text-sm font-medium shadow-md shadow-black/20 disabled:opacity-50 transition-all">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MasterProduk;