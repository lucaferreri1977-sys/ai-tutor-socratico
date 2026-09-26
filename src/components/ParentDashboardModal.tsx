'use client';

import React, { useState, useEffect } from 'react';
import { StudentId, STUDENTS, SUBJECTS, SubjectId, QuizTestRecord } from '@/lib/types';
import { X, ShieldCheck, BarChart3, MessageSquare, Award, ArrowLeft, ChevronRight, CheckCircle2, XCircle, Lock } from 'lucide-react';
import { MathMarkdown } from './MathMarkdown';

interface ParentDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  authToken: string;
  isParentRole: boolean;
}

export function ParentDashboardModal({
  isOpen,
  onClose,
  authToken,
  isParentRole,
}: ParentDashboardModalProps) {
  const [parentToken, setParentToken] = useState<string>(isParentRole ? authToken : '');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'stats' | 'sessions' | 'quizzes'>('stats');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<'all' | 'alessio' | 'mattia'>('all');
  const [analytics, setAnalytics] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<QuizTestRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewingSession, setViewingSession] = useState<any | null>(null);
  const [viewingQuiz, setViewingQuiz] = useState<QuizTestRecord | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);

  useEffect(() => {
    if (isParentRole) {
      setParentToken(authToken);
    }
  }, [isParentRole, authToken]);

  useEffect(() => {
    if (isOpen && parentToken) {
      fetchAnalytics(parentToken);
      fetchQuizzes(parentToken);
    }
  }, [isOpen, parentToken]);

  const handleVerifyParentPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;

    setPinLoading(true);
    setPinError(null);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'parent', pin: pinInput.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setParentToken(pinInput.trim());
        fetchAnalytics(pinInput.trim());
        fetchQuizzes(pinInput.trim());
      } else {
        setPinError(data.error || 'PIN Genitori non valido.');
      }
    } catch {
      setPinError('Errore di connessione.');
    } finally {
      setPinLoading(false);
    }
  };

  const fetchAnalytics = async (token: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/parent/analytics', {
        headers: { 'x-user-auth': token, 'x-family-pin': token },
      });
      const data = await res.json();
      if (res.ok && data.stats) {
        setAnalytics(data.stats);
      }
    } catch (e) {
      console.error('Failed to load parent analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizzes = async (token: string) => {
    try {
      const res = await fetch('/api/quiz', {
        headers: { 'x-user-auth': token, 'x-family-pin': token },
      });
      const data = await res.json();
      if (res.ok && data.quizzes) {
        setQuizzes(data.quizzes);
      }
    } catch (e) {
      console.error('Failed to load quiz records:', e);
    }
  };

  const loadSessionDetails = async (sessionId: string) => {
    if (!parentToken) return;
    setLoadingSession(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        headers: { 'x-user-auth': parentToken, 'x-family-pin': parentToken },
      });
      const data = await res.json();
      if (res.ok && data.session) {
        setViewingSession(data.session);
      }
    } catch (e) {
      console.error('Failed to load session details:', e);
    } finally {
      setLoadingSession(false);
    }
  };

  if (!isOpen) return null;

  const filteredSessions = analytics?.allSessions?.filter((s: any) => {
    if (selectedStudentFilter === 'all') return true;
    return s.studentId === selectedStudentFilter;
  }) || [];

  const filteredQuizzes = quizzes.filter((q) => {
    if (selectedStudentFilter === 'all') return true;
    return q.studentId === selectedStudentFilter;
  });

  // Calculate Average Grades
  const alessioQuizzes = quizzes.filter((q) => q.studentId === 'alessio');
  const mattiaQuizzes = quizzes.filter((q) => q.studentId === 'mattia');

  const alessioAvg = alessioQuizzes.length > 0
    ? (alessioQuizzes.reduce((acc, q) => acc + (q.grade || 0), 0) / alessioQuizzes.length).toFixed(1)
    : '-';

  const mattiaAvg = mattiaQuizzes.length > 0
    ? (mattiaQuizzes.reduce((acc, q) => acc + (q.grade || 0), 0) / mattiaQuizzes.length).toFixed(1)
    : '-';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Area Riservata Genitori
              </h2>
              <p className="text-xs text-slate-500">
                Monitoraggio dello studio e test di verifica per Alessio e Mattia
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PIN Verification Prompt if not authenticated as parent */}
        {!parentToken ? (
          <div className="p-8 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 mx-auto flex items-center justify-center text-2xl">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Accesso Riservato ai Genitori
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Inserisci il PIN Genitori a 4 cifre per sbloccare la dashboard.
              </p>
            </div>

            <form onSubmit={handleVerifyParentPin} className="space-y-3">
              <input
                type="password"
                inputMode="numeric"
                autoFocus
                maxLength={6}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(null);
                }}
                placeholder="PIN Genitori"
                className="w-full text-center tracking-[0.3em] font-mono text-xl py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-hidden focus:border-amber-500"
              />
              {pinError && <p className="text-xs text-rose-500 font-medium">{pinError}</p>}
              <button
                type="submit"
                disabled={pinLoading || !pinInput.trim()}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {pinLoading ? 'Verifica...' : 'Accedi all\'Area Genitori'}
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            {!viewingSession && !viewingQuiz && (
              <div className="px-5 pt-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveTab('stats')}
                    className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'stats'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" /> Panoramica
                  </button>
                  <button
                    onClick={() => setActiveTab('quizzes')}
                    className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'quizzes'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Award className="w-4 h-4 text-amber-600" /> Test & Voti ({quizzes.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('sessions')}
                    className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'sessions'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" /> Trascrizioni Chat
                  </button>
                </div>

                {/* Student Filter */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
                  <button
                    onClick={() => setSelectedStudentFilter('all')}
                    className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                      selectedStudentFilter === 'all' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold' : 'text-slate-500'
                    }`}
                  >
                    Tutti
                  </button>
                  <button
                    onClick={() => setSelectedStudentFilter('alessio')}
                    className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                      selectedStudentFilter === 'alessio' ? 'bg-white dark:bg-slate-900 text-sky-600 font-semibold shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    👦 Alessio
                  </button>
                  <button
                    onClick={() => setSelectedStudentFilter('mattia')}
                    className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                      selectedStudentFilter === 'mattia' ? 'bg-white dark:bg-slate-900 text-indigo-600 font-semibold shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    🧒 Mattia
                  </button>
                </div>
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-5">
              {/* SUB-VIEW: Quiz Details Viewer */}
              {viewingQuiz ? (
                <div className="space-y-4">
                  <button
                    onClick={() => setViewingQuiz(null)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Torna all&apos;elenco test
                  </button>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {viewingQuiz.studentName === 'Alessio' ? '👦 Alessio' : '🧒 Mattia'}
                        </span>
                        <span>•</span>
                        <span>{viewingQuiz.subjectName}</span>
                        <span>•</span>
                        <span>{viewingQuiz.topic}</span>
                      </div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mt-0.5">
                        Valutazione conseguita: <strong className="text-sky-600 text-lg">{viewingQuiz.grade}/10</strong> ({viewingQuiz.score}/{viewingQuiz.maxScore} corrette)
                      </h3>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(viewingQuiz.completedAt).toLocaleDateString([], {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Feedback summary */}
                  {viewingQuiz.feedback && (
                    <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs">
                      <strong>Giudizio del tutor:</strong> {viewingQuiz.feedback}
                    </div>
                  )}

                  {/* Answers breakdown */}
                  <div className="space-y-3 pt-2">
                    <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Dettaglio Domande del Test:
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
                          {ans.isCorrect ? 'Risposta corretta data dallo studente.' : 'Risposta errata fornita dallo studente.'}
                        </div>
                        <p className="text-[11px] opacity-80 pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                          <strong>Spiegazione:</strong> {ans.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : viewingSession ? (
                /* SUB-VIEW: Single Session Transcript Viewer */
                <div className="space-y-4">
                  <button
                    onClick={() => setViewingSession(null)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Torna all&apos;elenco sessioni
                  </button>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{viewingSession.studentName}</span>
                        <span>•</span>
                        <span>{SUBJECTS[viewingSession.subject as SubjectId]?.name || viewingSession.subject}</span>
                      </div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mt-0.5">
                        {viewingSession.title}
                      </h3>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(viewingSession.updatedAt).toLocaleDateString([], {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Transcript list */}
                  <div className="space-y-3 pt-2">
                    {viewingSession.messages?.map((msg: any, idx: number) => {
                      const isAssistant = msg.role === 'assistant';
                      return (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                            isAssistant
                              ? 'bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50'
                              : 'bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 ml-4'
                          }`}
                        >
                          <div className="font-bold text-xs mb-1 text-slate-600 dark:text-slate-300">
                            {isAssistant ? '🦉 Socrate (Tutor):' : `👤 ${viewingSession.studentName}:`}
                          </div>
                          <MathMarkdown content={msg.content} />
                          {msg.imageUrl && (
                            <div className="mt-2 text-xs text-sky-600">
                              📷 [Foto del compito allegata dal ragazzo]
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : activeTab === 'quizzes' ? (
                /* TAB 2: Quizzes and Test Results */
                <div className="space-y-5">
                  {/* Quizzes Average Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-lg">👦 Alessio</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-200/60 text-sky-800 dark:bg-sky-900 dark:text-sky-300">
                          {alessioQuizzes.length} test svolti
                        </span>
                      </div>
                      <div className="pt-2">
                        <span className="text-[11px] text-slate-500 uppercase font-semibold">Media Voti</span>
                        <p className="text-3xl font-extrabold text-sky-600 dark:text-sky-400">
                          {alessioAvg} <span className="text-sm font-normal text-slate-400">/ 10</span>
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-lg">🧒 Mattia</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-200/60 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                          {mattiaQuizzes.length} test svolti
                        </span>
                      </div>
                      <div className="pt-2">
                        <span className="text-[11px] text-slate-500 uppercase font-semibold">Media Voti</span>
                        <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                          {mattiaAvg} <span className="text-sm font-normal text-slate-400">/ 10</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quizzes List */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Elenco Test Effettuati ({filteredQuizzes.length}):
                    </h4>

                    {filteredQuizzes.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 text-xs sm:text-sm">
                        Nessun test di apprendimento registrato ancora. I ragazzi possono avviarlo direttamente dalla stanza della materia con il pulsante &quot;Test con Voto&quot;!
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
                            className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 hover:bg-sky-50/60 dark:hover:bg-sky-950/40 border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {quiz.studentName === 'Alessio' ? '👦 Alessio' : '🧒 Mattia'}
                                </span>
                                <span>•</span>
                                <span>{subjMeta.emoji} {subjMeta.name}</span>
                                <span>•</span>
                                <span className="text-[11px] text-slate-400">{dateStr}</span>
                              </div>
                              <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {quiz.topic}
                              </h4>
                            </div>

                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className={`px-2.5 py-1 rounded-xl font-bold text-xs ${
                                quiz.grade >= 8
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : quiz.grade >= 6
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              }`}>
                                Voto: {quiz.grade}/10
                              </div>
                              <div className="flex items-center gap-1 text-sky-600 dark:text-sky-400 text-xs font-semibold group-hover:translate-x-0.5 transition-transform">
                                <span className="hidden sm:inline">Dettagli</span>
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : activeTab === 'stats' ? (
                /* TAB 1: General Stats */
                <div className="space-y-5">
                  {/* Student Cards Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Alessio Card */}
                    <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-lg">👦</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-200/60 text-sky-800 dark:bg-sky-900 dark:text-sky-300">
                          Alessio
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <div>
                          <span className="text-[11px] text-slate-500 uppercase font-semibold">Sessioni</span>
                          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            {analytics?.alessio?.totalSessions || 0}
                          </p>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 uppercase font-semibold">Messaggi</span>
                          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            {analytics?.alessio?.totalMessages || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Mattia Card */}
                    <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-lg">🧒</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-200/60 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                          Mattia
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <div>
                          <span className="text-[11px] text-slate-500 uppercase font-semibold">Sessioni</span>
                          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            {analytics?.mattia?.totalSessions || 0}
                          </p>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 uppercase font-semibold">Messaggi</span>
                          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            {analytics?.mattia?.totalMessages || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Informative Note for Parents */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      💡 Monitoraggio trasparente dei compiti e test
                    </h4>
                    <p className="leading-relaxed">
                      Socrate salva automaticamente ogni sessione e ogni test di apprendimento nel tuo database Firebase sicuro. Clicca sulla scheda{' '}
                      <strong>&quot;Test & Voti&quot;</strong> per verificare i voti ottenuti e le domande corrette/errate, oppure su{' '}
                      <strong>&quot;Trascrizioni Chat&quot;</strong> per leggere il dialogo integrale con Socrate.
                    </p>
                  </div>
                </div>
              ) : (
                /* TAB 3: Sessions Tab (Chat History Inspector) */
                <div className="space-y-2">
                  {filteredSessions.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs sm:text-sm">
                      Nessuna sessione trovata per questo filtro.
                    </div>
                  ) : (
                    filteredSessions.map((sess: any) => {
                      const subjMeta = SUBJECTS[sess.subject as SubjectId] || SUBJECTS.matematica;
                      const dateStr = new Date(sess.updatedAt).toLocaleDateString([], {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <div
                          key={sess.id}
                          onClick={() => loadSessionDetails(sess.id)}
                          className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 hover:bg-sky-50/60 dark:hover:bg-sky-950/40 border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {sess.studentName === 'Alessio' ? '👦 Alessio' : '🧒 Mattia'}
                              </span>
                              <span>•</span>
                              <span>{subjMeta.emoji} {subjMeta.name}</span>
                              <span>•</span>
                              <span className="text-[11px] text-slate-400">{dateStr}</span>
                            </div>
                            <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {sess.title}
                            </h4>
                          </div>

                          <div className="flex items-center gap-1 text-sky-600 dark:text-sky-400 text-xs font-semibold group-hover:translate-x-0.5 transition-transform flex-shrink-0">
                            <span>Rileggi</span>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
