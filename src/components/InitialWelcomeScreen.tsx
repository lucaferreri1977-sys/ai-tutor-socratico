'use client';

import React from 'react';
import { SubjectId, SUBJECTS } from '@/lib/types';
import { ArrowRight, Menu, Sparkles } from 'lucide-react';

interface InitialWelcomeScreenProps {
  studentName: string;
  onSelectSubject: (subject: SubjectId) => void;
  onOpenSidebar: () => void;
}

export function InitialWelcomeScreen({
  studentName,
  onSelectSubject,
  onOpenSidebar,
}: InitialWelcomeScreenProps) {
  const subjectList = Object.values(SUBJECTS);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Hero Welcome Message */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-sky-500/20 text-3xl sm:text-4xl mx-auto select-none">
          🦉
        </div>

        <div className="space-y-1 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800/60 text-sky-700 dark:text-sky-300 text-xs font-semibold">
            <Sparkles className="w-3 h-3" /> AI Tutor Socratico
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Benvenuto, {studentName}!
          </h1>
          <p className="text-base sm:text-xl font-semibold text-slate-700 dark:text-slate-300">
            Pronto ad iniziare ad imparare?
          </p>
        </div>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Seleziona nel menu laterale (con le tre linee <strong>☰</strong>) oppure scegli qui sotto la <strong>stanza della materia</strong> che vuoi affrontare oggi:
        </p>

        {/* Mobile Open Sidebar Helper */}
        <div className="md:hidden pt-1">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-600 text-white font-semibold text-xs shadow-md shadow-sky-600/25 cursor-pointer"
          >
            <Menu className="w-4 h-4" />
            Apri menu delle stanze (☰)
          </button>
        </div>
      </div>

      {/* Grid of Subject Rooms */}
      <div className="w-full space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center">
          Entra in una stanza di studio:
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
          {subjectList.map((subj) => (
            <button
              key={subj.id}
              type="button"
              onClick={() => onSelectSubject(subj.id)}
              className="group text-left p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-600 bg-white dark:bg-slate-900 hover:bg-sky-50/50 dark:hover:bg-slate-800/60 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl select-none flex-shrink-0">{subj.emoji}</span>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
                    {subj.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                    {subj.description}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
