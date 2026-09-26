'use client';

import React from 'react';
import { StudentId, STUDENTS, AuthSession } from '@/lib/types';
import { Menu, LogOut } from 'lucide-react';

interface ChatHeaderProps {
  currentUser: AuthSession;
  currentStudent: StudentId;
  onToggleSidebar: () => void;
  onLogout: () => void;
  disabled?: boolean;
  // Optional legacy props kept for backward-compatibility
  currentSubject?: any;
  onSelectStudent?: (student: StudentId) => void;
  onOpenQuiz?: () => void;
  onOpenTestHistory?: () => void;
  testCount?: number;
}

export function ChatHeader({
  currentUser,
  currentStudent,
  onToggleSidebar,
  onLogout,
}: ChatHeaderProps) {
  const activeStudentProfile = STUDENTS[currentStudent];

  return (
    <header className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-4 py-2 sticky top-0 z-30">
      <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">
        {/* Left: Tre Linee Orizzontali (☰) & AI Tutor Socratico */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex-shrink-0"
            title="Menu laterale (☰)"
            aria-label="Menu laterale"
          >
            <Menu className="w-5 h-5 text-slate-800 dark:text-slate-100" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-xs text-base select-none flex-shrink-0">
              🦉
            </div>
            <h1 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-tight truncate">
              AI Tutor Socratico
            </h1>
          </div>
        </div>

        {/* Right Controls: Profilo Studente e Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          {/* Student badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100">
            <span className="text-sm">{activeStudentProfile.avatar}</span>
            <span className="hidden sm:inline">{activeStudentProfile.name}</span>
          </div>

          {/* Logout */}
          <button
            type="button"
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
