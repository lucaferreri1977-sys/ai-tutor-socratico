'use client';

import React from 'react';
import { SubjectMeta } from '@/lib/types';
import { Camera, Sparkles, BookOpen, Lightbulb } from 'lucide-react';

interface SubjectWelcomeProps {
  subject: SubjectMeta;
  onSelectPrompt: (prompt: string) => void;
}

export function SubjectWelcome({ subject, onSelectPrompt }: SubjectWelcomeProps) {
  return (
    <div className="max-w-2xl mx-auto my-6 px-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Hero Welcome Card */}
      <div className="bg-gradient-to-br from-sky-50 via-white to-indigo-50/40 dark:from-slate-800/80 dark:via-slate-900 dark:to-indigo-950/30 p-6 rounded-3xl border border-sky-100 dark:border-slate-800 shadow-sm text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-400 to-indigo-600 mx-auto flex items-center justify-center text-3xl shadow-lg shadow-sky-500/25">
          {subject.emoji}
        </div>

        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
            Studio di {subject.name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {subject.description}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-100/80 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          Ti guiderò passo dopo passo: ragiona con la tua testa!
        </div>

        {/* Suggestion for Photo */}
        <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
          <Camera className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span>Puoi scattare o caricare la foto del quaderno o del libro degli esercizi.</span>
        </div>
      </div>

      {/* Suggested Starting Questions */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center">
          Oppure parti da uno di questi argomenti:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {subject.quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => onSelectPrompt(prompt)}
              className="text-left p-3 rounded-2xl bg-white dark:bg-slate-800/80 hover:bg-sky-50/70 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-600 text-xs sm:text-sm text-slate-700 dark:text-slate-200 transition-all flex items-start gap-2.5 shadow-2xs group cursor-pointer"
            >
              <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <span>{prompt}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
