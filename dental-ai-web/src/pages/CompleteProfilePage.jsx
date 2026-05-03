import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { config } from '../config';

const ROLES = [
  { key: 'patient', label: 'Hasta', icon: '🦷', desc: 'X-ray analizi yaptırın, geçmişinizi görün' },
  { key: 'doctor', label: 'Doktor', icon: '🩺', desc: 'Hasta analizi yapın, randevu yönetin' },
  { key: 'admin', label: 'Admin', icon: '🔑', desc: 'Sistem yönetimi (davet kodu gerekli)' },
];

export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('patient');
  const [specialization, setSpecialization] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleComplete = async (e) => {
    e.preventDefault();
    setError('');

    if (selectedRole === 'admin' && !inviteCode.trim()) {
      setError('Admin hesabı için davet kodu gereklidir');
      return;
    }
    if (password && password !== passwordConfirm) {
      setError('Şifreler eşleşmiyor');
      return;
    }
    if (password && password.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiBaseUrl}/api/complete-google-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: selectedRole,
          password: password || undefined,
          invite_code: inviteCode || undefined,
          specialization: selectedRole === 'doctor' ? specialization : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Profil tamamlanamadı');
        return;
      }

      // Güncel kullanıcıyı kaydet
      localStorage.setItem('user', JSON.stringify(data.user));

      const role = data.user?.role;
      if (role === 'admin') navigate('/admin');
      else if (role === 'doctor') navigate('/doctor');
      else navigate('/patient/upload');
    } catch (err) {
      setError('Sunucuya bağlanılamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-[#0a0f14] px-8 py-8">
          <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center mb-4">
            <span className="text-white text-xl font-bold">D</span>
          </div>
          <h1 className="text-white text-2xl font-bold">Profilinizi Tamamlayın</h1>
          <p className="text-slate-400 text-sm mt-1">
            Hesap türünüzü seçin ve isteğe bağlı şifre belirleyin.
          </p>
        </div>

        <form onSubmit={handleComplete} className="px-8 py-8 space-y-6">
          {/* Rol seçimi */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Hesap Türü</label>
            <div className="space-y-3">
              {ROLES.map((r) => (
                <button
                  type="button"
                  key={r.key}
                  onClick={() => setSelectedRole(r.key)}
                  className={`w-full flex items-center p-4 rounded-xl border-2 text-left transition-colors ${
                    selectedRole === r.key
                      ? 'border-cyan-500 bg-cyan-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-2xl mr-3">{r.icon}</span>
                  <div className="flex-1">
                    <p className={`font-semibold ${selectedRole === r.key ? 'text-cyan-700' : 'text-slate-800'}`}>
                      {r.label}
                    </p>
                    <p className="text-slate-400 text-xs mt-0.5">{r.desc}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedRole === r.key ? 'border-cyan-500' : 'border-slate-300'
                  }`}>
                    {selectedRole === r.key && (
                      <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Doktor: uzmanlık */}
          {selectedRole === 'doctor' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Uzmanlık Alanı</label>
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="Örn: Genel Diş Hekimliği, Ortodonti..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          )}

          {/* Admin: davet kodu */}
          {selectedRole === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Admin Davet Kodu <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Davet kodunuzu girin"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 uppercase tracking-widest"
              />
            </div>
          )}

          {/* Opsiyonel şifre */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Şifre Belirle <span className="text-slate-400 font-normal">(İsteğe bağlı)</span>
            </label>
            <p className="text-xs text-slate-400 mb-3">
              E-posta ile de giriş yapmak istiyorsanız şifre belirleyebilirsiniz.
            </p>
            <div className="relative mb-3">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="En az 8 karakter"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            {password.length > 0 && (
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Şifreyi tekrar girin"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            )}
          </div>

          {/* Hata */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Buton */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-60"
          >
            {loading ? 'Kaydediliyor...' : 'Hesabı Oluştur'}
          </button>
        </form>
      </div>
    </div>
  );
}
