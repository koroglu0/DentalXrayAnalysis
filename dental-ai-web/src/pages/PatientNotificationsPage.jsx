import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { config } from '../config';

export default function PatientNotificationsPage() {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token || user.role !== 'patient') {
      navigate('/login');
      return;
    }
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${config.apiBaseUrl}/api/feedbacks/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data.feedbacks || []);
      } else {
        setFeedbacks([]);
      }
    } catch {
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (feedbackId) => {
    try {
      await fetch(`${config.apiBaseUrl}/api/feedbacks/${feedbackId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Sessizce geç
    }
  };

  const openFeedback = async (feedback) => {
    if (!feedback.is_read) {
      await markRead(feedback.id);
      setFeedbacks((prev) => prev.map((f) => (f.id === feedback.id ? { ...f, is_read: true } : f)));
    }

    navigate('/patient/feedback-detail', { state: { feedback } });
  };

  const unreadCount = feedbacks.filter((f) => !f.is_read).length;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bildirimler</h1>
            <p className="text-slate-400 text-sm mt-0.5">{unreadCount} okunmamış bildirim</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/patient/upload')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Ana Sayfa
            </button>
            <button
              onClick={fetchFeedbacks}
              className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90"
            >
              Yenile
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-10 text-center">
            <span className="text-5xl">🔔</span>
            <p className="text-slate-700 dark:text-slate-300 font-semibold mt-4">Henüz bildiriminiz yok</p>
            <p className="text-slate-400 text-sm mt-1">
              Doktorunuz analiz notu gönderdiğinde burada görünecek.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {feedbacks.map((fb) => (
              <button
                key={fb.id}
                onClick={() => openFeedback(fb)}
                className={`w-full text-left rounded-2xl p-4 border transition-colors ${
                  fb.is_read
                    ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    : 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-base shrink-0">
                      {(fb.doctor_name || 'D').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">Dr. {fb.doctor_name || 'Doktor'}</p>
                      <p className="text-slate-400 text-xs">{(fb.created_at || '').slice(0, 10)}</p>
                    </div>
                  </div>
                  {!fb.is_read && <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 mt-1 shrink-0" />}
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-sm mt-3">{fb.message}</p>
                <p className="text-cyan-600 dark:text-cyan-400 text-xs font-semibold mt-2">Detay ve randevu al →</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
