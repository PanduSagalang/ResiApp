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
    if (!['pdf', 'zip'].includes(ext)) {
      setError('Hanya file PDF dan ZIP yang diperbolehkan');
      return;
    }
    setFile(f);
    setError('');
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      setUploading(true);
      setError('');
      const res = await uploadAPI.send(toko.id, file);
      setResult(res.data);
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Upload Resi</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
          {error}
        </div>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`bg-white border-2 border-dashed rounded-lg text-center transition-all p-10 ${
          dragActive ? 'border-gray-900 bg-gray-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <p className="text-sm text-gray-500 mb-4">Drag & drop file PDF atau ZIP di sini</p>
        <p className="text-xs text-gray-400 mb-4">atau</p>

        <label className="inline-block cursor-pointer bg-gray-900 text-white px-5 py-2 rounded-md hover:bg-gray-800 text-sm font-medium transition-colors">
          Pilih File
          <input
            type="file"
            accept=".pdf,.zip"
            className="hidden"
            onChange={(e) => { if (e.target.files[0]) validateAndSet(e.target.files[0]); }}
          />
        </label>

        {file && (
          <div className="mt-4 inline-flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-md border border-gray-200">
            <span className="text-sm font-medium text-gray-900">{file.name}</span>
            <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</span>
            <button onClick={() => { setFile(null); setError(''); }} className="text-gray-400 hover:text-red-500 text-sm ml-2">
              &times;
            </button>
          </div>
        )}
      </div>

      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className={`w-full mt-4 py-2.5 rounded-md text-sm font-medium transition-all ${
            uploading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          {uploading ? 'Mengupload...' : 'Upload & Proses Resi'}
        </button>
      )}

      {result && result.success && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-5">
          <p className="text-sm font-medium text-green-800 mb-2">{result.message}</p>

          {result.data.saved_resis?.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-xs font-medium text-green-700">Tersimpan:</p>
              {result.data.saved_resis.map((r) => (
                <p key={r.id} className="text-xs text-green-600 font-mono">{r.no_resi} &mdash; {r.no_pesanan}</p>
              ))}
            </div>
          )}

          {result.data.failed?.length > 0 && (
            <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-xs font-medium text-yellow-700 mb-1">Gagal diproses:</p>
              {result.data.failed.map((f, i) => (
                <p key={i} className="text-xs text-yellow-600">{f.file}: {f.error}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UploadResi;
