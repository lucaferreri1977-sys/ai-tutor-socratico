'use client';

import React, { useState } from 'react';
import { SubjectId, SUBJECTS, StudentId, QuizQuestion, QuizAnswer, QuizTestRecord } from '@/lib/types';
import { X, CheckCircle2, XCircle, Award, Sparkles, BookOpen, ArrowRight, RotateCcw, Loader2 } from 'lucide-react';
import { fireCelebrationConfetti } from '@/lib/confetti';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: SubjectId;
  studentId: StudentId;
  studentName: string;
  authToken: string;
}

export function QuizModal({
  isOpen,
  onClose,
  subject,
  studentId,
  studentName,
  authToken,
}: QuizModalProps) {
  const [topicInput, setTopicInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quiz state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerConfirmed, setIsAnswerConfirmed] = useState(false);
  const [userAnswers, setUserAnswers] = useState<QuizAnswer[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);
  const [finalGrade, setFinalGrade] = useState<number | null>(null);

  if (!isOpen) return null;

  const subjectMeta = SUBJECTS[subject];

  const handleStartQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-auth': authToken,
          'x-family-pin': authToken,
        },
        body: JSON.stringify({
          subject,
          topic: topicInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.questions) {
        throw new Error(data.error || 'Impossibile generare il quiz');
      }

      setQuestions(data.questions);
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setIsAnswerConfirmed(false);
      setUserAnswers([]);
      setQuizFinished(false);
      setFinalGrade(null);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Errore nella generazione del test');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAnswer = () => {
    if (selectedOption === null) return;
    const currentQ = questions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQ.correctOptionIndex;

    const answerRecord: QuizAnswer = {
      questionIndex: currentQuestionIndex,
      questionText: currentQ.question,
      selectedOption,
      correctOption: currentQ.correctOptionIndex,
      isCorrect,
      explanation: currentQ.explanation,
    };

    const nextAnswers = [...userAnswers, answerRecord];
    setUserAnswers(nextAnswers);
    setIsAnswerConfirmed(true);

    // If last question, finish and save
    if (currentQuestionIndex === questions.length - 1) {
      const totalCorrect = nextAnswers.filter((a) => a.isCorrect).length;
      // Grade in tenths (es. 5/5 = 10, 4/5 = 8, 3/5 = 6)
      const calculatedGrade = Math.round((totalCorrect / questions.length) * 10);
      setFinalGrade(calculatedGrade);

      if (calculatedGrade >= 7) {
        fireCelebrationConfetti();
      }

      // Save to Firebase
      saveQuizResultToCloud(totalCorrect, calculatedGrade, nextAnswers);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerConfirmed(false);
    } else {
      setQuizFinished(true);
    }
  };

  const saveQuizResultToCloud = async (correctCount: number, grade: number, answers: QuizAnswer[]) => {
    try {
      let feedback = '';
      if (grade >= 9) feedback = 'Livello eccellente! Hai una padronanza eccezionale di questo argomento.';
      else if (grade >= 7) feedback = 'Ottimo lavoro! Concetti ben compresi con pochissime incertezze.';
      else if (grade >= 6) feedback = 'Sufficiente: buone basi, ma ripassiamo insieme i punti dove hai sbagliato.';
      else feedback = 'C\'è ancora da lavorare: torna nella stanza di studio e fai domande a Socrate per chiarire i dubbi!';

      await fetch('/api/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-auth': authToken,
          'x-family-pin': authToken,
        },
        body: JSON.stringify({
          studentId,
          studentName,
          subject,
          subjectName: subjectMeta.name,
          topic: topicInput.trim() || 'Argomento generale',
          score: correctCount,
          maxScore: questions.length,
          grade,
          percentage: Math.round((correctCount / questions.length) * 100),
          answers,
          feedback,
        }),
      });
    } catch (e) {
      console.error('Failed to save quiz to Firebase:', e);
    }
  };

  const handleReset = () => {
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerConfirmed(false);
    setUserAnswers([]);
    setQuizFinished(false);
    setFinalGrade(null);
  };

  const currentQ = questions[currentQuestionIndex];
  const progressPercent = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl select-none">{subjectMeta.emoji}</span>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Test di {subjectMeta.name}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                  NotebookLM Style
                </span>
              </h2>
              <p className="text-xs text-slate-500">Mettiti alla prova e scopri la tua votazione</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* STEP 1: Quiz setup screen */}
          {questions.length === 0 && !loading && (
            <div className="space-y-5">
              <div className="text-center space-y-2 py-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center text-2xl shadow-xs">
                  📝
                </div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                  Pronto per la verifica, {studentName}?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  Socrate preparerà per te <strong>5 domande a scelta multipla</strong> con correzione guidata e <strong>votazione in decimi</strong> finale.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Argomento o capitolo specifico (opzionale):
                </label>
                <input
                  type="text"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  placeholder={`Es. ${subject === 'matematica' ? 'Equazioni di primo grado, frazioni...' : subject === 'scienze' ? 'Il sistema solare, le cellule...' : 'Capitolo o argomento del compito'}`}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-[11px] text-slate-400">
                  Lascia vuoto per un test a sorpresa su tutto il programma delle medie di {subjectMeta.name}.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleStartQuiz}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Avvia il Test di Apprendimento (5 domande)
              </button>
            </div>
          )}

          {/* LOADING STATE */}
          {loading && (
            <div className="text-center py-12 space-y-4">
              <Loader2 className="w-10 h-10 text-sky-600 animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Socrate sta componendo il tuo test...
                </p>
                <p className="text-xs text-slate-500">
                  Generazione di 5 domande didattiche su {subjectMeta.name}
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: ACTIVE QUESTION SCREEN */}
          {questions.length > 0 && !quizFinished && currentQ && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Domanda {currentQuestionIndex + 1} di {questions.length}</span>
                  <span>{Math.round(progressPercent)}% completato</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Question card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Quesito #{currentQuestionIndex + 1}
                </span>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-snug">
                  {currentQ.question}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQ.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentQ.correctOptionIndex;
                  let optionStyle = 'border-slate-200/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 bg-white dark:bg-slate-900';

                  if (isAnswerConfirmed) {
                    if (isCorrect) {
                      optionStyle = 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200';
                    } else if (isSelected && !isCorrect) {
                      optionStyle = 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
                    } else {
                      optionStyle = 'opacity-40 border-slate-200 dark:border-slate-800';
                    }
                  } else if (isSelected) {
                    optionStyle = 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 ring-2 ring-sky-500/20';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAnswerConfirmed}
                      onClick={() => setSelectedOption(idx)}
                      className={`w-full p-3.5 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-3 cursor-pointer ${optionStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{option}</span>
                      </div>

                      {isAnswerConfirmed && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      )}
                      {isAnswerConfirmed && isSelected && !isCorrect && (
                        <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation after confirmation */}
              {isAnswerConfirmed && (
                <div className={`p-4 rounded-2xl border text-xs sm:text-sm animate-in fade-in duration-200 space-y-1.5 ${
                  selectedOption === currentQ.correctOptionIndex
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                }`}>
                  <div className="font-bold flex items-center gap-1.5">
                    {selectedOption === currentQ.correctOptionIndex ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Risposta esatta! Ben fatto!</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>Spiegazione didattica di Socrate:</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">{currentQ.explanation}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2">
                {!isAnswerConfirmed ? (
                  <button
                    type="button"
                    disabled={selectedOption === null}
                    onClick={handleConfirmAnswer}
                    className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                  >
                    Conferma Risposta
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>{currentQuestionIndex < questions.length - 1 ? 'Prossima Domanda' : 'Vedi Votazione Finale'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: FINAL SCORE & EVALUATION SCREEN */}
          {quizFinished && finalGrade !== null && (
            <div className="space-y-6 text-center animate-in zoom-in-95 duration-200 py-2">
              <div className="space-y-2">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-600 text-white mx-auto flex items-center justify-center text-3xl shadow-lg shadow-amber-500/25">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-slate-100">
                  Test Completato!
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Ecco la valutazione per {studentName} in <strong>{subjectMeta.name}</strong>
                </p>
              </div>

              {/* Big Grade Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-50 to-sky-50 dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200/80 dark:border-slate-700 shadow-sm max-w-sm mx-auto space-y-2">
                <div className="text-4xl sm:text-5xl font-black text-sky-600 dark:text-sky-400">
                  {finalGrade}<span className="text-xl sm:text-2xl text-slate-400 font-bold">/10</span>
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  {finalGrade >= 9
                    ? '🌟 Eccellente!'
                    : finalGrade >= 8
                    ? '👏 Ottimo Lavoro!'
                    : finalGrade >= 7
                    ? '👍 Buono'
                    : finalGrade >= 6
                    ? '👌 Sufficiente'
                    : '📚 Da ripassare'}
                </div>
                <p className="text-xs text-slate-500 pt-1">
                  Hai risposto correttamente a {userAnswers.filter((a) => a.isCorrect).length} domande su {questions.length}.
                </p>
              </div>

              {/* Question Summary Review */}
              <div className="text-left space-y-3 pt-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Riepilogo risposte:
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {userAnswers.map((ans, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                        ans.isCorrect
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                          : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="font-semibold truncate">
                          {i + 1}. {ans.questionText}
                        </div>
                        <p className="text-[11px] opacity-80">{ans.explanation}</p>
                      </div>
                      {ans.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Rifai un altro test
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Torna alla stanza di studio
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
