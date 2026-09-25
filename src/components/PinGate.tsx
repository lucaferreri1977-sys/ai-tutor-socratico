'use client';

import React, { useState } from 'react';
import { Lock, Sparkles, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';

interface PinGateProps {
  onUnlock: (pin: string) => void;
}

export function PinGate({ onUnlock }: PinGateProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);

  const handleDigit = (digit: string) => {
    if (pin.length < 8) {
      setPin((prev) => prev + digit);
      setError(null);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleVerify = async (pinToTest?: string) => {
    const code = pinToTest || pin;
    if (!code || code.trim().length === 0) {
      setError('Inserisci il PIN prima di confermare.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: code.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (remember) {
          localStorage.setItem('socrate_family_pin', code.trim());
        }
        onUnlock(code.trim());
      } else {
        setError(data.error || 'PIN errato. Riprova!');
        setPin('');
      }
    } catch {
      setError('Errore di connessione. Controlla la rete e riprova.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-sky-100 dark:border-slate-800 space-y-6 text-center animate-in fade-in zoom-in-95">
        {/* Avatar Socrate */}
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center text-4xl shadow-xl shadow-sky-500/25 select-none">
          🦉
          <div className="absolute -bottom-1 -right-1 p-1.5 bg-amber-400 text-amber-950 rounded-xl shadow-xs">
            <Lock className="w-4 h-4" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Ciao! Sono Socrate
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Inserisci il codice segreto di famiglia per sbloccare la tua aula di studio.
          </p>
        </div>

        {/* Form Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative max-w-xs mx-auto">
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              autoFocus
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(null);
              }}
              placeholder="••••••"
              className="w-full text-center tracking-[0.4em] font-mono font-bold text-2xl sm:text-3xl py-3 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20 transition-all text-slate-800 dark:text-slate-100 placeholder:text-slate-300"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* On-screen Numeric Keypad for Tablets/Phones */}
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto pt-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigit(digit)}
                className="py-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-sky-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-lg transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleBackspace}
              className="py-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm transition-all active:scale-95 cursor-pointer"
            >
              Canc
            </button>
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="py-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-sky-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-lg transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              0
            </button>
            <button
              type="submit"
              disabled={loading || pin.length === 0}
              className="py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-sm transition-all active:scale-95 cursor-pointer shadow-md shadow-sky-600/30 flex items-center justify-center"
            >
              {loading ? '...' : 'Entra'}
            </button>
          </div>

          {/* Remember on this device checkbox */}
          <div className="pt-2">
            <label className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>Ricorda il PIN su questo dispositivo</span>
            </label>
          </div>
        </form>

        <div className="text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
          Accesso riservato alla famiglia • Protezione API attiva 🛡️
        </div>
      </div>
    </div>
  );
}
