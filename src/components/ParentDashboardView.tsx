'use client';

import React, { useState, useEffect } from 'react';
import { AuthSession, StudentId, QuizTestRecord, SubjectId, SUBJECTS } from '@/lib/types';
import {
  ShieldCheck,
  BarChart3,
  Award,
  MessageSquare,
  LogOut,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  BookOpen,
  Calendar,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { MathMarkdown } from './MathMarkdown';

interface ParentDashboardViewProps {
  currentUser: AuthSession;
  onLogout: () => void;
}

export function ParentDashboardView({ currentUser, onLogout }: ParentDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'quizzes' | 'sessions'>('stats');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<'all' | 'alessio' | 'mattia'>('all');
  const [analytics, setAnalytics] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<QuizTestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingQuiz, setViewingQuiz] = useState<QuizTestRecord | null>(null);
  const [viewingSession, setViewingSession] = useState<any | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);

  // Fetch parent analytics and quizzes on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [analyticsRes, quizRes] = await Promise.all([
          fetch('/api/parent/analytics', {
            headers: {
              'x-user-auth': currentUser.token,
              'x-family-pin': currentUser.token,
            },
          }),
          fetch('/api/quiz', {
            headers: {
              'x-user-auth': currentUser.token,
              'x-family-pin': currentUser.token,
            },
          }),
        ]);

        if (analyticsRes.ok) {
          const data = await analyticsRes.json();
          if (data.stats) setAnalytics(data.stats);
        }

        if (quizRes.ok) {
          const data = await quizRes.json();
          if (data.quizzes) setQuizzes(data.quizzes);
        }
      } catch (err) {
        console.error('Failed to fetch parent dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser.token]);

  // Load a single chat session transcript
  const loadSessionDetails = async (sessionId: string) => {
    setLoadingSession(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        headers: {
          'x-user-auth': currentUser.token,
          'x-family-pin': currentUser.token,
        },
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

  // Filtered lists
  const filteredSessions =
    analytics?.allSessions?.filter((s: any) => {
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

  const alessioAvg =
    alessioQuizzes.length > 0
      ? (alessioQuizzes.reduce((acc, q) => acc + (q.grade || 0), 0) / alessioQuizzes.length).toFixed(1)
      : '-';

  const mattiaAvg =
    mattiaQuizzes.length > 0
      ? (mattiaQuizzes.reduce((acc, q) => acc + (q.grade || 0), 0) / mattiaQuizzes.length).toFixed(1)
      : '-';

  const overallAvg =
    filteredQuizzes.length > 0
      ? (filteredQuizzes.reduce((acc, q) => acc + (q.grade || 0), 0) / filteredQuizzes.length).toFixed(1)
      : '-';

  // Aggregate subject stats
  const subjectFrequency: Record<string, number> = {};
  filteredSessions.forEach((s: any) => {
    const subj = s.subject || 'matematica';
    subjectFrequency[subj] = (subjectFrequency[subj] || 0) + 1;
  });

  const sortedSubjects = Object.entries(subjectFrequency).sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100">
      {/* Top Header dedicato ai Genitori */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-tight">
                  Area Genitori
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                  Statistiche
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Monitoraggio dello studio e verifiche di Alessio e Mattia
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <span>👨‍👩‍👦</span>
              <span className="hidden sm:inline">Genitori</span>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer"
              title="Esci dall'Area Genitori"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Esci</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* VIEW 1: Quiz Detail Modal / Viewer */}
        {viewingQuiz ? (
          <div className="space-y-4 animate-in fade-in duration-150">
            <button
              type="button"
              onClick={() => setViewingQuiz(null)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Torna alle verifiche
            </button>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {viewingQuiz.studentName === 'Alessio' ? '👦 Alessio' : '🧒 Mattia'}
                  </span>
                  <span>&bull;</span>
                  <span>{viewingQuiz.subjectName}</span>
                  <span>&bull;</span>
                  <span className="truncate">{viewingQuiz.topic}</span>
                </div>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-sky-600 dark:text-sky-400">
                    {viewingQuiz.grade}/10
                  </span>
                  <span className="text-xs text-slate-500">
                    ({viewingQuiz.score}/{viewingQuiz.maxScore} risposte esatte &bull; {viewingQuiz.percentage}%)
                  </span>
                </div>
              </div>

              <span className="text-xs text-slate-400">
                {new Date(viewingQuiz.completedAt).toLocaleDateString([], {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {viewingQuiz.feedback && (
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs sm:text-sm">
                <strong>Giudizio del tutor:</strong> {viewingQuiz.feedback}
              </div>
            )}

            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Dettaglio Domande e Risposte:
              </h3>

              {viewingQuiz.answers?.map((ans, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border text-xs sm:text-sm space-y-2 ${
                    ans.isCorrect
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200'
                      : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 text-rose-950 dark:text-rose-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 font-semibold">
                    <span>
                      {idx + 1}. {ans.questionText}
                    </span>
                    {ans.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    )}
                  </div>

                  <div className="text-xs opacity-90">
                    {ans.isCorrect
                      ? '✅ Risposta corretta data dallo studente.'
                      : '❌ Risposta errata selezionata dallo studente.'}
                  </div>

                  <p className="text-xs opacity-80 pt-1.5 border-t border-slate-200/40 dark:border-slate-700/40">
                    <strong>Spiegazione didattica:</strong> {ans.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : viewingSession ? (
          /* VIEW 2: Chat Session Transcript Viewer */
          <div className="space-y-4 animate-in fade-in duration-150">
            <button
              type="button"
              onClick={() => setViewingSession(null)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Torna all&apos;elenco sessioni
            </button>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {viewingSession.studentName}
                  </span>
                  <span>&bull;</span>
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

            {/* Transcript messages */}
            <div className="space-y-3 pt-2">
              {viewingSession.messages?.map((msg: any, idx: number) => {
                const isAssistant = msg.role === 'assistant';
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
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
                      <div className="mt-2 text-xs text-sky-600 font-semibold">
                        📷 [Foto del compito caricata dallo studente]
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* VIEW 3: Standard Dashboard Overview with Tabs and Filters */
          <>
            {/* Top Toolbar: Student Filter & Tab Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              {/* Student Filter Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setSelectedStudentFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedStudentFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  👥 Entrambi
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStudentFilter('alessio')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedStudentFilter === 'alessio'
                      ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  👦 Alessio
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStudentFilter('mattia')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedStudentFilter === 'mattia'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  🧒 Mattia
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('stats')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'stats'
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Statistiche</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('quizzes')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'quizzes'
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Verifiche ({filteredQuizzes.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('sessions')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'sessions'
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Trascrizioni ({filteredSessions.length})</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-400">Caricamento statistiche e verifiche...</p>
              </div>
            ) : (
              <>
                {/* TAB 1: STATS OVERVIEW */}
                {activeTab === 'stats' && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    {/* Key Metric KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      {/* Media Voti */}
                      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Media Verifiche
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400">
                            {overallAvg}
                          </span>
                          <span className="text-xs text-slate-400">/ 10</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Su {filteredQuizzes.length} verifiche completate
                        </p>
                      </div>

                      {/* Verifiche Totali */}
                      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Test Svolti
                        </span>
                        <div className="text-3xl sm:text-4xl font-black text-sky-600 dark:text-sky-400">
                          {filteredQuizzes.length}
                        </div>
                        <p className="text-[11px] text-slate-400">Valutati in decimi da Socrate</p>
                      </div>

                      {/* Sessioni di studio */}
                      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Sessioni di Studio
                        </span>
                        <div className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">
                          {filteredSessions.length}
                        </div>
                        <p className="text-[11px] text-slate-400">Attività nelle stanze didattiche</p>
                      </div>

                      {/* Domande / Messaggi totali */}
                      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Interazioni Totali
                        </span>
                        <div className="text-3xl sm:text-4xl font-black text-indigo-600 dark:text-indigo-400">
                          {selectedStudentFilter === 'alessio'
                            ? analytics?.alessio?.totalMessages || 0
                            : selectedStudentFilter === 'mattia'
                            ? analytics?.mattia?.totalMessages || 0
                            : (analytics?.alessio?.totalMessages || 0) + (analytics?.mattia?.totalMessages || 0)}
                        </div>
                        <p className="text-[11px] text-slate-400">Domande e risposte con Socrate</p>
                      </div>
                    </div>

                    {/* Breakdown per figlio quando "Entrambi" è selezionato */}
                    {selectedStudentFilter === 'all' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Scheda Alessio */}
                        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">👦</span>
                              <div>
                                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Alessio</h3>
                                <p className="text-[11px] text-slate-400">3ª Media</p>
                              </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 text-xs font-bold">
                              Media {alessioAvg}/10
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center pt-1">
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                              <span className="text-[10px] text-slate-400 font-medium block">Test</span>
                              <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                                {alessioQuizzes.length}
                              </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                              <span className="text-[10px] text-slate-400 font-medium block">Sessioni</span>
                              <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                                {analytics?.alessio?.totalSessions || 0}
                              </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                              <span className="text-[10px] text-slate-400 font-medium block">Messaggi</span>
                              <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                                {analytics?.alessio?.totalMessages || 0}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Scheda Mattia */}
                        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">🧒</span>
                              <div>
                                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Mattia</h3>
                                <p className="text-[11px] text-slate-400">1ª Media</p>
                              </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-xs font-bold">
                              Media {mattiaAvg}/10
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center pt-1">
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                              <span className="text-[10px] text-slate-400 font-medium block">Test</span>
                              <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                                {mattiaQuizzes.length}
                              </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                              <span className="text-[10px] text-slate-400 font-medium block">Sessioni</span>
                              <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                                {analytics?.mattia?.totalSessions || 0}
                              </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                              <span className="text-[10px] text-slate-400 font-medium block">Messaggi</span>
                              <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                                {analytics?.mattia?.totalMessages || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Materie Più Studiate */}
                    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-sky-600" />
                        <span>Materie Più Studiate</span>
                      </h3>

                      {sortedSubjects.length === 0 ? (
                        <p className="text-xs text-slate-400 py-4 text-center">
                          Nessuna sessione di studio registrata ancora.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                          {sortedSubjects.map(([subjId, count]) => {
                            const meta = SUBJECTS[subjId as SubjectId];
                            return (
                              <div
                                key={subjId}
                                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="text-xl select-none">{meta?.emoji || '📚'}</span>
                                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                    {meta?.name || subjId}
                                  </span>
                                </div>
                                <span className="px-2 py-0.5 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 text-xs font-bold flex-shrink-0">
                                  {count} {count === 1 ? 'sessione' : 'sessioni'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: QUIZZES AND TEST RESULTS */}
                {activeTab === 'quizzes' && (
                  <div className="space-y-3 animate-in fade-in duration-150">
                    {filteredQuizzes.length === 0 ? (
                      <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center text-xl mx-auto">
                          📝
                        </div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Nessuna verifica completata per questo filtro.
                        </p>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          I ragazzi possono completare le verifiche direttamente dalle stanze di studio.
                        </p>
                      </div>
                    ) : (
                      filteredQuizzes.map((quiz) => {
                        const subjMeta = SUBJECTS[quiz.subject as SubjectId] || SUBJECTS.matematica;
                        const dateStr = new Date(quiz.completedAt).toLocaleDateString([], {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <div
                            key={quiz.id}
                            onClick={() => setViewingQuiz(quiz)}
                            className="p-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-sky-50/50 dark:hover:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 transition-all cursor-pointer flex items-center justify-between gap-3 group shadow-2xs"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {quiz.studentName === 'Alessio' ? '👦 Alessio' : '🧒 Mattia'}
                                </span>
                                <span>&bull;</span>
                                <span>
                                  {subjMeta.emoji} {subjMeta.name}
                                </span>
                                <span>&bull;</span>
                                <span className="text-[11px] text-slate-400">{dateStr}</span>
                              </div>
                              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {quiz.topic}
                              </h4>
                            </div>

                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div
                                className={`px-3 py-1 rounded-xl font-bold text-xs ${
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
                )}

                {/* TAB 3: SESSIONS & TRANSCRIPTS */}
                {activeTab === 'sessions' && (
                  <div className="space-y-3 animate-in fade-in duration-150">
                    {filteredSessions.length === 0 ? (
                      <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 flex items-center justify-center text-xl mx-auto">
                          💬
                        </div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Nessuna sessione trovata per questo filtro.
                        </p>
                      </div>
                    ) : (
                      filteredSessions.map((sess: any) => {
                        const subjMeta = SUBJECTS[sess.subject as SubjectId] || SUBJECTS.matematica;
                        const dateStr = new Date(sess.updatedAt).toLocaleDateString([], {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <div
                            key={sess.id}
                            onClick={() => loadSessionDetails(sess.id)}
                            className="p-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-sky-50/50 dark:hover:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 transition-all cursor-pointer flex items-center justify-between gap-3 group shadow-2xs"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {sess.studentName === 'Alessio' ? '👦 Alessio' : '🧒 Mattia'}
                                </span>
                                <span>&bull;</span>
                                <span>
                                  {subjMeta.emoji} {subjMeta.name}
                                </span>
                                <span>&bull;</span>
                                <span className="text-[11px] text-slate-400">{dateStr}</span>
                              </div>
                              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {sess.title}
                              </h4>
                            </div>

                            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 text-xs font-semibold group-hover:translate-x-0.5 transition-transform flex-shrink-0">
                              <span>Trascrizione</span>
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
