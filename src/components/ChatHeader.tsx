'use client';

import React from 'react';
import { StudentId, STUDENTS, AuthSession } from '@/lib/types';
import { Menu, LogOut } from 'lucide-react';

interface ChatHeaderProps {
  currentUser: AuthSession;
  currentStudent: StudentId;
  onToggleSidebar: () => void;
  onLogout: () => void;
  onTitleClick?: () => void;
  disabled?: boolean;
}

export function ChatHeader({
  currentUser,
  currentStudent,
  onToggleSidebar,
  onLogout,
  onTitleClick,
}: ChatHeaderProps) {
  const activeStudentProfile = STUDENTS[currentStudent];

  const handleRefresh = () => {
    if (onTitleClick) {
      onTitleClick();
    } else if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <header className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-2 sm:px-3 py-1.5 sm:py-2 sticky top-0 z-30 flex-shrink-0">
      <div className="relative flex items-center justify-between gap-1 sm:gap-2 w-full min-h-[38px] sm:min-h-[40px]">
        {/* Left: Tre Linee Orizzontali (☰) nell'angolo sinistro */}
        <div className="flex items-center z-10 flex-shrink-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-1.5 sm:p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer flex-shrink-0 touch-manipulation"
            title="Menu laterale (☰)"
            aria-label="Menu laterale"
          >
            <Menu className="w-5 h-5 text-slate-800 dark:text-slate-100" />
          </button>
        </div>

        {/* Center: Titolo dell'applicazione perfettamente centrato nella pagina - Cliccabile per refresh */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-14 sm:px-28">
          <button
            type="button"
            onClick={handleRefresh}
            className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto cursor-pointer p-1 sm:p-1.5 rounded-xl hover:bg-slate-100/70 dark:hover:bg-slate-800/70 active:scale-95 transition-all select-none touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 max-w-[170px] sm:max-w-none"
            title="Ricarica l'applicazione"
            aria-label="AI Tutor Socratico - Ricarica la pagina"
          >
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-xs text-xs sm:text-base select-none flex-shrink-0">
              🦉
            </div>
            <h1 className="font-bold text-slate-900 dark:text-slate-100 text-[12px] sm:text-base leading-tight truncate">
              AI Tutor Socratico
            </h1>
          </button>
        </div>

        {/* Right: Profilo Studente e Logout nell'angolo destro */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 z-10">
          {/* Student badge */}
          <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-2xs">
            <span className="text-sm">{activeStudentProfile.avatar}</span>
            <span className="hidden sm:inline">{activeStudentProfile.name}</span>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={onLogout}
            className="p-1 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer touch-manipulation"
            title="Esci dal profilo"
            aria-label="Esci dal profilo"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
