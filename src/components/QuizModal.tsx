'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SubjectId, SUBJECTS, StudentId, QuizQuestion, QuizAnswer, QuizTestRecord, ReinforcementRecapPoint } from '@/lib/types';
import { X, CheckCircle2, XCircle, Award, Sparkles, ArrowRight, RotateCcw, Loader2, ImagePlus, Trash2, Lightbulb, Trophy, Target } from 'lucide-react';
import { fireCelebrationConfetti } from '@/lib/confetti';
import { compressImage } from '@/lib/image-utils';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: SubjectId;
  studentId: StudentId;
  studentName: string;
  authToken: string;
  onQuizCompleted?: (record: QuizTestRecord) => void;
}

interface AttachedImage {
  id: string;
  dataUrl: string;
  name: string;
}

export function QuizModal({
  isOpen,
  onClose,
  subject,
  studentId,
  studentName,
  authToken,
  onQuizCompleted,
}: QuizModalProps) {
  const [topicInput, setTopicInput] = useState('');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [images, setImages] = useState<AttachedImage[]>([]);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quiz state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerConfirmed, setIsAnswerConfirmed] = useState(false);
  const [userAnswers, setUserAnswers] = useState<QuizAnswer[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);
  const [finalGrade, setFinalGrade] = useState<number | null>(null);
  const [sessionSeenQuestions, setSessionSeenQuestions] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [usedHintQuestions, setUsedHintQuestions] = useState<Record<number, boolean>>({});

  // Reinforcement (Mastery Mode) state
  const [reinforcementStage, setReinforcementStage] = useState<'idle' | 'recap' | 'testing' | 'success' | 'partial'>('idle');
  const [reinforcementRecap, setReinforcementRecap] = useState<ReinforcementRecapPoint[]>([]);
  const [reinforcementQuestions, setReinforcementQuestions] = useState<QuizQuestion[]>([]);
  const [reinforcementCurrentIndex, setReinforcementCurrentIndex] = useState(0);
  const [reinforcementSelectedOption, setReinforcementSelectedOption] = useState<number | null>(null);
  const [reinforcementIsConfirmed, setReinforcementIsConfirmed] = useState(false);
  const [reinforcementAnswers, setReinforcementAnswers] = useState<QuizAnswer[]>([]);
  const [reinforcementShowHint, setReinforcementShowHint] = useState(false);
  const [reinforcementUsedHintMap, setReinforcementUsedHintMap] = useState<Record<number, boolean>>({});
  const [reinforcementAttempt, setReinforcementAttempt] = useState(1);
  const [isReinforcementLoading, setIsReinforcementLoading] = useState(false);
  const [savedQuizRecord, setSavedQuizRecord] = useState<QuizTestRecord | null>(null);

  const handleReset = () => {
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerConfirmed(false);
    setUserAnswers([]);
    setQuizFinished(false);
    setFinalGrade(null);
    setImages([]);
    setTopicInput('');
    setError(null);
    setShowHint(false);
    setUsedHintQuestions({});
    // Reset reinforcement
    setReinforcementStage('idle');
    setReinforcementRecap([]);
    setReinforcementQuestions([]);
    setReinforcementCurrentIndex(0);
    setReinforcementSelectedOption(null);
    setReinforcementIsConfirmed(false);
    setReinforcementAnswers([]);
    setReinforcementShowHint(false);
    setReinforcementUsedHintMap({});
    setReinforcementAttempt(1);
    setIsReinforcementLoading(false);
    setSavedQuizRecord(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Se cambia materia o studente, resetta immediatamente per evitare contaminazioni tra materie
  useEffect(() => {
    handleReset();
    setSessionSeenQuestions([]);
  }, [subject, studentId]);

  if (!isOpen) return null;

  const subjectMeta = SUBJECTS[subject];

  const handleImageFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessingImages(true);
    setError(null);

    try {
      const newImages: AttachedImage[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        const compressedDataUrl = await compressImage(file);
        newImages.push({
          id: `${Date.now()}-${i}-${Math.random().toString(36).substring(5)}`,
          dataUrl: compressedDataUrl,
          name: file.name,
        });
      }
      setImages((prev) => [...prev, ...newImages]);
    } catch (e) {
      console.error('Error processing images:', e);
      setError('Impossibile caricare alcune foto. Riprova con un formato standard (JPG o PNG).');
    } finally {
      setIsProcessingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (idToRemove: string) => {
    setImages((prev) => prev.filter((img) => img.id !== idToRemove));
  };

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
          studentId,
          topic: topicInput.trim() || undefined,
          images: images.length > 0 ? images.map((img) => img.dataUrl) : undefined,
          questionCount,
          excludeQuestions: sessionSeenQuestions.length > 0 ? sessionSeenQuestions : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.questions) {
        throw new Error(data.error || 'Impossibile generare il quiz');
      }

      const generatedQuestions = data.questions as QuizQuestion[];
      setQuestions(generatedQuestions);
      setSessionSeenQuestions((prev) =>
        Array.from(new Set([...prev, ...generatedQuestions.map((q) => q.question)]))
      );
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
      usedHint: !!usedHintQuestions[currentQuestionIndex],
    };

    const nextAnswers = [...userAnswers, answerRecord];
    setUserAnswers(nextAnswers);
    setIsAnswerConfirmed(true);

    // If last question, finish and save
    if (currentQuestionIndex === questions.length - 1) {
      const totalCorrect = nextAnswers.filter((a) => a.isCorrect).length;
      const calculatedGrade = Math.round((totalCorrect / questions.length) * 10);
      setFinalGrade(calculatedGrade);

      if (calculatedGrade >= 7) {
        fireCelebrationConfetti();
      }

      saveQuizResultToCloud(totalCorrect, calculatedGrade, nextAnswers);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerConfirmed(false);
      setShowHint(false);
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

      const effectiveTopic = topicInput.trim()
        || (images.length > 0 ? `Verifica da ${images.length} foto libro` : `Programma generale di ${subjectMeta.name}`);

      const record: QuizTestRecord = {
        id: `quiz-${Date.now()}`,
        studentId,
        studentName,
        subject,
        subjectName: subjectMeta.name,
        topic: effectiveTopic,
        score: correctCount,
        maxScore: questions.length,
        grade,
        percentage: Math.round((correctCount / questions.length) * 100),
        answers,
        feedback,
        completedAt: new Date().toISOString(),
      };

      setSavedQuizRecord(record);

      // Notify parent state for instant real-time history update
      if (onQuizCompleted) {
        onQuizCompleted(record);
      }

      // Save to Firebase
      await fetch('/api/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-auth': authToken,
          'x-family-pin': authToken,
        },
        body: JSON.stringify(record),
      });
    } catch (e) {
      console.error('Failed to save quiz to Firebase:', e);
    }
  };

  const handleStartReinforcement = async (isRetry = false) => {
    const missedList = isRetry
      ? reinforcementAnswers
          .filter((a) => !a.isCorrect)
          .map((a) => {
            const origQ = reinforcementQuestions[a.questionIndex];
            return {
              questionText: a.questionText,
              selectedOptionText: origQ && a.selectedOption !== null && origQ.options[a.selectedOption] ? origQ.options[a.selectedOption] : undefined,
              correctOptionText: origQ && a.correctOption !== null && origQ.options[a.correctOption] ? origQ.options[a.correctOption] : undefined,
              explanation: a.explanation,
            };
          })
      : userAnswers
          .filter((a) => !a.isCorrect)
          .map((a) => {
            const origQ = questions[a.questionIndex];
            return {
              questionText: a.questionText,
              selectedOptionText: origQ && a.selectedOption !== null && origQ.options[a.selectedOption] ? origQ.options[a.selectedOption] : undefined,
              correctOptionText: origQ && a.correctOption !== null && origQ.options[a.correctOption] ? origQ.options[a.correctOption] : undefined,
              explanation: a.explanation,
            };
          });

    if (missedList.length === 0) return;

    setIsReinforcementLoading(true);
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
          studentId,
          topic: topicInput.trim() || undefined,
          mode: 'reinforcement',
          missedQuestions: missedList,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.questions || data.questions.length === 0) {
        throw new Error(data.error || 'Impossibile generare la scheda di ripasso');
      }

      setReinforcementRecap(data.recapPoints || []);
      setReinforcementQuestions(data.questions);
      setReinforcementStage('recap');
      setReinforcementAttempt((prev) => (isRetry ? prev + 1 : 1));
    } catch (err: unknown) {
      console.error('Error starting reinforcement:', err);
      setError(err instanceof Error ? err.message : 'Errore nella generazione del ripasso');
    } finally {
      setIsReinforcementLoading(false);
    }
  };

  const handleLaunchReinforcementTest = () => {
    setReinforcementStage('testing');
    setReinforcementCurrentIndex(0);
    setReinforcementSelectedOption(null);
    setReinforcementIsConfirmed(false);
    setReinforcementAnswers([]);
    setReinforcementShowHint(false);
    setReinforcementUsedHintMap({});
  };

  const handleConfirmReinforcementAnswer = () => {
    if (reinforcementSelectedOption === null) return;
    const currentQ = reinforcementQuestions[reinforcementCurrentIndex];
    const isCorrect = reinforcementSelectedOption === currentQ.correctOptionIndex;

    const answerRecord: QuizAnswer = {
      questionIndex: reinforcementCurrentIndex,
      questionText: currentQ.question,
      selectedOption: reinforcementSelectedOption,
      correctOption: currentQ.correctOptionIndex,
      isCorrect,
      explanation: currentQ.explanation,
      usedHint: !!reinforcementUsedHintMap[reinforcementCurrentIndex],
    };

    const nextAnswers = [...reinforcementAnswers, answerRecord];
    setReinforcementAnswers(nextAnswers);
    setReinforcementIsConfirmed(true);
  };

  const handleNextReinforcementQuestion = () => {
    if (reinforcementCurrentIndex < reinforcementQuestions.length - 1) {
      setReinforcementCurrentIndex((prev) => prev + 1);
      setReinforcementSelectedOption(null);
      setReinforcementIsConfirmed(false);
      setReinforcementShowHint(false);
    } else {
      // Completed all reinforcement questions
      const allCorrect = reinforcementAnswers.every((a) => a.isCorrect);
      if (allCorrect) {
        fireCelebrationConfetti();
        setReinforcementStage('success');
        if (savedQuizRecord) {
          const updatedRecord: QuizTestRecord = {
            ...savedQuizRecord,
            masteryCompleted: true,
            reinforcementScore: {
              recoveredCount: reinforcementAnswers.length,
              totalToRecover: reinforcementQuestions.length,
              completedAt: new Date().toISOString(),
            },
          };
          setSavedQuizRecord(updatedRecord);
          if (onQuizCompleted) onQuizCompleted(updatedRecord);

          fetch('/api/quiz', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'x-user-auth': authToken,
              'x-family-pin': authToken,
            },
            body: JSON.stringify({
              id: savedQuizRecord.id,
              masteryCompleted: true,
              reinforcementScore: updatedRecord.reinforcementScore,
            }),
          }).catch((e) => console.error('Error updating mastery in cloud:', e));
        }
      } else {
        setReinforcementStage('partial');
      }
    }
  };

  const currentQ = questions[currentQuestionIndex];
  const progressPercent = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const currentReinforcementQ = reinforcementQuestions[reinforcementCurrentIndex];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header - Dinamico in base alla fase di verifica o ripasso */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl select-none">{subjectMeta.emoji}</span>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {reinforcementStage === 'idle'
                  ? `Verifica di ${subjectMeta.name}`
                  : reinforcementStage === 'recap'
                  ? `Scheda di Ripasso: ${subjectMeta.name}`
                  : reinforcementStage === 'testing'
                  ? `Mini-Test di Rivincita: ${subjectMeta.name}`
                  : reinforcementStage === 'success'
                  ? `Obiettivo Raggiunto: 100% Padronanza!`
                  : `Verifica dei Progressi: ${subjectMeta.name}`}
              </h2>
              <p className="text-xs text-slate-500">
                {reinforcementStage === 'idle'
                  ? `${questionCount} domande a risposta multipla con voto in decimi per ${studentName}`
                  : reinforcementStage === 'recap'
                  ? `Micro-ripasso concettuale per ${studentName} prima del mini-test di rivincita`
                  : reinforcementStage === 'testing'
                  ? `Domanda ${reinforcementCurrentIndex + 1} di ${reinforcementQuestions.length} per superare gli errori`
                  : reinforcementStage === 'success'
                  ? `Tutte le lacune sono state colmate con successo!`
                  : `Hai fatto progressi, verifichiamo gli ultimi dettagli`}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* STEP 1: Quiz setup screen (Argomento + Numero Domande + Caricamento Foto Libro) */}
          {reinforcementStage === 'idle' && questions.length === 0 && !loading && !isReinforcementLoading && (
            <div className="space-y-4">
              {/* Selezione Numero Domande */}
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Quante domande vuoi fare?
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                  {[
                    { count: 10, label: 'Veloce' },
                    { count: 20, label: 'Standard' },
                    { count: 30, label: 'Approfondito' },
                  ].map((opt) => (
                    <button
                      key={opt.count}
                      type="button"
                      onClick={() => setQuestionCount(opt.count)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 border touch-manipulation ${
                        questionCount === opt.count
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs ring-2 ring-sky-500/20'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700'
                      }`}
                    >
                      <span className="text-base font-black">{opt.count}</span>
                      <span className="text-[11px] font-medium opacity-90">
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Argomento Opzionale */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Argomento o capitolo specifico (opzionale):
                </label>
                <input
                  type="text"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  placeholder={`Es. ${
                    subject === 'matematica'
                      ? 'Equazioni, Teorema di Pitagora, frazioni...'
                      : subject === 'scienze'
                      ? 'Il sistema solare, fotosintesi, apparato circolatorio...'
                      : 'Capitolo o pagine da verificare'
                  }`}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Sezione Caricamento Foto del Libro / Appunti */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span>Foto delle pagine del libro o appunti (opzionale):</span>
                  </label>
                  {images.length > 0 && (
                    <span className="text-[11px] font-medium text-sky-600 dark:text-sky-400">
                      {images.length} {images.length === 1 ? 'pagina caricata' : 'pagine caricate'}
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleImageFiles(e.target.files)}
                  accept="image/*"
                  multiple
                  className="hidden"
                />

                {/* Previews Grid if photos are uploaded */}
                {images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                    {images.map((img, index) => (
                      <div
                        key={img.id}
                        className="relative group aspect-3/4 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-white/5"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.dataUrl}
                          alt={`Pagina ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-center">
                          <span className="text-[10px] text-white font-medium">
                            Pagina {index + 1}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(img.id)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-xs opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
                          title="Rimuovi foto"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {/* Add More Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessingImages}
                      className="aspect-3/4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-400 hover:bg-sky-50/50 dark:hover:bg-sky-950/20 flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-sky-600 transition-all cursor-pointer"
                    >
                      <ImagePlus className="w-5 h-5" />
                      <span className="text-[10px] font-semibold">+ Altra foto</span>
                    </button>
                  </div>
                )}

                {/* Empty State Upload Trigger */}
                {images.length === 0 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingImages}
                    className="w-full py-4 px-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-400 hover:bg-sky-50/40 dark:hover:bg-slate-800/60 transition-all flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <ImagePlus className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Aggiungi foto del libro o del quaderno
                    </span>
                    <span className="text-[11px] text-slate-400 max-w-xs">
                      Scatta una foto alle pagine del libro: Socrate baserà le domande direttamente su quel testo e formule!
                    </span>
                  </button>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                  {error}
                </div>
              )}

              {/* Pulsante Unico di Avvio */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleStartQuiz}
                  disabled={isProcessingImages}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {images.length > 0
                    ? `Avvia Verifica da ${images.length} foto (${questionCount} domande)`
                    : `Avvia Verifica (${questionCount} domande)`}
                </button>
              </div>
            </div>
          )}

          {/* LOADING STATE */}
          {reinforcementStage === 'idle' && loading && (
            <div className="text-center py-12 space-y-4">
              <Loader2 className="w-10 h-10 text-sky-600 animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  {images.length > 0
                    ? 'Socrate sta leggendo le pagine e preparando il test...'
                    : 'Socrate sta componendo il tuo test...'}
                </p>
                <p className="text-xs text-slate-500">
                  {images.length > 0
                    ? `Analisi del materiale fotografato e generazione di ${questionCount} domande per ${subjectMeta.name}`
                    : `Generazione di ${questionCount} domande didattiche per ${subjectMeta.name}`}
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: ACTIVE QUESTION SCREEN */}
          {reinforcementStage === 'idle' && questions.length > 0 && !quizFinished && currentQ && (
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
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-snug">
                  {currentQ.question}
                </h3>

                {/* Pulsante o Box Suggerimento Maieutico */}
                {!isAnswerConfirmed && (
                  <div className="pt-0.5">
                    {!showHint ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShowHint(true);
                          setUsedHintQuestions((prev) => ({ ...prev, [currentQuestionIndex]: true }));
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200/80 dark:border-amber-800/60 transition-all cursor-pointer shadow-2xs group"
                      >
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
                        <span>Suggerimento</span>
                      </button>
                    ) : (
                      <div className="p-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-950 dark:text-amber-100 text-xs animate-in fade-in duration-200 space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          <span>Suggerimento di Socrate:</span>
                        </div>
                        <p className="leading-relaxed opacity-95">
                          {currentQ.hint || 'Rileggi con attenzione il testo della domanda e prova a collegare i concetti chiave con le regole studiate.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
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
          {reinforcementStage === 'idle' && quizFinished && finalGrade !== null && (
            <div className="space-y-6 text-center animate-in zoom-in-95 duration-200 py-2">
              <div className="space-y-1">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 text-white mx-auto flex items-center justify-center text-2xl shadow-lg shadow-amber-500/25">
                  <Award className="w-7 h-7" />
                </div>
                <h3 className="font-extrabold text-xl text-slate-900 dark:text-slate-100">
                  Verifica Completata!
                </h3>
                <p className="text-xs text-slate-500">
                  Risultato per {studentName} in <strong>{subjectMeta.name}</strong>
                </p>
              </div>

              {/* Big Grade Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-50 to-sky-50 dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200/80 dark:border-slate-700 shadow-xs max-w-xs mx-auto space-y-1.5">
                <div className="text-4xl font-black text-sky-600 dark:text-sky-400">
                  {finalGrade}<span className="text-xl text-slate-400 font-bold">/10</span>
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
                <p className="text-xs text-slate-500 pt-0.5">
                  {userAnswers.filter((a) => a.isCorrect).length} risposte corrette su {questions.length}
                </p>
              </div>

              {/* Question Summary Review */}
              <div className="text-left space-y-2 pt-1">
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
                        <div className="font-semibold truncate flex items-center gap-1.5 flex-wrap">
                          <span>{i + 1}. {ans.questionText}</span>
                          {ans.usedHint && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md border border-amber-300/60 dark:border-amber-800/50 flex-shrink-0">
                              <Lightbulb className="w-2.5 h-2.5 text-amber-500" />
                              Con suggerimento
                            </span>
                          )}
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
              <div className="pt-2 space-y-2.5">
                {userAnswers.some((a) => !a.isCorrect) && !savedQuizRecord?.masteryCompleted && (
                  <button
                    type="button"
                    disabled={isReinforcementLoading}
                    onClick={() => handleStartReinforcement(false)}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 hover:from-amber-600 hover:via-orange-600 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 group"
                  >
                    <Sparkles className="w-4 h-4 text-amber-200 group-hover:scale-110 transition-transform" />
                    <span>
                      Ripassa gli errori e punta al 10/10 ({userAnswers.filter((a) => !a.isCorrect).length}{' '}
                      {userAnswers.filter((a) => !a.isCorrect).length === 1 ? 'lacuna' : 'lacune'})
                    </span>
                  </button>
                )}

                {savedQuizRecord?.masteryCompleted && (
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-center gap-2">
                    <Trophy className="w-4 h-4 text-emerald-600" />
                    <span>Hai già completato il ripasso con padronanza al 100%!</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Avvia un&apos;altra verifica</span>
                </button>
              </div>
            </div>
          )}

          {/* REINFORCEMENT LOADING STATE */}
          {isReinforcementLoading && (
            <div className="text-center py-12 space-y-4">
              <Loader2 className="w-10 h-10 text-amber-500 animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Socrate sta preparando la scheda di ripasso mirata...
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Analisi delle risposte errate, estrazione dei concetti chiave e composizione di nuove domande su misura.
                </p>
              </div>
            </div>
          )}

          {/* REINFORCEMENT VIEW 1: SCHEDA DI RIPASSO MIRATO */}
          {reinforcementStage === 'recap' && !isReinforcementLoading && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs flex-shrink-0 mt-0.5">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Scheda di Ripasso di Socrate
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Nessun problema per gli errori! Sbagliare è il modo migliore per imparare. Leggi con calma i concetti e le regole qui sotto prima di fare il mini-test di rivincita.
                  </p>
                </div>
              </div>

              {/* Cards dei punti da ripassare */}
              <div className="space-y-3">
                {reinforcementRecap.map((point, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/90 dark:border-amber-900/50 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                        {point.concept}
                      </h4>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {point.summary}
                    </p>

                    {point.tip && (
                      <div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 text-amber-950 dark:text-amber-100 text-xs flex items-start gap-2">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="font-semibold text-amber-800 dark:text-amber-300">
                            Il trucco di Socrate:
                          </span>{' '}
                          <span className="opacity-95">{point.tip}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleLaunchReinforcementTest}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Target className="w-4 h-4" />
                  <span>
                    Inizia il Mini-Test di Rivincita ({reinforcementQuestions.length}{' '}
                    {reinforcementQuestions.length === 1 ? 'domanda' : 'domande'})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setReinforcementStage('idle')}
                  className="w-full py-2.5 px-4 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold text-xs transition-colors cursor-pointer text-center"
                >
                  Torna alla schermata del punteggio
                </button>
              </div>
            </div>
          )}

          {/* REINFORCEMENT VIEW 2: ACTIVE REINFORCEMENT QUESTION SCREEN */}
          {reinforcementStage === 'testing' && !isReinforcementLoading && currentReinforcementQ && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                    <Target className="w-3.5 h-3.5" />
                    <span>Mini-Test di Rivincita &bull; Domanda {reinforcementCurrentIndex + 1} di {reinforcementQuestions.length}</span>
                  </span>
                  <span>{Math.round(((reinforcementCurrentIndex + 1) / reinforcementQuestions.length) * 100)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${((reinforcementCurrentIndex + 1) / reinforcementQuestions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-snug">
                  {currentReinforcementQ.question}
                </h3>

                {/* Suggerimento maieutico */}
                {!reinforcementIsConfirmed && (
                  <div className="pt-0.5">
                    {!reinforcementShowHint ? (
                      <button
                        type="button"
                        onClick={() => {
                          setReinforcementShowHint(true);
                          setReinforcementUsedHintMap((prev) => ({ ...prev, [reinforcementCurrentIndex]: true }));
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200/80 dark:border-amber-800/60 transition-all cursor-pointer shadow-2xs group"
                      >
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
                        <span>Suggerimento</span>
                      </button>
                    ) : (
                      <div className="p-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-950 dark:text-amber-100 text-xs animate-in fade-in duration-200 space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          <span>Suggerimento di Socrate:</span>
                        </div>
                        <p className="leading-relaxed opacity-95">
                          {currentReinforcementQ.hint || 'Rivedi i concetti della scheda di ripasso e applicali passo dopo passo.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {currentReinforcementQ.options.map((option, idx) => {
                  const isSelected = reinforcementSelectedOption === idx;
                  const isCorrect = idx === currentReinforcementQ.correctOptionIndex;
                  let optionStyle = 'border-slate-200/80 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 bg-white dark:bg-slate-900';

                  if (reinforcementIsConfirmed) {
                    if (isCorrect) {
                      optionStyle = 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200';
                    } else if (isSelected && !isCorrect) {
                      optionStyle = 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
                    } else {
                      optionStyle = 'opacity-40 border-slate-200 dark:border-slate-800';
                    }
                  } else if (isSelected) {
                    optionStyle = 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={reinforcementIsConfirmed}
                      onClick={() => setReinforcementSelectedOption(idx)}
                      className={`w-full p-3.5 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-3 cursor-pointer ${optionStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{option}</span>
                      </div>

                      {reinforcementIsConfirmed && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      )}
                      {reinforcementIsConfirmed && isSelected && !isCorrect && (
                        <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation after confirmation */}
              {reinforcementIsConfirmed && (
                <div
                  className={`p-4 rounded-2xl border text-xs sm:text-sm animate-in fade-in duration-200 space-y-1.5 ${
                    reinforcementSelectedOption === currentReinforcementQ.correctOptionIndex
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      : 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    {reinforcementSelectedOption === currentReinforcementQ.correctOptionIndex ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Risposta esatta! Hai fatto tuo questo concetto!</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>Socrate spiega:</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">{currentReinforcementQ.explanation}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2">
                {!reinforcementIsConfirmed ? (
                  <button
                    type="button"
                    disabled={reinforcementSelectedOption === null}
                    onClick={handleConfirmReinforcementAnswer}
                    className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                  >
                    Conferma Risposta
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextReinforcementQuestion}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-emerald-500/20"
                  >
                    <span>
                      {reinforcementCurrentIndex < reinforcementQuestions.length - 1
                        ? 'Prossima Domanda'
                        : 'Vedi Risultato del Ripasso'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* REINFORCEMENT VIEW 3: 100% MASTERY SUCCESS CELEBRATION */}
          {reinforcementStage === 'success' && !isReinforcementLoading && (
            <div className="space-y-6 text-center animate-in zoom-in-95 duration-200 py-2">
              <div className="space-y-2">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 via-amber-500 to-emerald-500 text-white mx-auto flex items-center justify-center text-3xl shadow-xl shadow-amber-500/25">
                  <Trophy className="w-8 h-8" />
                </div>
                <h3 className="font-extrabold text-xl text-slate-900 dark:text-slate-100">
                  Obiettivo Raggiunto: 100% Padronanza!
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Grandissimo lavoro {studentName}! Hai risposto correttamente a tutte le domande del ripasso. Le lacune sono state completamente colmate!
                </p>
              </div>

              {/* Badge & Achievement Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-sky-950/30 border border-emerald-200 dark:border-emerald-800 shadow-xs max-w-sm mx-auto space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Verifica Recuperata con Successo!</span>
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  10/10 Padronanza
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Tutti i concetti sono ora chiari e salvati nel tuo percorso didattico.
                </p>
              </div>

              {/* Summary of answered questions */}
              <div className="text-left space-y-2 pt-1 max-w-md mx-auto">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Domande di recupero superate:
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {reinforcementAnswers.map((ans, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between gap-2"
                    >
                      <div className="truncate min-w-0 font-medium">
                        {i + 1}. {ans.questionText}
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full py-3 px-4 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Avvia una nuova verifica</span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-2.5 px-4 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold text-xs transition-colors cursor-pointer text-center"
                >
                  Concludi e chiudi
                </button>
              </div>
            </div>
          )}

          {/* REINFORCEMENT VIEW 4: PARTIAL REINFORCEMENT RESULTS */}
          {reinforcementStage === 'partial' && !isReinforcementLoading && (
            <div className="space-y-5 text-center animate-in zoom-in-95 duration-200 py-2">
              <div className="space-y-1.5">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto text-2xl">
                  <Target className="w-7 h-7" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">
                  Stai facendo ottimi progressi!
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Hai risposto correttamente a {reinforcementAnswers.filter((a) => a.isCorrect).length} su{' '}
                  {reinforcementQuestions.length} domande di recupero.
                </p>
              </div>

              {/* Question list review */}
              <div className="text-left space-y-2 pt-1 max-w-md mx-auto">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Esito del mini-test:
                </div>
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {reinforcementAnswers.map((ans, i) => (
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

              {/* Action buttons with safety valve */}
              <div className="pt-2 space-y-2">
                {reinforcementAttempt < 2 ? (
                  <button
                    type="button"
                    onClick={() => handleStartReinforcement(true)}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>
                      Riprova il ripasso sulle ultime lacune (
                      {reinforcementAnswers.filter((a) => !a.isCorrect).length}{' '}
                      {reinforcementAnswers.filter((a) => !a.isCorrect).length === 1 ? 'concetto' : 'concetti'})
                    </span>
                  </button>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      💡 Consiglio didattico di Socrate:
                    </p>
                    <p>
                      Hai già affrontato 2 round di ripasso intenso. Fai una breve pausa oppure torna nella stanza di studio e fai domande a Socrate per chiarire i passaggi più complessi!
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Avvia una nuova verifica</span>
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium text-xs transition-colors cursor-pointer text-center"
                >
                  Chiudi e torna allo studio
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
