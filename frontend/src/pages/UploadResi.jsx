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
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) validateAndSet(droppedFile);
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
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Upload Resi</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`bg-white p-12 rounded-lg shadow border-2 border-dashed text-center transition ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
      >
        <div className="text-gray-500 mb-4">
          <p className="text-lg">Drag & drop file PDF atau ZIP di sini</p>
          <p className="text-sm mt-1">atau</p>
        </div>

        <label className="inline-block cursor-pointer bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          Pilih File
          <input
            type="file"
            accept=".pdf,.zip"
            className="hidden"
            onChange={(e) => {
              if (e.target.files[0]) validateAndSet(e.target.files[0]);
            }}
          />
        </label>

        {file && (
          <div className="mt-4 p-3 bg-gray-50 rounded inline-block">
            <p className="text-gray-700 font-medium">{file.name}</p>
            <p className="text-gray-500 text-sm">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        )}
      </div>

      {file && (
        <div className="mt-4">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`w-full py-3 rounded text-white font-medium ${
              uploading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {uploading ? 'Mengupload...' : 'Upload & Proses Resi'}
          </button>
        </div>
      )}

      {result && result.success && (
        <div className="mt-6 bg-green-50 p-6 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold text-green-800 mb-3">
            Upload Berhasil!
          </h3>
          <p className="text-green-700 mb-3">{result.message}</p>

          {result.data.saved_resis && result.data.saved_resis.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-green-700 mb-2">Resi tersimpan:</p>
              <ul className="text-sm text-green-600 space-y-1">
                {result.data.saved_resis.map((r) => (
                  <li key={r.id}>
                    Resi: {r.no_resi} | Pesanan: {r.no_pesanan}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.data.failed && result.data.failed.length > 0 && (
            <div className="mt-3 p-3 bg-yellow-50 rounded">
              <p className="text-sm font-medium text-yellow-700">Gagal diproses:</p>
              <ul className="text-sm text-yellow-600">
                {result.data.failed.map((f, i) => (
                  <li key={i}>{f.file}: {f.error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UploadResi;
