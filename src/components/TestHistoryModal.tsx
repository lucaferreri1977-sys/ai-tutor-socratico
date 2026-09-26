'use client';

import React, { useState, useEffect } from 'react';
import { SubjectId, SUBJECTS, StudentId, STUDENTS, QuizTestRecord } from '@/lib/types';
import { X, Award, ArrowLeft, ChevronRight, CheckCircle2, XCircle, Sparkles, Filter } from 'lucide-react';

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
  onOpenNewTest,
  selectedQuiz = null,
}: TestHistoryModalProps) {
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>(currentSubject || 'all');
  const [viewingQuiz, setViewingQuiz] = useState<QuizTestRecord | null>(selectedQuiz);

  useEffect(() => {
    setViewingQuiz(selectedQuiz || null);
    if (selectedQuiz?.subject) {
      setSelectedSubjectFilter(selectedQuiz.subject);
    } else if (currentSubject) {
      setSelectedSubjectFilter(currentSubject);
    }
  }, [selectedQuiz, currentSubject, isOpen]);

  if (!isOpen) return null;

  const studentProfile = STUDENTS[studentId];

  // Filter quizzes for the active student and selected subject
  const studentQuizzes = quizzes.filter((q) => q.studentId === studentId);
  const filteredQuizzes = studentQuizzes.filter((q) => {
    if (selectedSubjectFilter === 'all') return true;
    return q.subject === selectedSubjectFilter;
  });

  // Calculate statistics
  const totalTests = studentQuizzes.length;
  const avgGrade = totalTests > 0
    ? (studentQuizzes.reduce((acc, q) => acc + (q.grade || 0), 0) / totalTests).toFixed(1)
    : '-';
  const totalCorrect = studentQuizzes.reduce((acc, q) => acc + (q.score || 0), 0);
  const totalQuestions = studentQuizzes.reduce((acc, q) => acc + (q.maxScore || 5), 0);
  const correctPercent = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-xs">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Storico Verifiche &bull; {studentProfile.name}</span>
              </h2>
              <p className="text-xs text-slate-500">
                Tutti i test completati con votazione in decimi e correzione
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {/* VIEW A: Quiz Single Detail View */}
          {viewingQuiz ? (
            <div className="space-y-4 animate-in fade-in duration-150">
              <button
                type="button"
                onClick={() => setViewingQuiz(null)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Torna all&apos;elenco delle verifiche
              </button>

              {/* Quiz Summary Banner */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{viewingQuiz.subjectName}</span>
                    <span>&bull;</span>
                    <span className="truncate">{viewingQuiz.topic}</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-sky-600 dark:text-sky-400">
                      {viewingQuiz.grade}/10
                    </span>
                    <span className="text-xs text-slate-500">
                      ({viewingQuiz.score}/{viewingQuiz.maxScore} risposte esatte &bull; {viewingQuiz.percentage}%)
                    </span>
                  </div>
                </div>

                <span className="text-[11px] text-slate-400 text-right flex-shrink-0">
                  {new Date(viewingQuiz.completedAt).toLocaleDateString([], {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {/* Feedback if any */}
              {viewingQuiz.feedback && (
                <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs">
                  <strong>Giudizio di Socrate:</strong> {viewingQuiz.feedback}
                </div>
              )}

              {/* Questions Breakdown */}
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

                    <div className="text-[11px] opacity-90">
                      {ans.isCorrect ? '✅ Hai risposto correttamente!' : '❌ Risposta errata selezionata durante il test.'}
                    </div>

                    <p className="text-[11px] opacity-80 pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                      <strong>Spiegazione didattica:</strong> {ans.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* VIEW B: List of all Quizzes + Stats */
            <div className="space-y-5">
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                <div className="p-3 sm:p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 text-center">
                  <span className="text-[11px] text-slate-500 uppercase font-semibold block">
                    Media Voti
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                    {avgGrade} <span className="text-xs font-normal text-slate-400">/10</span>
                  </p>
                </div>

                <div className="p-3 sm:p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 text-center">
                  <span className="text-[11px] text-slate-500 uppercase font-semibold block">
                    Test Svolti
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400 mt-0.5">
                    {totalTests}
                  </p>
                </div>

                <div className="p-3 sm:p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-center">
                  <span className="text-[11px] text-slate-500 uppercase font-semibold block">
                    Precisione
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {correctPercent}%
                  </p>
                </div>
              </div>

              {/* Subject Filter Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
                <span className="text-slate-400 flex items-center gap-1 font-semibold whitespace-nowrap pl-1">
                  <Filter className="w-3 h-3" /> Materia:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedSubjectFilter('all')}
                  className={`px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    selectedSubjectFilter === 'all'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Tutte
                </button>
                {Object.values(SUBJECTS).map((subj) => {
                  const count = studentQuizzes.filter((q) => q.subject === subj.id).length;
                  if (count === 0 && selectedSubjectFilter !== subj.id) return null;
                  return (
                    <button
                      key={subj.id}
                      type="button"
                      onClick={() => setSelectedSubjectFilter(subj.id)}
                      className={`px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                        selectedSubjectFilter === subj.id
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      <span>{subj.emoji}</span>
                      <span>{subj.name.split(' ')[0]}</span>
                      {count > 0 && <span className="opacity-75 text-[10px]">({count})</span>}
                    </button>
                  );
                })}
              </div>

              {/* Quizzes List */}
              <div className="space-y-2">
                {filteredQuizzes.length === 0 ? (
                  <div className="text-center py-10 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-xl mx-auto">
                      📝
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {totalTests === 0
                          ? 'Nessun test svolto finora.'
                          : 'Nessun test trovato per questa materia.'}
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                        Puoi avviare una verifica in qualsiasi momento da una stanza di studio, anche allegando le foto del tuo libro di testo!
                      </p>
                    </div>

                    {onOpenNewTest && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenNewTest();
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Inizia una verifica adesso
                      </button>
                    )}
                  </div>
                ) : (
                  filteredQuizzes.map((quiz) => {
                    const subjMeta = SUBJECTS[quiz.subject as SubjectId] || SUBJECTS.matematica;
                    const dateStr = new Date(quiz.completedAt).toLocaleDateString([], {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={quiz.id}
                        onClick={() => setViewingQuiz(quiz)}
                        className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 hover:bg-sky-50/60 dark:hover:bg-sky-950/40 border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-0.5">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {subjMeta.emoji} {subjMeta.name}
                            </span>
                            <span>&bull;</span>
                            <span className="text-slate-400">{dateStr}</span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {quiz.topic}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          <div
                            className={`px-2.5 py-1 rounded-xl font-bold text-xs ${
                              quiz.grade >= 8
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : quiz.grade >= 6
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            Voto {quiz.grade}/10
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
