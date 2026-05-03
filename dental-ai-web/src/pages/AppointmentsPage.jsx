import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function AppointmentsPage() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [doctorNote, setDoctorNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token || user.role !== 'doctor') {
      navigate('/login');
      return;
    }
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${config.apiBaseUrl}/api/appointments/doctor`, {
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

  const updateStatus = async (status) => {
    if (!selected) return;
    setUpdating(true);
    try {
      const res = await fetch(`${config.apiBaseUrl}/api/appointments/${selected.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, doctor_note: doctorNote.trim() || null }),
      });
      if (res.ok) {
        setSelected(null);
        fetchAppointments();
      } else {
        const d = await res.json();
        alert(d.error || 'Güncelleme başarısız');
      }
    } catch {
      alert('Bir hata oluştu');
    } finally {
      setUpdating(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const todayList = appointments.filter((a) => a.date === today);
  const upcoming = appointments.filter((a) => a.date > today && a.status !== 'cancelled');
  const past = appointments.filter((a) => a.date < today || a.status === 'cancelled');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col p-4 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}>
        <div className="flex items-center gap-3 px-2 py-3 mb-6">
          <div className="bg-primary rounded-xl size-9 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-xl">dental</span>
          </div>
          <div>
            <h1 className="text-slate-900 dark:text-white text-base font-bold leading-none">Doktor Paneli</h1>
            <p className="text-primary text-xs font-medium mt-1">Dental AI</p>
          </div>
        </div>
        <nav className="flex flex-col gap-2">
          <a onClick={() => navigate('/doctor')} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group cursor-pointer">
            <span className="material-symbols-outlined">dashboard</span>
            <p className="text-sm font-medium leading-normal">Gösterge Paneli</p>
          </a>
          <a onClick={() => navigate('/patient-management')} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group cursor-pointer">
            <span className="material-symbols-outlined">group</span>
            <p className="text-sm font-medium leading-normal">Hastalar</p>
          </a>
          <a onClick={() => navigate('/history')} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group cursor-pointer">
            <span className="material-symbols-outlined">analytics</span>
            <p className="text-sm font-medium leading-normal">Analizler</p>
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary cursor-pointer">
            <span className="material-symbols-outlined">calendar_month</span>
            <p className="text-sm font-bold leading-normal">Randevular</p>
          </a>
        </nav>
        <div className="mt-auto">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
            <div className="bg-primary/20 rounded-full size-10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">person</span>
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-slate-900 dark:text-white text-sm font-bold truncate">{user.name || 'Dr. User'}</p>
              <p className="text-slate-500 text-xs truncate">{user.specialization || 'Dentist'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div>
            <h2 className="text-slate-900 dark:text-white font-bold text-lg">Randevular</h2>
            <p className="text-slate-400 text-xs">{todayList.length} bugün · {upcoming.length} yaklaşan</p>
          </div>
          <button onClick={fetchAppointments} className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined text-base">refresh</span>
            Yenile
          </button>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="text-5xl mb-4">📅</span>
              <p className="text-slate-600 dark:text-slate-400 font-semibold text-lg">Henüz randevu yok</p>
              <p className="text-slate-400 text-sm mt-1">Hastalara geri bildirim gönderdiğinizde randevu talep edebilirler.</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6">
              {todayList.length > 0 && (
                <Section title="📌 Bugün" titleClass="text-cyan-600">
                  {todayList.map((a) => <AppCard key={a.id} a={a} onAction={() => { setSelected(a); setDoctorNote(''); }} />)}
                </Section>
              )}
              {upcoming.length > 0 && (
                <Section title="Yaklaşan" titleClass="text-slate-700 dark:text-slate-300">
                  {upcoming.map((a) => <AppCard key={a.id} a={a} onAction={() => { setSelected(a); setDoctorNote(''); }} />)}
                </Section>
              )}
              {past.length > 0 && (
                <Section title="Geçmiş / İptal" titleClass="text-slate-400">
                  {past.map((a) => <AppCard key={a.id} a={a} onAction={() => { setSelected(a); setDoctorNote(''); }} faded />)}
                </Section>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Detail / Action Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selected.patient_name}</h3>
                <p className="text-slate-400 text-sm">{friendlyDate(selected.date)} · {selected.time_slot}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {selected.patient_note && (
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 mb-4">
                <p className="text-slate-400 text-xs mb-1">Hasta Notu</p>
                <p className="text-slate-700 dark:text-slate-300 text-sm">{selected.patient_note}</p>
              </div>
            )}

            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Doktor Notu <span className="text-slate-400 font-normal">(opsiyonel)</span>
            </label>
            <textarea
              value={doctorNote}
              onChange={(e) => setDoctorNote(e.target.value)}
              placeholder="Hastaya iletmek istediğiniz not..."
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary mb-4"
            />

            {selected.status === 'pending' && (
              <div className="flex gap-3">
                <button
                  onClick={() => updateStatus('confirmed')}
                  disabled={updating}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {updating ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : '✅ Onayla'}
                </button>
                <button
                  onClick={() => updateStatus('cancelled')}
                  disabled={updating}
                  className="flex-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60"
                >
                  ❌ İptal Et
                </button>
              </div>
            )}

            {selected.status !== 'pending' && (
              <div className={`text-center py-2.5 rounded-xl font-semibold text-sm ${STATUS_MAP[selected.status]?.bg} ${STATUS_MAP[selected.status]?.text}`}>
                {STATUS_MAP[selected.status]?.icon} {STATUS_MAP[selected.status]?.label}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, titleClass, children }) {
  return (
    <div>
      <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${titleClass}`}>{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function AppCard({ a, onAction, faded }) {
  const st = STATUS_MAP[a.status] || STATUS_MAP.pending;
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm ${faded ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold text-base flex-shrink-0">
            {(a.patient_name || 'H').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white text-sm">{a.patient_name}</p>
            <p className="text-slate-400 text-xs">{a.patient_email}</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${st.bg} ${st.text}`}>
          {st.icon} {st.label}
        </span>
      </div>
      <div className="flex gap-3 bg-slate-50 dark:bg-slate-800 rounded-xl p-3 mb-3">
        <div className="flex-1">
          <p className="text-slate-400 text-xs mb-0.5">Tarih</p>
          <p className="text-slate-800 dark:text-slate-200 text-sm font-semibold">{friendlyDate(a.date)}</p>
        </div>
        <div className="flex-1">
          <p className="text-slate-400 text-xs mb-0.5">Saat</p>
          <p className="text-slate-800 dark:text-slate-200 text-sm font-semibold">{a.time_slot}</p>
        </div>
      </div>
      {a.status === 'pending' && (
        <button
          onClick={onAction}
          className="w-full text-sm font-semibold text-primary border border-primary/30 rounded-xl py-2 hover:bg-primary/5 transition-colors"
        >
          İncele / Yanıtla
        </button>
      )}
      {a.status !== 'pending' && (
        <button
          onClick={onAction}
          className="w-full text-sm font-medium text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Detay
        </button>
      )}
    </div>
  );
}
