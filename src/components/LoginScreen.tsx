import { useState } from 'react';
import { login } from '../utils/api';

interface LoginScreenProps {
  onSuccess: () => void;
}

export default function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const ok = await login(password);
    setLoading(false);
    if (ok) {
      onSuccess();
    } else {
      setError('Helytelen jelszó. Próbáld újra.');
      setPassword('');
    }
  }

  return (
    <div className="min-h-screen bg-autumn-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-5xl select-none">💍</span>
          <h1 className="font-display text-2xl font-semibold text-autumn-800 mt-3">
            Esküvői vendéglista
          </h1>
          <p className="text-sm text-autumn-600 mt-1">Add meg a jelszót a folytatáshoz</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#FFFCF8] rounded-2xl border border-autumn-200 shadow-sm shadow-autumn-200/30 p-6 space-y-4"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">
              Jelszó
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
              className="w-full px-3 py-3 text-sm rounded-xl border border-stone-200 bg-[#FFFCF8] text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-autumn-300 focus:border-autumn-400 transition-shadow"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 text-sm font-medium rounded-xl text-white bg-autumn-600 hover:bg-autumn-700 active:bg-autumn-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
          >
            {loading ? 'Belépés…' : 'Belépés'}
          </button>
        </form>
      </div>
    </div>
  );
}
