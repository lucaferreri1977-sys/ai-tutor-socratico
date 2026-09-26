'use client';

import React from 'react';
import { SubjectId, SUBJECTS, StudentId, STUDENTS, AuthSession } from '@/lib/types';
import { StudentSelector } from './StudentSelector';
import { Menu, LogOut, Award } from 'lucide-react';

interface ChatHeaderProps {
  currentSubject: SubjectId | null;
  currentUser: AuthSession;
  currentStudent: StudentId;
  onSelectStudent: (student: StudentId) => void;
  onToggleSidebar: () => void;
  onOpenQuiz: () => void;
  onLogout: () => void;
  disabled?: boolean;
}

export function ChatHeader({
  currentSubject,
  currentUser,
  currentStudent,
  onSelectStudent,
  onToggleSidebar,
  onOpenQuiz,
  onLogout,
  disabled = false,
}: ChatHeaderProps) {
  const isParent = currentUser.role === 'parent';
  const activeStudentProfile = STUDENTS[currentStudent];
  const subjectMeta = currentSubject ? SUBJECTS[currentSubject] : null;

  return (
    <header className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-4 py-2.5 sticky top-0 z-30">
      <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">
        {/* Left: Tre Linee Orizzontali (Hamburger ☰) & Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Apri menu stanze delle materie (☰)"
            aria-label="Menu laterale"
          >
            <Menu className="w-5 h-5 text-slate-800 dark:text-slate-100" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-xs text-base select-none">
              🦉
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-tight whitespace-nowrap">
                  AI Tutor Socratico
                </h1>
                {subjectMeta && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/40">
                    <span>{subjectMeta.emoji}</span>
                    <span>{subjectMeta.name}</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 sm:hidden">
                {subjectMeta ? `${subjectMeta.emoji} ${subjectMeta.name}` : 'Nessuna stanza attiva'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Quiz Button (Available inside a subject room) */}
          {subjectMeta && (
            <button
              type="button"
              onClick={onOpenQuiz}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="Avvia test di apprendimento con votazione finale"
            >
              <Award className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Test con Voto</span>
              <span className="sm:hidden">Test</span>
            </button>
          )}

          {/* Student badge / switcher */}
          {isParent ? (
            <div className="flex items-center gap-1.5">
              <span className="hidden lg:inline-flex text-xs font-semibold px-2 py-1 rounded-xl bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
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

          {/* Logout (in alto a destra) */}
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
