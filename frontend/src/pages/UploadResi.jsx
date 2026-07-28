import { useState } from 'react';
import { upload as uploadAPI } from '../services/api';

function UploadResi({ toko }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files[0];
    if (f) validateAndSet(f);
  };

  const validateAndSet = (f) => {
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['pdf', 'zip'].includes(ext)) { setError('Hanya file PDF dan ZIP yang diperbolehkan'); return; }
    setFile(f); setError(''); setResult(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      setUploading(true); setError('');
      const res = await uploadAPI.send(toko.id, file);
      setResult(res.data); setFile(null);
    } catch (err) { setError(err.response?.data?.message || 'Gagal upload file'); }
    finally { setUploading(false); }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-6">Upload Resi</h1>

      {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-xl">{error}</div>}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`bg-white/80 backdrop-blur-sm border-2 border-dashed rounded-xl text-center transition-all p-8 sm:p-10 shadow-sm ${
          dragActive ? 'border-indigo-500 bg-indigo-50/30' : 'border-gray-300 hover:border-indigo-400'
        }`}
      >
        <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-sm text-gray-500 mb-2">Drag & drop file PDF atau ZIP di sini</p>
        <p className="text-xs text-gray-400 mb-4">atau</p>

        <label className="inline-block cursor-pointer bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-sm transition-all">
          Pilih File
          <input type="file" accept=".pdf,.zip" className="hidden"
            onChange={(e) => { if (e.target.files[0]) validateAndSet(e.target.files[0]); }} />
        </label>

        {file && (
          <div className="mt-4 inline-flex items-center gap-3 bg-indigo-50/50 px-4 py-2 rounded-lg border border-indigo-200">
            <span className="text-sm font-medium text-gray-800">{file.name}</span>
            <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</span>
            <button onClick={() => { setFile(null); setError(''); }} className="text-gray-400 hover:text-rose-500 text-sm ml-1">&times;</button>
          </div>
        )}
      </div>

      {file && (
        <button onClick={handleUpload} disabled={uploading}
          className={`w-full mt-4 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-all ${
            uploading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800'
          }`}>
          {uploading ? 'Mengupload...' : 'Upload & Proses Resi'}
        </button>
      )}

      {result && result.success && (
        <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm font-medium text-emerald-800 mb-2">{result.message}</p>
          {result.data.saved_resis?.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-xs font-medium text-emerald-700">Tersimpan:</p>
              {result.data.saved_resis.map((r) => (
                <p key={r.id} className="text-xs text-emerald-600 font-mono">{r.no_resi} &mdash; {r.no_pesanan}</p>
              ))}
            </div>
          )}
          {result.data.failed?.length > 0 && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs font-medium text-amber-700 mb-1">Gagal diproses:</p>
              {result.data.failed.map((f, i) => (
                <p key={i} className="text-xs text-amber-600">{f.file}: {f.error}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UploadResi;