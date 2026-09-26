'use client';

import React from 'react';
import { SubjectId, SUBJECTS } from '@/lib/types';
import { ArrowRight } from 'lucide-react';

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
    <div className="flex-1 flex flex-col items-center justify-center py-3 sm:py-6 px-2 sm:px-4 max-w-4xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-200 my-auto">
      {/* Welcome Heading */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Benvenuto, {studentName}!
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Scegli la materia per iniziare lo studio guidato o metterti alla prova con una verifica:
        </p>
      </div>

      {/* Grid of Subject Rooms */}
      <div className="w-full">
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
