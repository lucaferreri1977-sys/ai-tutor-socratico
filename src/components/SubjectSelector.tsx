'use client';

import React from 'react';
import { SubjectId, SUBJECTS, SubjectMeta } from '@/lib/types';

interface SubjectSelectorProps {
  currentSubject: SubjectId;
  onSelectSubject: (subject: SubjectId) => void;
  disabled?: boolean;
}

export function SubjectSelector({
  currentSubject,
  onSelectSubject,
  disabled = false,
}: SubjectSelectorProps) {
  const subjectsList = Object.values(SUBJECTS) as SubjectMeta[];

  return (
    <div className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 py-2">
      <div className="max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 whitespace-nowrap px-1">
          Materie:
        </span>
        {subjectsList.map((sub) => {
          const isSelected = sub.id === currentSubject;
          return (
            <button
              key={sub.id}
              onClick={() => onSelectSubject(sub.id)}
              disabled={disabled}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer shadow-xs ${
                isSelected
                  ? 'bg-sky-600 text-white shadow-sky-200 dark:shadow-none scale-105 font-semibold ring-2 ring-sky-400/50'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-102'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={sub.description}
            >
              <span className="text-sm">{sub.emoji}</span>
              <span>{sub.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
