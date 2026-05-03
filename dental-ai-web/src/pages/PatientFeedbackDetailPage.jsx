import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { config } from '../config';

const TR_DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

function formatDate(dateObj) {
  return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
}

function displayDate(dateObj) {
  return `${TR_DAYS[dateObj.getDay()]}, ${dateObj.getDate()} ${TR_MONTHS[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
}

function getNextWeekdays(count = 10) {
  const days = [];
  const d = new Date();
  d.setDate(d.getDate() + 1);

  while (days.length < count) {
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      days.push(new Date(d));
    }
    d.setDate(d.getDate() + 1);
  }

  return days;
}

export default function PatientFeedbackDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const feedback = location.state?.feedback;

  const [showBooking, setShowBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [patientNote, setPatientNote] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const [authReady, setAuthReady] = useState(false);

  const weekdays = useMemo(() => getNextWeekdays(10), []);

  useEffect(() => {
    if (!token || user.role !== 'patient') {
      navigate('/login');
      return;
    }
    setAuthReady(true);
  }, []);

  if (!authReady) {
    return null;
  }

  if (!feedback) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <p className="text-slate-500 mb-4">Bildirim detayı bulunamadı.</p>
          <button
            onClick={() => navigate('/patient/notifications')}
            className="px-4 py-2 bg-primary text-white rounded-lg font-semibold"
          >
            Bildirimlere Dön
          </button>
        </div>
      </Layout>
    );
  }

  const handleSelectDate = async (dateObj) => {
    setSelectedDate(dateObj);
    setSelectedSlot('');
    setLoadingSlots(true);

    try {
      const date = formatDate(dateObj);
      const res = await fetch(
        `${config.apiBaseUrl}/api/appointments/slots?doctor_email=${encodeURIComponent(feedback.doctor_email)}&date=${date}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots || []);
      } else {
        setSlots([]);
      }
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBook = async () => {
    if (!selectedDate || !selectedSlot) {
      alert('Lütfen tarih ve saat seçin');
      return;
    }

    setBooking(true);
    try {
      const payload = {
        doctor_email: feedback.doctor_email,
        doctor_name: feedback.doctor_name || '',
        organization_id: user.organization_id || '',
        date: formatDate(selectedDate),
        time_slot: selectedSlot,
        feedback_id: feedback.id || '',
        patient_note: patientNote.trim(),
      };

      const res = await fetch(`${config.apiBaseUrl}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Randevu alınamadı');
        return;
      }

      setShowBooking(false);
      alert(`${displayDate(selectedDate)} ${selectedSlot} için randevunuz oluşturuldu. Doktor onayı bekleniyor.`);
      navigate('/patient/appointments');
    } catch {
      alert('Bir hata oluştu');
    } finally {
      setBooking(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/patient/notifications')}
            className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            ← Bildirimlere Dön
          </button>
          <button
            onClick={() => navigate('/patient/appointments')}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Randevularım
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold">
              {(feedback.doctor_name || 'D').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Dr. {feedback.doctor_name || 'Doktor'}</p>
              <p className="text-slate-400 text-xs">{feedback.doctor_email}</p>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
            <p className="text-slate-400 text-xs font-medium mb-1 uppercase">Doktor Mesajı</p>
            <p className="text-slate-700 dark:text-slate-300 text-sm leading-6">{feedback.message}</p>
          </div>
        </div>

        <button
          onClick={() => setShowBooking(true)}
          className="w-full py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90"
        >
          📅 Randevu Al
        </button>

        {showBooking && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Randevu Seç</h3>
                <button
                  onClick={() => setShowBooking(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <p className="text-slate-700 dark:text-slate-300 text-sm mb-1">Dr. {feedback.doctor_name || 'Doktor'}</p>
              <p className="text-slate-400 text-xs mb-4">Hafta sonları randevu alınamaz</p>

              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">1. Tarih Seç</p>
              <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
                {weekdays.map((d) => {
                  const key = formatDate(d);
                  const selected = selectedDate && formatDate(selectedDate) === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleSelectDate(d)}
                      className={`px-4 py-3 rounded-xl border-2 min-w-[84px] ${
                        selected
                          ? 'bg-primary border-primary text-white'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <p className="text-xs">{TR_DAYS[d.getDay()].slice(0, 3)}</p>
                      <p className="text-base font-bold leading-tight">{d.getDate()}</p>
                      <p className="text-xs">{TR_MONTHS[d.getMonth()].slice(0, 3)}</p>
                    </button>
                  );
                })}
              </div>

              {selectedDate && (
                <>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">2. Saat Seç</p>
                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary" />
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3 text-sm text-orange-700 dark:text-orange-300 mb-4">
                      Bu gün için müsait saat bulunmuyor.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {slots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold ${
                            selectedSlot === slot
                              ? 'bg-primary border-primary text-white'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">3. Not (Opsiyonel)</p>
              <textarea
                rows={3}
                value={patientNote}
                onChange={(e) => setPatientNote(e.target.value)}
                placeholder="Doktora iletmek istediğiniz not..."
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white mb-5"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowBooking(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  İptal
                </button>
                <button
                  onClick={handleBook}
                  disabled={booking || !selectedDate || !selectedSlot}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-50"
                >
                  {booking ? 'Gönderiliyor...' : 'Randevuyu Oluştur'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
