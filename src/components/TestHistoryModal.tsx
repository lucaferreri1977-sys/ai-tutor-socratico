'use client';

import React from 'react';
import { SubjectId, SUBJECTS, StudentId, STUDENTS, QuizTestRecord } from '@/lib/types';
import { X, Award, CheckCircle2, XCircle, Lightbulb, Clock } from 'lucide-react';
import { formatDateTime } from '@/lib/date-utils';

interface TestHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: StudentId;
  quizzes: QuizTestRecord[];
  currentSubject?: SubjectId | null;
  onOpenNewTest?: () => void;
  selectedQuiz?: QuizTestRecord | null;
}

export function TestHistoryModal({
  isOpen,
  onClose,
  studentId,
  quizzes,
  currentSubject = null,
  selectedQuiz = null,
}: TestHistoryModalProps) {
  if (!isOpen) return null;

  const studentProfile = STUDENTS[studentId];

  // Identifica la verifica da mostrare (quella selezionata o la più recente per lo studente/materia)
  const studentQuizzes = quizzes.filter((q) => q.studentId === studentId);
  const subjectQuizzes = currentSubject
    ? studentQuizzes.filter((q) => q.subject === currentSubject)
    : studentQuizzes;

  const viewingQuiz = selectedQuiz || subjectQuizzes[0] || null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center gap-1.5 sm:gap-2 truncate">
                <span>
                  Revisione Verifica &bull; {viewingQuiz ? viewingQuiz.subjectName : (currentSubject ? SUBJECTS[currentSubject]?.name : 'Verifica')} &bull; {studentProfile.name}
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                {viewingQuiz
                  ? `${viewingQuiz.topic} • Risposte e correzioni didattiche di Socrate`
                  : 'Dettaglio del test completato'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center flex-shrink-0 touch-manipulation"
            title="Chiudi revisione"
            aria-label="Chiudi finestra"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {!viewingQuiz ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-xl mx-auto">
                📝
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                Nessuna verifica trovata da revisionare.
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Quiz Summary Banner */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{viewingQuiz.subjectName}</span>
                    <span>&bull;</span>
                    <span className="truncate">{viewingQuiz.topic}</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2 flex-wrap">
                    <span className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400">
                      Voto {viewingQuiz.grade}/10
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      ({viewingQuiz.score} su {viewingQuiz.maxScore} risposte esatte &bull; {viewingQuiz.percentage}%)
                    </span>
                    {viewingQuiz.masteryCompleted && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-300/80 dark:border-amber-800">
                        🏆 100% Recuperato col Ripasso
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-[11px] sm:text-xs text-slate-400 sm:text-right flex-shrink-0 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {formatDateTime(viewingQuiz.completedAt)}
                </span>
              </div>

              {/* Feedback didattico di Socrate */}
              {viewingQuiz.feedback && (
                <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs">
                  <strong>Giudizio di Socrate:</strong> {viewingQuiz.feedback}
                </div>
              )}

              {/* Dettaglio Domande e Risposte */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Dettaglio Domande e Risposte:
                </h4>

                {viewingQuiz.answers?.map((ans, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                      ans.isCorrect
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200'
                        : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 text-rose-950 dark:text-rose-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 font-semibold">
                      <span>{idx + 1}. {ans.questionText}</span>
                      {ans.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      )}
                    </div>

                    <div className="text-[11px] opacity-90 flex items-center justify-between gap-2 flex-wrap">
                      <span>{ans.isCorrect ? '✅ Hai risposto correttamente!' : '❌ Risposta errata selezionata durante il test.'}</span>
                      {ans.usedHint && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md border border-amber-300/60 dark:border-amber-800/50 flex-shrink-0">
                          <Lightbulb className="w-2.5 h-2.5 text-amber-500" />
                          Ha usato l&apos;indizio
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] opacity-80 pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                      <strong>Spiegazione didattica:</strong> {ans.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
