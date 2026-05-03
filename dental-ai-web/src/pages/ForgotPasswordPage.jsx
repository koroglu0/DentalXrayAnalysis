import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { config } from '../config';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // 'email' | 'reset'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('E-posta adresi gereklidir');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${config.apiBaseUrl}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kod gönderilemedi');
      setStep('reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!code.trim() || !newPassword || !confirmPassword) {
      setError('Tüm alanları doldurunuz');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }
    if (newPassword.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${config.apiBaseUrl}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim(), new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Şifre sıfırlanamadı');
      setSuccess('Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-8">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg font-bold">D</span>
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">DentalAI</span>
          </div>

          {success ? (
            /* Başarı durumu */
            <div className="text-center py-4">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Şifre Güncellendi</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">{success}</p>
              <Link
                to="/login"
                className="block w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 rounded-xl text-center transition-colors"
              >
                Giriş Yap
              </Link>
            </div>
          ) : step === 'email' ? (
            /* Adım 1: E-posta */
            <>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Şifremi Unuttum</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
                Kayıtlı e-posta adresinizi girin. Şifre sıfırlama kodu göndereceğiz.
              </p>

              <form onSubmit={handleSendCode} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    E-posta Adresi
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@dentalai.com"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                    <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  {loading ? 'Gönderiliyor...' : 'Kod Gönder'}
                </button>
              </form>
            </>
          ) : (
            /* Adım 2: Kod + Yeni şifre */
            <>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Yeni Şifre Belirle</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{email}</span> adresine
                gönderilen kodu ve yeni şifrenizi girin.
              </p>
              <button
                onClick={() => { setStep('email'); setError(''); }}
                className="text-cyan-500 text-sm font-medium mb-6 hover:underline"
              >
                E-postayı değiştir →
              </button>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Doğrulama Kodu
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    required
                    maxLength={10}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all tracking-widest text-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Yeni Şifre
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="En az 8 karakter"
                      required
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
                    >
                      {showPassword ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Şifre Tekrar
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Şifrenizi tekrar girin"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                    <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  {loading ? 'Güncelleniyor...' : 'Şifremi Güncelle'}
                </button>
              </form>
            </>
          )}

          {/* Geri dön */}
          {!success && (
            <div className="mt-6 text-center">
              <Link to="/login" className="text-slate-500 dark:text-slate-400 text-sm hover:text-cyan-500 transition-colors">
                ← <span className="text-cyan-500 font-semibold">Girişe Dön</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
