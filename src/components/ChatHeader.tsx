'use client';

import React from 'react';
import { SubjectId, SUBJECTS, StudentId, STUDENTS, AuthSession } from '@/lib/types';
import { StudentSelector } from './StudentSelector';
import { Menu, LogOut, Sparkles } from 'lucide-react';

interface ChatHeaderProps {
  currentSubject: SubjectId | null;
  currentUser: AuthSession;
  currentStudent: StudentId;
  onSelectStudent: (student: StudentId) => void;
  onToggleSidebar: () => void;
  onOpenQuiz: () => void;
  onOpenTestHistory: () => void;
  onLogout: () => void;
  disabled?: boolean;
  testCount?: number;
}

export function ChatHeader({
  currentSubject,
  currentUser,
  currentStudent,
  onSelectStudent,
  onToggleSidebar,
  onOpenQuiz,
  onOpenTestHistory,
  onLogout,
  disabled = false,
  testCount = 0,
}: ChatHeaderProps) {
  const isParent = currentUser.role === 'parent';
  const activeStudentProfile = STUDENTS[currentStudent];
  const subjectMeta = currentSubject ? SUBJECTS[currentSubject] : null;

  return (
    <header className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-4 py-2 sticky top-0 z-30">
      <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">
        {/* Left: Tre Linee Orizzontali (☰) & Titolo / Materia */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex-shrink-0"
            title="Apri menu stanze (☰)"
            aria-label="Menu laterale"
          >
            <Menu className="w-5 h-5 text-slate-800 dark:text-slate-100" />
          </button>

          {subjectMeta ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl select-none flex-shrink-0">{subjectMeta.emoji}</span>
              <h1 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-tight truncate">
                {subjectMeta.name}
              </h1>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-xs text-base select-none flex-shrink-0">
                🦉
              </div>
              <h1 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-tight truncate">
                AI Tutor Socratico
              </h1>
            </div>
          )}
        </div>

        {/* Right Controls: Avvia Verifica, Profilo, Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          {/* Nuova Verifica (visibile solo se dentro una materia) */}
          {subjectMeta && (
            <button
              type="button"
              onClick={onOpenQuiz}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="Avvia una verifica con voto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nuova Verifica</span>
            </button>
          )}

          {/* Student badge / switcher */}
          {isParent ? (
            <div className="flex items-center gap-1.5">
              <span className="hidden lg:inline-flex text-xs font-semibold px-2 py-1 rounded-xl bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                Genitori
              </span>
              <StudentSelector
                currentStudent={currentStudent}
                onSelectStudent={onSelectStudent}
                disabled={disabled}
              />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100">
              <span className="text-sm">{activeStudentProfile.avatar}</span>
              <span className="hidden sm:inline">{activeStudentProfile.name}</span>
            </div>
          )}

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
