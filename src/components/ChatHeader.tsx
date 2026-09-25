'use client';

import React from 'react';
import { SubjectMeta, StudentId, STUDENTS, AuthSession } from '@/lib/types';
import { StudentSelector } from './StudentSelector';
import { ShieldCheck, Sparkles, LogOut, Clock, Plus, User } from 'lucide-react';

interface ChatHeaderProps {
  currentSubject: SubjectMeta;
  currentUser: AuthSession;
  currentStudent: StudentId;
  onSelectStudent: (student: StudentId) => void;
  onResetChat: () => void;
  onOpenHistory: () => void;
  onOpenParentDashboard: () => void;
  onLogout: () => void;
  disabled?: boolean;
}

export function ChatHeader({
  currentSubject,
  currentUser,
  currentStudent,
  onSelectStudent,
  onResetChat,
  onOpenHistory,
  onOpenParentDashboard,
  onLogout,
  disabled = false,
}: ChatHeaderProps) {
  const isParent = currentUser.role === 'parent';

  return (
    <header className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 py-2.5 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 text-lg sm:text-xl select-none flex-shrink-0">
            🦉
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-tight whitespace-nowrap">
                AI Tutor Socratico
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-semibold bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                <Sparkles className="w-2.5 h-2.5" /> con Socrate
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span>Materia:</span>
              <strong className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[120px] sm:max-w-none">
                {currentSubject.emoji} {currentSubject.name}
              </strong>
            </p>
          </div>
        </div>

        {/* User / Student Badge */}
        <div className="flex items-center gap-1.5">
          {isParent ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex text-xs font-semibold px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                👨‍👩‍👦 Genitori
              </span>
              <StudentSelector
                currentStudent={currentStudent}
                onSelectStudent={onSelectStudent}
                disabled={disabled}
              />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100">
              <span className="text-base">{currentUser.avatar}</span>
              <span>{currentUser.name}</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Cronologia Sessioni */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            title="Cronologia compiti salvati"
          >
            <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span className="hidden lg:inline">Cronologia</span>
          </button>

          {/* Nuovo Compito */}
          <button
            onClick={onResetChat}
            disabled={disabled}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            title="Nuovo compito / Ricomincia"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nuovo</span>
          </button>

          {/* Area Riservata Genitori */}
          <button
            onClick={onOpenParentDashboard}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition-colors cursor-pointer border border-indigo-200/50 dark:border-indigo-800/40"
            title="Area Riservata Genitori (PIN: 1488)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden md:inline">Area Genitori</span>
          </button>

          {/* Esci / Cambia Profilo */}
          <button
            onClick={onLogout}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-500 hover:text-rose-700 transition-colors cursor-pointer"
            title="Esci / Cambia profilo"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
