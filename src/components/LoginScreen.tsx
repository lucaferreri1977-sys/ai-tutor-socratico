'use client';

import React, { useState } from 'react';
import { UserRole, AuthSession } from '@/lib/types';
import { Lock, ArrowLeft, Eye, EyeOff, ShieldCheck, Sparkles, KeyRound } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (session: AuthSession) => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);

  const profiles = [
    {
      role: 'alessio' as UserRole,
      name: 'Alessio',
      avatar: '👦',
      color: 'from-sky-500 to-blue-600',
      tag: 'Scuola Media',
      subtitle: 'Accedi al tuo spazio studio con Socrate',
    },
    {
      role: 'mattia' as UserRole,
      name: 'Mattia',
      avatar: '🧒',
      color: 'from-indigo-500 to-purple-600',
      tag: 'Scuola Media',
      subtitle: 'Accedi al tuo spazio studio con Socrate',
    },
    {
      role: 'parent' as UserRole,
      name: 'Genitori',
      avatar: '👨‍👩‍👦',
      color: 'from-amber-500 to-orange-600',
      tag: 'Area Riservata',
      subtitle: 'Monitoraggio compiti e statistiche',
    },
  ];

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setPassword('');
    setError(null);
  };

  const handleBack = () => {
    setSelectedRole(null);
    setPassword('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !password.trim()) {
      setError('Inserisci la password per continuare.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole, password: password.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        const session: AuthSession = {
          role: data.user.role,
          name: data.user.name,
          avatar: data.user.avatar,
          token: password.trim(), // password usata come token autenticato per le API
        };

        if (remember) {
          localStorage.setItem('socrate_auth_session', JSON.stringify(session));
        }

        onLoginSuccess(session);
      } else {
        setError(data.error || 'Password errata. Riprova!');
      }
    } catch {
      setError('Errore di connessione. Controlla la rete e riprova.');
    } finally {
      setLoading(false);
    }
  };

  const activeProfile = profiles.find((p) => p.role === selectedRole);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-sky-100 dark:border-slate-800 space-y-6 text-center animate-in fade-in zoom-in-95">
        {/* Brand Socrate */}
        <div className="space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-400 to-indigo-600 mx-auto flex items-center justify-center text-3xl shadow-lg shadow-sky-500/25 select-none">
            🦉
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              AI Tutor Socratico
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Impara a ragionare con Socrate
            </p>
          </div>
        </div>

        {!selectedRole ? (
          /* Profile Selection Cards */
          <div className="space-y-3 pt-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Chi sta per studiare oggi?
            </p>

            <div className="space-y-2.5">
              {profiles.map((p) => (
                <button
                  key={p.role}
                  type="button"
                  onClick={() => handleSelectRole(p.role)}
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-sky-50/80 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-600 transition-all flex items-center gap-3.5 group cursor-pointer text-left shadow-2xs hover:scale-101"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform flex-shrink-0">
                    {p.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">
                        {p.name}
                      </h2>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {p.tag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {p.subtitle}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Password Input Form for Chosen Profile */
          <div className="space-y-4 pt-1 animate-in fade-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-1">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Cambia profilo
              </button>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>{activeProfile?.avatar}</span>
                <span>{activeProfile?.name}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {selectedRole === 'parent' ? 'Inserisci il PIN Genitori:' : `Inserisci la password di ${activeProfile?.name}:`}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoFocus
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder={selectedRole === 'parent' ? 'PIN a 4 cifre' : 'La tua password'}
                    className="w-full text-base py-3 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20 transition-all text-slate-800 dark:text-slate-100 placeholder:text-slate-400 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error feedback */}
              {error && (
                <div className="text-xs text-rose-600 dark:text-rose-400 font-medium animate-in fade-in">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !password.trim()}
                className="w-full py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-md shadow-sky-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'Verifica in corso...' : 'Entra'}
              </button>

              {/* Remember checkbox */}
              <div className="pt-1">
                <label className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span>Resta collegato su questo dispositivo</span>
                </label>
              </div>
            </form>
          </div>
        )}

        <div className="text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
          Accesso riservato alla famiglia • Protezione API attiva 🛡️
        </div>
      </div>
    </div>
  );
}
