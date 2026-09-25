'use client';

import React from 'react';
import { X, ShieldCheck, Key, HelpCircle, HeartHandshake, CheckCircle2 } from 'lucide-react';

interface ParentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ParentModal({ isOpen, onClose }: ParentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 my-8 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Spazio Genitori: Guida Didattica & Privacy
              </h2>
              <p className="text-xs text-slate-500">
                Come funziona Socrate e perché aiuta davvero tuo figlio ad apprendere.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content sections */}
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
          {/* Card 1: Metodo Socratico */}
          <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 space-y-2">
            <h3 className="font-semibold text-sky-900 dark:text-sky-300 flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-sky-600" />
              La Regola d&apos;Oro: Niente Risposte Pronte
            </h3>
            <p className="leading-relaxed text-xs sm:text-sm">
              I normali assistenti AI (come ChatGPT standard) tendono a risolvere gli esercizi istantaneamente. 
              <strong> Socrate è programmato con una direttiva inviolabile:</strong> guida attraverso micro-domande, 
              scompone il problema e valida ciascun passaggio logico. In questo modo lo studente allena l&apos;autonomia 
              e la sicurezza in sé stesso.
            </p>
          </div>

          {/* Card 2: Come supportare quando c'è frustrazione */}
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 space-y-2">
            <h3 className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              Cosa fare se tuo figlio dice &quot;Non ci riesco&quot;?
            </h3>
            <ul className="space-y-1.5 text-xs sm:text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>Invitalo a cliccare sul pulsante rapido <strong>&quot;💡 Fammi un esempio simile&quot;</strong>. Socrate creerà un problema gemello con numeri diversi per mostrargli il procedimento.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>Se il compito è sul quaderno, fagli scattare una foto: Socrate leggerà i suoi passaggi scritti a mano e gli dirà dove si è fermato.</span>
              </li>
            </ul>
          </div>

          {/* Card 3: Configurazione API Key */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-500" />
              Configurazione Chiave API (Google AI Studio)
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed">
              L&apos;applicazione si collega a <strong>Google Gemini Flash</strong>. Puoi ottenere una chiave API gratuita in pochi secondi su{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-sky-600 dark:text-sky-400 underline font-medium hover:text-sky-700"
              >
                Google AI Studio
              </a>{' '}
              e inserirla come variabile <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono text-xs">GOOGLE_GENERATIVE_AI_API_KEY</code> nel file <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono text-xs">.env.local</code> del progetto o nelle impostazioni di Vercel.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm transition-colors cursor-pointer"
          >
            Ho capito, grazie!
          </button>
        </div>
      </div>
    </div>
  );
}
