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
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-indigo-100 rounded-xl flex items-center justify-center shadow-sm border border-indigo-200">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Upload Resi</h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Unggah PDF atau ZIP berisi resi Shopee</p>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
        {error && <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-600 text-sm font-medium rounded-xl">{error}</div>}

        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl text-center transition-all duration-200 p-10 sm:p-14 ${
            dragActive ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02]' : 'border-gray-300 bg-gray-50/50 hover:border-indigo-400 hover:bg-gray-50'
          }`}
        >
          <div className={`mx-auto h-16 w-16 mb-4 rounded-full flex items-center justify-center transition-colors ${dragActive ? 'bg-indigo-100 text-indigo-600' : 'bg-white shadow-sm border border-gray-200 text-gray-400'}`}>
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700 mb-2">Tarik dan lepas file di sini</p>
          <p className="text-xs text-gray-500 mb-5">Hanya menerima file format PDF atau ZIP</p>

          <label className="inline-block cursor-pointer bg-white border border-gray-300 text-gray-700 px-6 py-2.5 rounded-xl hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-600 text-sm font-semibold shadow-sm transition-all">
            Pilih File
            <input type="file" accept=".pdf,.zip" className="hidden"
              onChange={(e) => { if (e.target.files[0]) validateAndSet(e.target.files[0]); }} />
          </label>
        </div>

        {file && (
          <div className="mt-6 flex items-center justify-between bg-indigo-50/50 p-4 rounded-xl border border-indigo-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{file.name}</p>
                <p className="text-xs font-medium text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button onClick={() => { setFile(null); setError(''); }} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        {file && (
          <button onClick={handleUpload} disabled={uploading}
            className={`w-full mt-6 py-3 rounded-xl text-sm font-bold shadow-md transition-all ${
              uploading
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg active:bg-indigo-800 hover:-translate-y-0.5'
            }`}>
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
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
        <div className="mt-6 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-emerald-100 p-6 sm:p-8 animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">{result.message}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {result.data.saved_resis?.length > 0 && (
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">Tersimpan ({result.data.saved_resis.length})</p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2">
                  {result.data.saved_resis.map((r) => (
                    <div key={r.id} className="flex justify-between text-xs bg-white/60 px-3 py-2 rounded-lg border border-emerald-100/50">
                      <span className="font-mono font-semibold text-gray-700">{r.no_resi}</span>
                      <span className="text-gray-500">{r.no_pesanan}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {result.data.failed?.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                <p className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-2">Gagal Diproses ({result.data.failed.length})</p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2">
                  {result.data.failed.map((f, i) => (
                    <div key={i} className="text-xs bg-white/60 px-3 py-2 rounded-lg border border-rose-100 text-rose-700">
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