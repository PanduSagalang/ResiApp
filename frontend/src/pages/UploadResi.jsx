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
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-purple-500/20 rounded-xl flex items-center justify-center shadow-md shadow-black/20 border border-purple-500/20">
          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Upload Resi</h1>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Unggah PDF atau ZIP berisi resi Shopee</p>
        </div>
      </div>

      <div className="bg-[#111322]/80 backdrop-blur-md rounded-2xl shadow-2xl shadow-black/50 border border-white/5 p-6 sm:p-8">
        {error && <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium rounded-xl">{error}</div>}

        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl text-center transition-all duration-200 p-10 sm:p-14 ${
            dragActive ? 'border-indigo-500 bg-indigo-500/10/50 scale-[1.02]' : 'border-white/10 bg-[#1A1D2E]/50 hover:border-indigo-400 hover:bg-[#1A1D2E]'
          }`}
        >
          <div className={`mx-auto h-16 w-16 mb-4 rounded-full flex items-center justify-center transition-colors ${dragActive ? 'bg-purple-500/20 text-indigo-400' : 'bg-[#111322] shadow-md shadow-black/20 border border-white/5 text-gray-400'}`}>
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-300 mb-2">Tarik dan lepas file di sini</p>
          <p className="text-xs text-gray-400 mb-5">Hanya menerima file format PDF atau ZIP</p>

          <label className="inline-block cursor-pointer bg-[#111322] border border-white/10 text-gray-300 px-6 py-2.5 rounded-xl hover:bg-[#1A1D2E] hover:border-indigo-300 hover:text-indigo-400 text-sm font-semibold shadow-md shadow-black/20 transition-all">
            Pilih File
            <input type="file" accept=".pdf,.zip" className="hidden"
              onChange={(e) => { if (e.target.files[0]) validateAndSet(e.target.files[0]); }} />
          </label>
        </div>

        {file && (
          <div className="mt-6 flex items-center justify-between bg-indigo-500/10/50 p-4 rounded-xl border border-purple-500/20 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-indigo-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-100">{file.name}</p>
                <p className="text-xs font-medium text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button onClick={() => { setFile(null); setError(''); }} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        {file && (
          <button onClick={handleUpload} disabled={uploading}
            className={`w-full mt-6 py-3 rounded-xl text-sm font-bold shadow-md transition-all ${
              uploading
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg active:bg-purple-800 hover:-translate-y-0.5'
            }`}>
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses...
              </span>
            ) : 'Upload & Proses Resi'}
          </button>
        )}
      </div>

      {result && result.success && (
        <div className="mt-6 bg-[#111322]/80 backdrop-blur-md rounded-2xl shadow-2xl shadow-black/50 border border-emerald-500/10 p-6 sm:p-8 animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-emerald-500/20/20 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
              <p className="text-base font-bold text-white">{result.message}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {result.data.saved_resis?.length > 0 && (
              <div className="bg-emerald-500/10/50 border border-emerald-500/10 rounded-xl p-4">
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Tersimpan ({result.data.saved_resis.length})</p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2">
                  {result.data.saved_resis.map((r) => (
                    <div key={r.id} className="flex justify-between text-xs bg-white/5 px-3 py-2 rounded-lg border border-emerald-500/10/50">
                      <span className="font-mono font-semibold text-gray-300">{r.no_resi}</span>
                      <span className="text-gray-400">{r.no_pesanan}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {result.data.failed?.length > 0 && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
                <p className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">Gagal Diproses ({result.data.failed.length})</p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2">
                  {result.data.failed.map((f, i) => (
                    <div key={i} className="text-xs bg-white/5 px-3 py-2 rounded-lg border border-rose-500/10 text-rose-400">
                      <span className="font-semibold">{f.file}</span>: {f.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadResi;