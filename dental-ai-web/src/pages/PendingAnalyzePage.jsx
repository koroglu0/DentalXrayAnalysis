/**
 * Doktorun bekleyen hasta röntgenini analiz ettiği sayfa.
 * DoctorDashboard'dan state ile gelen pendingData'yı alır:
 *   { id, filename, patient_note, patient_email, image_s3_key, image_url }
 * S3'ten görüntüyü indirir, /api/analyze'a gönderir (analysis_id ile),
 * sonucu ResultPage'e { result, imageUrl, analysisId, patientEmail } ile taşır.
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { config } from '../config';

export default function PendingAnalyzePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const pendingData = location.state;

  const [status, setStatus] = useState('loading'); // loading | ready | analyzing | error
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileObj, setFileObj] = useState(null);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const intervalRef = useRef(null);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!token || user.role !== 'doctor') {
      navigate('/login');
      return;
    }
    if (!pendingData?.id) {
      navigate('/doctor');
      return;
    }
    loadImage();
  }, []);

  const loadImage = async () => {
    setStatus('loading');
    try {
      // Zaten bir image_url geliyorsa kullan, yoksa S3 key'den al
      let presignedUrl = pendingData.image_url;

      if (!presignedUrl && pendingData.image_s3_key) {
        const res = await fetch(
          `${config.apiBaseUrl}/api/analysis/image-url?key=${encodeURIComponent(pendingData.image_s3_key)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (!data.url) throw new Error('URL alınamadı');
        presignedUrl = data.url;
      }

      if (!presignedUrl) throw new Error('Görüntü URL\'si yok');

      // Görüntüyü indir ve File nesnesine çevir
      const imgRes = await fetch(presignedUrl);
      if (!imgRes.ok) throw new Error('Görüntü indirilemedi');
      const blob = await imgRes.blob();
      const file = new File([blob], pendingData.filename || 'xray.jpg', {
        type: blob.type || 'image/jpeg',
      });

      // Preview için data URL
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(blob);

      setFileObj(file);
      setStatus('ready');
    } catch (err) {
      setErrorMsg(err.message || 'Görüntü yüklenemedi');
      setStatus('error');
    }
  };

  const handleAnalyze = async () => {
    if (!fileObj) return;
    setStatus('analyzing');
    setProgress(0);

    intervalRef.current = setInterval(() => {
      setProgress((p) => (p < 88 ? p + 8 : p));
    }, 300);

    try {
      const formData = new FormData();
      formData.append('file', fileObj);
      formData.append('analysis_id', pendingData.id);

      const res = await fetch(`${config.apiBaseUrl}/api/analyze`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      clearInterval(intervalRef.current);
      setProgress(100);

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Analiz başarısız');
      }

      const result = await res.json();

      setTimeout(() => {
        navigate('/result', {
          state: {
            result,
            imageUrl: previewUrl,
            analysisId: pendingData.id,
            patientEmail: pendingData.patient_email,
          },
        });
      }, 400);
    } catch (err) {
      clearInterval(intervalRef.current);
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  // ──── UI ────

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4" />
        <p className="text-slate-500 text-sm">Görüntü yükleniyor...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <span className="text-5xl mb-4">⚠️</span>
        <p className="text-slate-700 dark:text-slate-300 font-semibold mb-2">Hata</p>
        <p className="text-slate-500 text-sm mb-6 text-center">{errorMsg}</p>
        <button
          onClick={() => navigate('/doctor')}
          className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          Panele Dön
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/doctor')}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="text-slate-900 dark:text-white font-bold text-base">Bekleyen Röntgen Analizi</h1>
          <p className="text-slate-400 text-xs">{pendingData.patient_email}</p>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        {/* Hasta notu */}
        {pendingData.patient_note && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-4 py-3 mb-5">
            <p className="text-blue-700 dark:text-blue-400 text-xs font-semibold mb-1">Hasta Notu</p>
            <p className="text-slate-700 dark:text-slate-300 text-sm">{pendingData.patient_note}</p>
          </div>
        )}

        {/* Görüntü */}
        {previewUrl && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 mb-5 shadow-sm">
            <img
              src={previewUrl}
              alt="X-ray"
              className="w-full max-h-72 object-contain rounded-lg"
            />
            <p className="text-slate-400 text-xs text-center mt-2">{pendingData.filename}</p>
          </div>
        )}

        {/* Progress bar (analiz sırasında) */}
        {status === 'analyzing' && (
          <div className="mb-5">
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-slate-400 text-xs text-center">AI analiz ediyor... {progress}%</p>
          </div>
        )}

        {/* Analiz butonu */}
        <button
          onClick={handleAnalyze}
          disabled={status !== 'ready'}
          className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-colors ${
            status === 'ready'
              ? 'bg-primary text-white hover:bg-primary/90'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
          }`}
        >
          {status === 'analyzing' ? (
            <>
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              Analiz Ediliyor...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">biotech</span>
              AI ile Analiz Et
            </>
          )}
        </button>

        <p className="text-slate-400 text-xs text-center mt-3">Ortalama analiz süresi ~3 saniye</p>
      </main>
    </div>
  );
}
