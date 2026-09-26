'use client';

import React from 'react';
import { Sparkles, Camera, ArrowRight, BookOpen, Lightbulb } from 'lucide-react';

interface GeminiWelcomeProps {
  studentName: string;
  onSelectPrompt: (prompt: string) => void;
  onTriggerPhotoUpload?: () => void;
}

export function GeminiWelcome({
  studentName,
  onSelectPrompt,
  onTriggerPhotoUpload,
}: GeminiWelcomeProps) {
  const cards = [
    {
      emoji: '📐',
      title: 'Matematica & Geometria',
      description: 'Aiutami a capire un problema di geometria o risolvere un\'equazione',
      prompt: 'Ho un problema di matematica/geometria: mi aiuti a capire i dati e a impostare il primo passaggio?',
      color: 'hover:border-blue-300 dark:hover:border-blue-700 bg-blue-50/40 dark:bg-blue-950/20 text-blue-900 dark:text-blue-100',
    },
    {
      emoji: '📖',
      title: 'Grammatica & Analisi Logica',
      description: 'Facciamo l\'analisi logica o grammaticale di una frase passo dopo passo',
      prompt: 'Aiutami a fare l\'analisi logica di questa frase guidandomi un pezzo alla volta.',
      color: 'hover:border-amber-300 dark:hover:border-amber-700 bg-amber-50/40 dark:bg-amber-950/20 text-amber-900 dark:text-amber-100',
    },
    {
      emoji: '✍️',
      title: 'Temi & Scrittura',
      description: 'Costruiamo una scaletta con introduzione, svolgimento e conclusione',
      prompt: 'Devo scrivere un testo per scuola: mi aiuti a raccogliere le idee e fare una scaletta?',
      color: 'hover:border-orange-300 dark:hover:border-orange-700 bg-orange-50/40 dark:bg-orange-950/20 text-orange-900 dark:text-orange-100',
    },
    {
      emoji: '🔬',
      title: 'Scienze & Natura',
      description: 'Spiegazioni intuitive con esempi pratici su cellule, corpo umano o pianeti',
      prompt: 'Spiegami questo argomento di scienze usando un esempio facile della vita quotidiana.',
      color: 'hover:border-emerald-300 dark:hover:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100',
    },
    {
      emoji: '🏛️',
      title: 'Storia & Geografia',
      description: 'Comprendi le cause degli eventi storici o l\'economia e il territorio',
      prompt: 'Aiutami a schematizzare questo capitolo di storia/geografia capendo cause e conseguenze.',
      color: 'hover:border-rose-300 dark:hover:border-rose-700 bg-rose-50/40 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100',
    },
    {
      emoji: '📸',
      title: 'Foto del Quaderno o Libro',
      description: 'Carica la foto di un esercizio o pagina per ragionarci insieme a Socrate',
      prompt: 'Ho caricato la foto del mio compito: da quale piccolo passaggio partiamo?',
      color: 'hover:border-purple-300 dark:hover:border-purple-700 bg-purple-50/40 dark:bg-purple-950/20 text-purple-900 dark:text-purple-100',
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 py-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Hero Greeting (Gemini Style) */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800/60 text-sky-700 dark:text-sky-300 text-xs font-semibold shadow-xs">
          <span>🦉 Socrate Tutor Socratico</span>
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Ciao, {studentName}!
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-lg mx-auto font-normal">
          Cosa studiamo oggi insieme? Chiedimi qualsiasi materia scolastica: ti guiderò passo dopo passo senza fare i compiti al tuo posto.
        </p>
      </div>

      {/* Suggestion Prompt Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full">
        {cards.map((card, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectPrompt(card.prompt)}
            className={`group text-left p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between ${card.color}`}
          >
            <div className="space-y-2">
              <span className="text-2xl select-none">{card.emoji}</span>
              <h3 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 flex items-center justify-between">
                <span>{card.title}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-slate-500" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {card.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Pedagogical Hint */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs">
        <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span>
          Puoi scrivere liberamente o <strong>inviare la foto del quaderno</strong>: Socrate individuerà la materia e ti farà ragionare!
        </span>
      </div>
    </div>
  );
}
