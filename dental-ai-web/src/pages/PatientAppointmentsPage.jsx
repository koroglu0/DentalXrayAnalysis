import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { config } from '../config';

const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

function friendlyDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getDate()} ${TR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const STATUS_MAP = {
  pending: { label: 'Bekliyor', bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '⏳' },
  confirmed: { label: 'Onaylandı', bg: 'bg-green-100', text: 'text-green-700', icon: '✅' },
  cancelled: { label: 'İptal', bg: 'bg-red-100', text: 'text-red-700', icon: '❌' },
};

export default function PatientAppointmentsPage() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token || user.role !== 'patient') {
      navigate('/login');
      return;
    }
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${config.apiBaseUrl}/api/appointments/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments || []);
      }
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = appointments.filter((a) => a.status !== 'cancelled' && a.date >= today);
  const past = appointments.filter((a) => a.status === 'cancelled' || a.date < today);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Randevularım</h1>
            <p className="text-slate-400 text-sm mt-0.5">{upcoming.length} aktif randevu</p>
          </div>
          <button
            onClick={fetchAppointments}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            Yenile
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-5xl mb-4">📅</span>
            <p className="text-slate-600 dark:text-slate-400 font-semibold text-lg">Randevunuz yok</p>
            <p className="text-slate-400 text-sm mt-1 max-w-xs">
              Doktorunuzdan gelen geri bildirimlere göre randevu alabilirsiniz.
            </p>
            <button
              onClick={() => navigate('/patient/upload')}
              className="mt-6 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              Röntgen Gönder
            </button>
            <button
              onClick={() => navigate('/patient/notifications')}
              className="mt-3 px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Bildirimleri Gör
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {upcoming.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">Yaklaşan</p>
                <div className="space-y-3">
                  {upcoming.map((a) => <AppointmentCard key={a.id} appointment={a} />)}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Geçmiş / İptal</p>
                <div className="space-y-3 opacity-70">
                  {past.map((a) => <AppointmentCard key={a.id} appointment={a} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

function AppointmentCard({ appointment: a }) {
  const st = STATUS_MAP[a.status] || STATUS_MAP.pending;
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold text-base flex-shrink-0">
            {(a.doctor_name || 'D').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white text-sm">Dr. {a.doctor_name}</p>
            <p className="text-slate-400 text-xs">{a.doctor_email}</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${st.bg} ${st.text}`}>
          {st.icon} {st.label}
        </span>
      </div>

      <div className="flex gap-3 bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
        <div className="flex-1">
          <p className="text-slate-400 text-xs mb-0.5">Tarih</p>
          <p className="text-slate-800 dark:text-slate-200 text-sm font-semibold">{friendlyDate(a.date)}</p>
        </div>
        <div className="flex-1">
          <p className="text-slate-400 text-xs mb-0.5">Saat</p>
          <p className="text-slate-800 dark:text-slate-200 text-sm font-semibold">{a.time_slot}</p>
        </div>
      </div>

      {a.doctor_note && (
        <div className="mt-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl px-3 py-2">
          <p className="text-green-700 dark:text-green-400 text-xs font-medium mb-0.5">Doktor Notu</p>
          <p className="text-slate-700 dark:text-slate-300 text-xs">{a.doctor_note}</p>
        </div>
      )}

      {a.patient_note && (
        <div className="mt-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
          <p className="text-slate-400 text-xs font-medium mb-0.5">Notunuz</p>
          <p className="text-slate-700 dark:text-slate-300 text-xs">{a.patient_note}</p>
        </div>
      )}
    </div>
  );
}
