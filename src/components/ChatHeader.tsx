'use client';

import React from 'react';
import { SubjectMeta } from '@/lib/types';
import { RotateCcw, ShieldCheck, Sparkles, Lock } from 'lucide-react';

interface ChatHeaderProps {
  currentSubject: SubjectMeta;
  onResetChat: () => void;
  onOpenParentModal: () => void;
  onLockApp?: () => void;
  disabled?: boolean;
}

export function ChatHeader({
  currentSubject,
  onResetChat,
  onOpenParentModal,
  onLockApp,
  disabled = false,
}: ChatHeaderProps) {
  return (
    <header className="w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        {/* Logo and Tutor Name */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 text-xl select-none">
            🦉
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg leading-tight">
                Socrate
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                <Sparkles className="w-3 h-3" /> Tutor Socratico
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span>Materia:</span>
              <strong className="text-slate-700 dark:text-slate-300 font-medium">
                {currentSubject.emoji} {currentSubject.name}
              </strong>
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Spazio Genitori */}
          <button
            onClick={onOpenParentModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            title="Spazio Genitori e Informazioni Didattiche"
          >
            <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span className="hidden md:inline">Spazio Genitori</span>
          </button>

          {/* Blocca aula */}
          {onLockApp && (
            <button
              onClick={onLockApp}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-slate-600 dark:text-slate-400 hover:text-amber-700 transition-colors cursor-pointer"
              title="Blocca aula con PIN"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Reset chat */}
          <button
            onClick={onResetChat}
            disabled={disabled}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            title="Ricomincia o cambia argomento"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ricomincia</span>
          </button>
        </div>
      </div>
    </header>
  );
}
