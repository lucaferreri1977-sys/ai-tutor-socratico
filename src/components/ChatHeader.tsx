'use client';

import React from 'react';
import { StudentId, STUDENTS, AuthSession } from '@/lib/types';
import { StudentSelector } from './StudentSelector';
import { ShieldCheck, Plus, PanelLeft, LogOut } from 'lucide-react';

interface ChatHeaderProps {
  currentUser: AuthSession;
  currentStudent: StudentId;
  onSelectStudent: (student: StudentId) => void;
  onToggleSidebar: () => void;
  onResetChat: () => void;
  onOpenParentDashboard: () => void;
  onLogout: () => void;
  disabled?: boolean;
}

export function ChatHeader({
  currentUser,
  currentStudent,
  onSelectStudent,
  onToggleSidebar,
  onResetChat,
  onOpenParentDashboard,
  onLogout,
  disabled = false,
}: ChatHeaderProps) {
  const isParent = currentUser.role === 'parent';
  const activeStudentProfile = STUDENTS[currentStudent];

  return (
    <header className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-4 py-2.5 sticky top-0 z-30">
      <div className="flex items-center justify-between gap-2 sm:gap-4 max-w-7xl mx-auto">
        {/* Left: Sidebar Toggle & Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Apri cronologia chat"
          >
            <PanelLeft className="w-5 h-5 text-slate-700 dark:text-slate-200" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-xs text-base select-none">
              🦉
            </div>
            <div>
              <h1 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-tight whitespace-nowrap">
                AI Tutor Socratico
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Tutor maieutico con Socrate
              </p>
            </div>
          </div>
        </div>

        {/* Center / Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick "+ Nuova chat" button */}
          <button
            onClick={onResetChat}
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            title="Inizia una nuova chat"
          >
            <Plus className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span className="hidden sm:inline">Nuova chat</span>
          </button>

          {/* Student Switcher / Badge */}
          {isParent ? (
            <div className="flex items-center gap-1.5">
              <span className="hidden md:inline-flex text-xs font-semibold px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                👨‍👩‍👦 Genitori
              </span>
              <StudentSelector
                currentStudent={currentStudent}
                onSelectStudent={onSelectStudent}
                disabled={disabled}
              />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100">
              <span className="text-sm">{activeStudentProfile.avatar}</span>
              <span className="hidden sm:inline">{activeStudentProfile.name}</span>
            </div>
          )}

          {/* Area Genitori */}
          <button
            onClick={onOpenParentDashboard}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 border border-amber-200/80 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-medium transition-colors cursor-pointer"
            title="Area Riservata Genitori"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden md:inline">Genitori</span>
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Esci dal profilo"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
